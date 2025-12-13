'use client';

import { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { GraphData, GraphNode, GraphEdge, ViewportTransform, InteractionState } from '@/types/graph';
import { GraphConfig } from '@/lib/graph-config';
import { calculateCircularLayout, applyPositionsToNodes } from '@/lib/layout';

interface ManualGraphProps {
  graphData: GraphData;
  config: GraphConfig;
  anchorNodeId?: string;
  onNodeClick?: (node: GraphNode) => void;
  onEdgeClick?: (edge: GraphEdge) => void;
}

export default function ManualGraph({
  graphData,
  config,
  anchorNodeId,
  onNodeClick,
  onEdgeClick,
}: ManualGraphProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [viewport, setViewport] = useState<ViewportTransform>({ x: 0, y: 0, zoom: 1 });
  const [interaction, setInteraction] = useState<InteractionState>({
    hoveredNodeId: null,
    hoveredEdgeId: null,
    selectedNodeId: null,
    selectedEdgeId: null,
  });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });

  // Update container size on mount and resize
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const updateSize = () => {
      const rect = container.getBoundingClientRect();
      setContainerSize({ width: rect.width, height: rect.height });
    };

    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  // Memoize nodes with positions to avoid recalculating on every render
  const nodesWithPositions = useMemo(() => {
    if (graphData.nodes.length === 0) return [];

    // If nodes already have positions (from preset layout), use them
    const hasPresetPositions = graphData.nodes.some(n => n.x !== undefined && n.y !== undefined);
    
    if (hasPresetPositions) {
      return graphData.nodes;
    } else {
      // Calculate circular layout only if container is ready
      if (containerSize.width === 0 || containerSize.height === 0) {
        return graphData.nodes;
      }
      const positions = calculateCircularLayout(graphData.nodes, {
        centerX: containerSize.width / 2,
        centerY: containerSize.height / 2,
      });
      return applyPositionsToNodes(graphData.nodes, positions);
    }
  }, [graphData, containerSize]);

  // Draw nodes on canvas - memoized to prevent unnecessary redraws
  const drawNodes = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { width, height } = canvas;
    ctx.clearRect(0, 0, width, height);

    // Apply viewport transform
    ctx.save();
    ctx.translate(viewport.x, viewport.y);
    ctx.scale(viewport.zoom, viewport.zoom);

    nodesWithPositions.forEach((node) => {
      if (node.x === undefined || node.y === undefined) return;

      const isAnchor = anchorNodeId === node.id;
      const isHovered = interaction.hoveredNodeId === node.id;
      const isSelected = interaction.selectedNodeId === node.id;

      let style = config.node;
      if (isAnchor) {
        style = config.anchorNode;
      } else if (isHovered || isSelected) {
        style = config.hoveredNode;
      }

      const x = node.x;
      const y = node.y;
      const radius = style.size / 2;

      // Draw node circle
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, 2 * Math.PI);
      ctx.fillStyle = style.backgroundColor;
      ctx.fill();

      if (style.borderWidth > 0) {
        ctx.strokeStyle = style.borderColor;
        ctx.lineWidth = style.borderWidth;
        ctx.stroke();
      }

      // Draw label
      if (node.label) {
        ctx.font = `${style.fontWeight} ${style.fontSize}px sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        // Draw text outline
        ctx.strokeStyle = style.textOutlineColor;
        ctx.lineWidth = style.textOutlineWidth * 2;
        ctx.strokeText(node.label, x, y);

        // Draw text
        ctx.fillStyle = style.textColor;
        ctx.fillText(node.label, x, y);
      }
    });

    ctx.restore();
  }, [nodesWithPositions, viewport, interaction, anchorNodeId, config]);

  // Render edges in SVG - optimized to only update changed edges
  const renderEdges = useCallback(() => {
    const svg = svgRef.current;
    if (!svg) return;

    // Use a fragment to batch DOM updates
    const fragment = document.createDocumentFragment();
    const edgeMap = new Map<string, { line: SVGLineElement; label?: SVGTextElement; outline?: SVGTextElement }>();

    // Get existing edges to reuse if possible
    const existingEdges = svg.querySelectorAll('.edge-line');
    existingEdges.forEach((el) => {
      const edgeId = el.getAttribute('data-edge-id');
      if (edgeId) {
        edgeMap.set(edgeId, { line: el as SVGLineElement });
      }
    });

    // Clear all existing edges first
    const allExisting = svg.querySelectorAll('.edge-line, .edge-label, .edge-outline');
    allExisting.forEach(el => el.remove());

    graphData.edges.forEach((edge) => {
      const sourceNode = nodesWithPositions.find(n => n.id === edge.source);
      const targetNode = nodesWithPositions.find(n => n.id === edge.target);

      if (!sourceNode || !targetNode || 
          sourceNode.x === undefined || sourceNode.y === undefined ||
          targetNode.x === undefined || targetNode.y === undefined) {
        return;
      }

      const isHovered = interaction.hoveredEdgeId === edge.id;
      const isSelected = interaction.selectedEdgeId === edge.id;
      const edgeStyle = (isHovered || isSelected) ? config.hoveredEdge : config.edge;

      // Apply viewport transform to coordinates
      const x1 = sourceNode.x * viewport.zoom + viewport.x;
      const y1 = sourceNode.y * viewport.zoom + viewport.y;
      const x2 = targetNode.x * viewport.zoom + viewport.x;
      const y2 = targetNode.y * viewport.zoom + viewport.y;

      // Create or reuse line element
      const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      line.setAttribute('class', 'edge-line');
      line.setAttribute('data-edge-id', edge.id);
      line.setAttribute('x1', x1.toString());
      line.setAttribute('y1', y1.toString());
      line.setAttribute('x2', x2.toString());
      line.setAttribute('y2', y2.toString());
      line.setAttribute('stroke', edgeStyle.color);
      line.setAttribute('stroke-width', edgeStyle.width.toString());
      line.setAttribute('opacity', edgeStyle.opacity.toString());
      line.style.cursor = 'pointer';
      line.style.pointerEvents = 'stroke';

      // Add click handler (only once)
      const handleClick = (e: MouseEvent) => {
        e.stopPropagation();
        onEdgeClick?.(edge);
      };
      line.addEventListener('click', handleClick);

      fragment.appendChild(line);

      // Add edge label only on hover or selection
      if (edge.label && (isHovered || isSelected)) {
        const midX = (x1 + x2) / 2;
        const midY = (y1 + y2) / 2;

        const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        text.setAttribute('class', 'edge-label');
        text.setAttribute('x', midX.toString());
        text.setAttribute('y', (midY - 10).toString());
        text.setAttribute('font-size', edgeStyle.fontSize.toString());
        text.setAttribute('fill', edgeStyle.textColor);
        text.setAttribute('text-anchor', 'middle');
        text.setAttribute('pointer-events', 'none');
        text.textContent = edge.label;

        // Add text outline effect
        const textOutline = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        textOutline.setAttribute('x', midX.toString());
        textOutline.setAttribute('y', (midY - 10).toString());
        textOutline.setAttribute('font-size', edgeStyle.fontSize.toString());
        textOutline.setAttribute('fill', edgeStyle.textOutlineColor);
        textOutline.setAttribute('text-anchor', 'middle');
        textOutline.setAttribute('stroke', edgeStyle.textOutlineColor);
        textOutline.setAttribute('stroke-width', (edgeStyle.textOutlineWidth * 2).toString());
        textOutline.textContent = edge.label;
        textOutline.style.pointerEvents = 'none';
        textOutline.setAttribute('class', 'edge-outline');

        fragment.appendChild(textOutline);
        fragment.appendChild(text);
      }
    });

    // Batch append all elements at once
    svg.appendChild(fragment);
  }, [graphData.edges, nodesWithPositions, viewport, interaction, config, onEdgeClick]);

  // Update canvas size
  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const resizeCanvas = () => {
      const rect = container.getBoundingClientRect();
      canvas.width = rect.width;
      canvas.height = rect.height;
      drawNodes();
    };

    resizeCanvas();
    const resizeObserver = new ResizeObserver(resizeCanvas);
    resizeObserver.observe(container);
    
    return () => {
      resizeObserver.disconnect();
      if (mouseMoveTimeoutRef.current !== null) {
        window.cancelAnimationFrame(mouseMoveTimeoutRef.current);
      }
    };
  }, [drawNodes]);

  // Redraw when data or viewport changes
  useEffect(() => {
    drawNodes();
  }, [drawNodes]);

  useEffect(() => {
    renderEdges();
  }, [renderEdges]);

  // Throttle mouse move for better performance
  const mouseMoveTimeoutRef = useRef<number | null>(null);
  const lastMouseMoveRef = useRef<React.MouseEvent | null>(null);

  // Pan handlers
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button !== 0) return; // Only left mouse button
    setIsDragging(true);
    setDragStart({ x: e.clientX - viewport.x, y: e.clientY - viewport.y });
  }, [viewport]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (isDragging) {
      // For dragging, update immediately
      setViewport(prev => ({
        ...prev,
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y,
      }));
    } else {
      // For hover detection, throttle to reduce calculations but make it more responsive
      lastMouseMoveRef.current = e;
      
      // Cancel any pending animation frame to make hover more responsive
      if (mouseMoveTimeoutRef.current !== null) {
        window.cancelAnimationFrame(mouseMoveTimeoutRef.current);
      }
      
      mouseMoveTimeoutRef.current = window.requestAnimationFrame(() => {
        const event = lastMouseMoveRef.current;
        if (!event) {
          mouseMoveTimeoutRef.current = null;
          return;
        }

        // Hover detection for nodes
        const canvas = canvasRef.current;
        if (!canvas) {
          mouseMoveTimeoutRef.current = null;
          return;
        }

        const rect = canvas.getBoundingClientRect();
        const x = (event.clientX - rect.left - viewport.x) / viewport.zoom;
        const y = (event.clientY - rect.top - viewport.y) / viewport.zoom;

        let nearestNode: GraphNode | null = null;
        let minDistance = Infinity;

        nodesWithPositions.forEach((node) => {
          if (node.x === undefined || node.y === undefined) return;
          const distance = Math.sqrt(
            Math.pow(x - node.x, 2) + Math.pow(y - node.y, 2)
          );
          const nodeRadius = anchorNodeId === node.id 
            ? config.anchorNode.size / 2 
            : config.node.size / 2;
          
          if (distance < nodeRadius + 5 && distance < minDistance) {
            minDistance = distance;
            nearestNode = node;
          }
        });

        let nearestEdge: GraphEdge | null = null;
        let minEdgeDistance = Infinity;
        const edgeHoverThreshold = 12 / viewport.zoom; // Scale threshold with zoom (increased for better hover detection)

        // Only check edges if no node is hovered
        if (!nearestNode) {
          graphData.edges.forEach((edge) => {
            const sourceNode = nodesWithPositions.find(n => n.id === edge.source);
            const targetNode = nodesWithPositions.find(n => n.id === edge.target);

            if (!sourceNode || !targetNode || 
                sourceNode.x === undefined || sourceNode.y === undefined ||
                targetNode.x === undefined || targetNode.y === undefined) {
              return;
            }

            // Calculate distance from point to line segment
            const x1 = sourceNode.x;
            const y1 = sourceNode.y;
            const x2 = targetNode.x;
            const y2 = targetNode.y;

            const A = x - x1;
            const B = y - y1;
            const C = x2 - x1;
            const D = y2 - y1;

            const dot = A * C + B * D;
            const lenSq = C * C + D * D;
            let param = -1;
            if (lenSq !== 0) param = dot / lenSq;

            let xx: number, yy: number;

            if (param < 0) {
              xx = x1;
              yy = y1;
            } else if (param > 1) {
              xx = x2;
              yy = y2;
            } else {
              xx = x1 + param * C;
              yy = y1 + param * D;
            }

            const dx = x - xx;
            const dy = y - yy;
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (distance < edgeHoverThreshold && distance < minEdgeDistance) {
              minEdgeDistance = distance;
              nearestEdge = edge;
            }
          });
        }

        setInteraction(prev => {
          // Only update if the hover state actually changed to avoid unnecessary re-renders
          if (prev.hoveredNodeId === (nearestNode?.id ?? null) && 
              prev.hoveredEdgeId === (nearestEdge?.id ?? null)) {
            mouseMoveTimeoutRef.current = null;
            return prev;
          }
          
          mouseMoveTimeoutRef.current = null;
          return {
            ...prev,
            hoveredNodeId: nearestNode?.id ?? null,
            hoveredEdgeId: nearestEdge?.id ?? null,
          };
        });
      });
    }
  }, [isDragging, dragStart, viewport, nodesWithPositions, anchorNodeId, config, graphData.edges]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleMouseLeave = useCallback(() => {
    setIsDragging(false);
    // Clear hover state when mouse leaves the canvas
    setInteraction(prev => ({
      ...prev,
      hoveredNodeId: null,
      hoveredEdgeId: null,
    }));
  }, []);

  // Zoom handler - using native event to allow preventDefault
  const handleWheel = useCallback((e: WheelEvent) => {
    e.preventDefault();
    
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const zoomFactor = e.deltaY > 0 ? 1 - config.wheelSensitivity : 1 + config.wheelSensitivity;
    const newZoom = Math.max(
      config.minZoom,
      Math.min(config.maxZoom, viewport.zoom * zoomFactor)
    );

    // Zoom towards mouse position
    const zoomChange = newZoom / viewport.zoom;
    setViewport(prev => ({
      x: mouseX - (mouseX - prev.x) * zoomChange,
      y: mouseY - (mouseY - prev.y) * zoomChange,
      zoom: newZoom,
    }));
  }, [viewport, config]);

  // Attach wheel event listener with passive: false to allow preventDefault
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.addEventListener('wheel', handleWheel, { passive: false });

    return () => {
      canvas.removeEventListener('wheel', handleWheel);
    };
  }, [handleWheel]);

  // Click handler for nodes
  const handleCanvasClick = useCallback((e: React.MouseEvent) => {
    if (isDragging) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left - viewport.x) / viewport.zoom;
    const y = (e.clientY - rect.top - viewport.y) / viewport.zoom;

    let clickedNode: GraphNode | null = null;
    let minDistance = Infinity;

    nodesWithPositions.forEach((node) => {
      if (node.x === undefined || node.y === undefined) return;
      const distance = Math.sqrt(
        Math.pow(x - node.x, 2) + Math.pow(y - node.y, 2)
      );
      const nodeRadius = anchorNodeId === node.id 
        ? config.anchorNode.size / 2 
        : config.node.size / 2;
      
      if (distance < nodeRadius + 5 && distance < minDistance) {
        minDistance = distance;
        clickedNode = node;
      }
    });

    if (clickedNode) {
      setInteraction(prev => ({
        ...prev,
        selectedNodeId: clickedNode!.id,
        selectedEdgeId: null,
      }));
      onNodeClick?.(clickedNode);
    } else {
      // Check if click is near an edge
      let clickedEdge: GraphEdge | null = null;
      let minEdgeDistance = Infinity;
      const edgeClickThreshold = 10 / viewport.zoom; // Scale threshold with zoom

      graphData.edges.forEach((edge) => {
        const sourceNode = nodesWithPositions.find(n => n.id === edge.source);
        const targetNode = nodesWithPositions.find(n => n.id === edge.target);

        if (!sourceNode || !targetNode || 
            sourceNode.x === undefined || sourceNode.y === undefined ||
            targetNode.x === undefined || targetNode.y === undefined) {
          return;
        }

        // Calculate distance from point to line segment
        const x1 = sourceNode.x;
        const y1 = sourceNode.y;
        const x2 = targetNode.x;
        const y2 = targetNode.y;

        const A = x - x1;
        const B = y - y1;
        const C = x2 - x1;
        const D = y2 - y1;

        const dot = A * C + B * D;
        const lenSq = C * C + D * D;
        let param = -1;
        if (lenSq !== 0) param = dot / lenSq;

        let xx: number, yy: number;

        if (param < 0) {
          xx = x1;
          yy = y1;
        } else if (param > 1) {
          xx = x2;
          yy = y2;
        } else {
          xx = x1 + param * C;
          yy = y1 + param * D;
        }

        const dx = x - xx;
        const dy = y - yy;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < edgeClickThreshold && distance < minEdgeDistance) {
          minEdgeDistance = distance;
          clickedEdge = edge;
        }
      });

      if (clickedEdge) {
        setInteraction(prev => ({
          ...prev,
          selectedNodeId: null,
          selectedEdgeId: clickedEdge!.id,
        }));
        onEdgeClick?.(clickedEdge);
      } else {
        setInteraction(prev => ({
          ...prev,
          selectedNodeId: null,
          selectedEdgeId: null,
        }));
      }
    }
  }, [isDragging, viewport, nodesWithPositions, anchorNodeId, config, onNodeClick, graphData.edges, onEdgeClick]);

  return (
    <div
      ref={containerRef}
      className="w-full h-full relative"
      style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
    >
      <svg
        ref={svgRef}
        className="absolute top-0 left-0"
        style={{ width: '100%', height: '100%', pointerEvents: 'none', zIndex: 1 }}
      />
      <canvas
        ref={canvasRef}
        className="absolute top-0 left-0"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
        onClick={handleCanvasClick}
        style={{ cursor: isDragging ? 'grabbing' : 'grab', zIndex: 2 }}
      />
    </div>
  );
}

