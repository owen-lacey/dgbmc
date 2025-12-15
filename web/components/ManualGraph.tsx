'use client';

import { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { GraphData, GraphNode, GraphEdge, ViewportTransform, InteractionState } from '@/types/graph';
import { GraphConfig } from '@/lib/graph-config';

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
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [viewport, setViewport] = useState<ViewportTransform>({ x: 0, y: 0, zoom: 1 });
  const [hasInitializedViewport, setHasInitializedViewport] = useState(false);
  const [interaction, setInteraction] = useState<InteractionState>({
    hoveredNodeId: null,
    hoveredEdgeId: null,
    selectedNodeId: null,
    selectedEdgeId: null,
  });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [animationKey, setAnimationKey] = useState(0);

  // Cache edge timings to ensure consistency between edge rendering and node timing
  const edgeTimingsCache = useRef<Map<string, { duration: number; delay: number; lineLength: number }>>(new Map());
  
  // Cache node timings to ensure consistency across renders
  const nodeTimingsCache = useRef<Map<string, { duration: number; delay: number }>>(new Map());

  // Track animation frame for smooth centering
  const animationFrameRef = useRef<number | null>(null);

  // Reset caches when animation key changes (new actor selected)
  useEffect(() => {
    edgeTimingsCache.current.clear();
    nodeTimingsCache.current.clear();
  }, [animationKey]);

  // Reset animations when anchor changes
  useEffect(() => {
    setAnimationKey(prev => prev + 1);
  }, [anchorNodeId]);

  // Memoize nodes with positions to avoid recalculating on every render
  const nodesWithPositions = useMemo(() => {
    if (graphData.nodes.length === 0) return [];

    // All nodes must have preset positions
    const hasPresetPositions = graphData.nodes.every(n => n.x !== undefined && n.y !== undefined);

    if (!hasPresetPositions) {
      throw new Error('ManualGraph requires all nodes to have preset positions (x and y coordinates)');
    }

    return graphData.nodes;
  }, [graphData]);

  // Center anchor node on screen when component mounts or anchor changes
  // On first render: set viewport immediately (no animation)
  // On subsequent anchor changes: animate smoothly
  useEffect(() => {
    if (!anchorNodeId || !containerRef.current || !svgRef.current) return;

    const anchorNode = nodesWithPositions.find(n => n.id === anchorNodeId);
    if (!anchorNode || anchorNode.x === undefined || anchorNode.y === undefined) return;

    // Cancel any ongoing animation
    if (animationFrameRef.current !== null) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }

    const container = containerRef.current;
    const centerX = container.clientWidth / 2;
    const centerY = container.clientHeight / 2;

    // Target zoom level (reset to 1)
    const targetZoom = 1;

    // Calculate target viewport position to center the anchor node
    // World to screen: screen = world * zoom + viewport
    // We want: centerX = anchorNode.x * zoom + viewport.x
    // So: viewport.x = centerX - anchorNode.x * zoom
    const targetX = centerX - anchorNode.x! * targetZoom;
    const targetY = centerY - anchorNode.y! * targetZoom;

    // On first render, set viewport immediately without animation
    if (!hasInitializedViewport) {
      setViewport({
        x: targetX,
        y: targetY,
        zoom: targetZoom,
      });
      setHasInitializedViewport(true);
      return;
    }

    // Capture start values once before animation begins
    // We intentionally read viewport here to capture its state at animation start
    // eslint-disable-next-line react-hooks/exhaustive-deps
    const startX = viewport.x;
    const startY = viewport.y;
    const startZoom = viewport.zoom;

    // Animation parameters
    const duration = 800; // milliseconds
    const startTime = performance.now();

    // Smooth easing function (ease-in-out-cubic)
    const easeInOutCubic = (t: number): number => {
      return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
    };

    // Animation loop
    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = easeInOutCubic(progress);

      // Interpolate viewport values
      const currentX = startX + (targetX - startX) * eased;
      const currentY = startY + (targetY - startY) * eased;
      const currentZoom = startZoom + (targetZoom - startZoom) * eased;

      setViewport({
        x: currentX,
        y: currentY,
        zoom: currentZoom,
      });

      if (progress < 1) {
        animationFrameRef.current = requestAnimationFrame(animate);
      } else {
        animationFrameRef.current = null;
      }
    };

    animationFrameRef.current = requestAnimationFrame(animate);

    // Cleanup: cancel animation on unmount or when dependencies change
    return () => {
      if (animationFrameRef.current !== null) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
    };
  }, [anchorNodeId, nodesWithPositions, hasInitializedViewport]);

  // Calculate animation timing for edges and nodes - CACHED to ensure consistency
  const getEdgeAnimationTiming = useCallback((edge: GraphEdge, sourceNode: GraphNode, targetNode: GraphNode) => {
    // Check cache first
    const cached = edgeTimingsCache.current.get(edge.id);
    if (cached) {
      return cached;
    }

    if (sourceNode.x === undefined || sourceNode.y === undefined || 
        targetNode.x === undefined || targetNode.y === undefined) {
      return { duration: 0.5, delay: 0, lineLength: 0 };
    }

    const lineLength = getLineLength(sourceNode.x, sourceNode.y, targetNode.x, targetNode.y);

    // Constant speed: pixels per second. Adjust this value to change line drawing speed.
    const pixelsPerSecond = 600; // Increased for faster line drawing
    const duration = lineLength / pixelsPerSecond;

    // Random delay for staggered start (0 to 0.8s) - reduced for quicker start
    const delay = Math.random() * 0.8;

    const timing = { duration, delay, lineLength };

    // Cache it!
    edgeTimingsCache.current.set(edge.id, timing);

    return timing;
  }, []);

  // Calculate animation delays for nodes - they should appear AFTER their connecting line finishes
  const getNodeAnimationTiming = useCallback((node: GraphNode, index: number) => {
    if (node.id === anchorNodeId) return { delay: 0, duration: 0 };

    // Check cache first
    const cached = nodeTimingsCache.current.get(node.id);
    if (cached) {
      return cached;
    }

    // Find the edge connecting anchor to this node
    const connectingEdge = graphData.edges.find(
      edge => (edge.source === anchorNodeId && edge.target === node.id) ||
              (edge.target === anchorNodeId && edge.source === node.id)
    );

    let delay: number;
    // Constant bounce duration for all nodes
    const duration = 0.4; // seconds - reduced for snappier animation

    if (!connectingEdge) {
      // Nodes without edges appear with a staggered delay
      delay = index * 0.1;
    } else {
      // Find anchor node
      const anchor = nodesWithPositions.find(n => n.id === anchorNodeId);
      if (!anchor || anchor.x === undefined || anchor.y === undefined ||
          node.x === undefined || node.y === undefined) {
        delay = index * 0.1;
      } else {
        // Get the edge animation timing
        const edgeTiming = getEdgeAnimationTiming(connectingEdge, anchor, node);

        // Node should start appearing when the line finishes drawing (with total delay)
        delay = edgeTiming.delay + edgeTiming.duration;
      }
    }

    const timing = { delay, duration };
    
    // Cache it!
    nodeTimingsCache.current.set(node.id, timing);

    return timing;
  }, [anchorNodeId, nodesWithPositions, graphData.edges, getEdgeAnimationTiming]);

  // Calculate line length for animation
  const getLineLength = (x1: number, y1: number, x2: number, y2: number) => {
    return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
  };

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
      // For hover detection, throttle to reduce calculations
      lastMouseMoveRef.current = e;

      if (mouseMoveTimeoutRef.current !== null) {
        window.cancelAnimationFrame(mouseMoveTimeoutRef.current);
      }

      mouseMoveTimeoutRef.current = window.requestAnimationFrame(() => {
        const event = lastMouseMoveRef.current;
        if (!event) {
          mouseMoveTimeoutRef.current = null;
          return;
        }

        const svg = svgRef.current;
        if (!svg) {
          mouseMoveTimeoutRef.current = null;
          return;
        }

        const rect = svg.getBoundingClientRect();
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
        const edgeHoverThreshold = 12 / viewport.zoom;

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
    setInteraction(prev => ({
      ...prev,
      hoveredNodeId: null,
      hoveredEdgeId: null,
    }));
  }, []);

  // Zoom handler
  const handleWheel = useCallback((e: WheelEvent) => {
    e.preventDefault();

    const svg = svgRef.current;
    if (!svg) return;

    const rect = svg.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const zoomFactor = e.deltaY > 0 ? 1 - config.wheelSensitivity : 1 + config.wheelSensitivity;
    const newZoom = Math.max(
      config.minZoom,
      Math.min(config.maxZoom, viewport.zoom * zoomFactor)
    );

    // Convert mouse position from screen coordinates to world coordinates
    // The transform is: translate(viewport.x, viewport.y) scale(viewport.zoom)
    // So to convert screen to world: (screen - viewport) / zoom
    const worldX = (mouseX - viewport.x) / viewport.zoom;
    const worldY = (mouseY - viewport.y) / viewport.zoom;

    // Convert back to screen coordinates with new zoom
    // World to screen: world * newZoom + newViewport
    // We want the world point to stay under the mouse, so:
    // mouseX = worldX * newZoom + newViewportX
    // newViewportX = mouseX - worldX * newZoom
    setViewport(prev => ({
      x: mouseX - worldX * newZoom,
      y: mouseY - worldY * newZoom,
      zoom: newZoom,
    }));
  }, [viewport, config]);

  // Attach wheel event listener
  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;

    svg.addEventListener('wheel', handleWheel, { passive: false });

    return () => {
      svg.removeEventListener('wheel', handleWheel);
      if (mouseMoveTimeoutRef.current !== null) {
        window.cancelAnimationFrame(mouseMoveTimeoutRef.current);
      }
    };
  }, [handleWheel]);

  // Click handler
  const handleClick = useCallback((e: React.MouseEvent) => {
    if (isDragging) return;

    const svg = svgRef.current;
    if (!svg) return;

    const rect = svg.getBoundingClientRect();
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
      const edgeClickThreshold = 10 / viewport.zoom;

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
        style={{ width: '100%', height: '100%', cursor: isDragging ? 'grabbing' : 'grab' }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
        onClick={handleClick}
      >
        <defs>
          {/* Define gradient for nodes */}
          <radialGradient id="nodeGradient" cx="30%" cy="30%">
            <stop offset="0%" stopColor="rgba(255,255,255,0.3)" />
            <stop offset="100%" stopColor="rgba(0,0,0,0.1)" />
          </radialGradient>

          {/* Define filters for glow effects */}
          <filter id="glow">
            <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
            <feMerge>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>

        <g transform={`translate(${viewport.x}, ${viewport.y}) scale(${viewport.zoom})`}>
          {/* Render edges first (behind nodes) */}
          {graphData.edges.map((edge, index) => {
            const sourceNode = nodesWithPositions.find(n => n.id === edge.source);
            const targetNode = nodesWithPositions.find(n => n.id === edge.target);

            if (!sourceNode || !targetNode ||
                sourceNode.x === undefined || sourceNode.y === undefined ||
                targetNode.x === undefined || targetNode.y === undefined) {
              return null;
            }

            const isHovered = interaction.hoveredEdgeId === edge.id;
            const isSelected = interaction.selectedEdgeId === edge.id;
            const edgeStyle = (isHovered || isSelected) ? config.hoveredEdge : config.edge;

            // Only animate if there's an anchor and this edge connects to it
            const shouldAnimate = anchorNodeId && (edge.source === anchorNodeId || edge.target === anchorNodeId);

            // Determine which end is the anchor to draw FROM anchor TO other node
            const isSourceAnchor = edge.source === anchorNodeId;
            const anchorNode = isSourceAnchor ? sourceNode : targetNode;
            const otherNode = isSourceAnchor ? targetNode : sourceNode;

            const x1 = anchorNode.x!;
            const y1 = anchorNode.y!;
            const x2 = otherNode.x!;
            const y2 = otherNode.y!;

            const timing = getEdgeAnimationTiming(edge, anchorNode, otherNode);
            const lineLength = timing.lineLength || getLineLength(x1, y1, x2, y2);

            return (
              <g key={`${edge.id}-${animationKey}`}>
                <line
                  x1={x1}
                  y1={y1}
                  x2={x2}
                  y2={y2}
                  stroke={edgeStyle.color}
                  strokeWidth={edgeStyle.width}
                  opacity={edgeStyle.opacity}
                  style={{
                    cursor: 'pointer',
                    pointerEvents: 'stroke',
                    strokeDasharray: shouldAnimate ? lineLength : undefined,
                    strokeDashoffset: shouldAnimate ? lineLength : undefined,
                    ...(shouldAnimate ? {
                      animationName: 'drawLine',
                      animationDuration: `${timing.duration}s`,
                      animationTimingFunction: 'cubic-bezier(0.65, 0, 0.35, 1)',
                      animationDelay: `${timing.delay}s`,
                      animationFillMode: 'forwards',
                    } : {}),
                    transition: 'stroke 0.3s ease, stroke-width 0.3s ease',
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    onEdgeClick?.(edge);
                  }}
                />

                {/* Edge label on hover/selection */}
                {edge.label && (isHovered || isSelected) && (
                  <>
                    <text
                      x={(x1 + x2) / 2}
                      y={(y1 + y2) / 2 - 10}
                      fontSize={edgeStyle.fontSize}
                      fill={edgeStyle.textOutlineColor}
                      textAnchor="middle"
                      stroke={edgeStyle.textOutlineColor}
                      strokeWidth={edgeStyle.textOutlineWidth * 2}
                      style={{
                        pointerEvents: 'none',
                        animation: 'fadeIn 0.3s ease-in forwards',
                        opacity: 0,
                      }}
                    >
                      {edge.label}
                    </text>
                    <text
                      x={(x1 + x2) / 2}
                      y={(y1 + y2) / 2 - 10}
                      fontSize={edgeStyle.fontSize}
                      fill={edgeStyle.textColor}
                      textAnchor="middle"
                      style={{
                        pointerEvents: 'none',
                        animation: 'fadeIn 0.3s ease-in forwards',
                        opacity: 0,
                      }}
                    >
                      {edge.label}
                    </text>
                  </>
                )}
              </g>
            );
          })}

          {/* Render nodes */}
          {nodesWithPositions.map((node, index) => {
            if (node.x === undefined || node.y === undefined) return null;

            const isAnchor = anchorNodeId === node.id;
            const isHovered = interaction.hoveredNodeId === node.id;
            const isSelected = interaction.selectedNodeId === node.id;

            let style = config.node;
            if (isAnchor) {
              style = config.anchorNode;
            } else if (isHovered || isSelected) {
              style = config.hoveredNode;
            }

            const radius = style.size / 2;
            const nodeTiming = getNodeAnimationTiming(node, index);

            // Calculate box shadow based on state
            let dropShadow = 'drop-shadow(0 2px 8px rgba(0,0,0,0.15))';
            if (!isAnchor && (isHovered || isSelected)) {
              dropShadow = 'drop-shadow(0 4px 12px rgba(74, 144, 226, 0.4))';
            }

            const nodeClasses = [
              'graph-node',
              isAnchor ? 'graph-node-anchor' : ''
            ].filter(Boolean).join(' ');

            return (
              <g
                key={`${node.id}-${animationKey}`}
                className={nodeClasses}
                style={{
                  animation: !isAnchor && anchorNodeId 
                    ? `fadeInBounce ${nodeTiming.duration}s cubic-bezier(0.34, 1.56, 0.64, 1) ${nodeTiming.delay}s forwards`
                    : undefined,
                  filter: dropShadow,
                  transformOrigin: `${node.x}px ${node.y}px`,
                  opacity: !isAnchor && anchorNodeId ? 0 : undefined,
                }}
              >
                {/* Node circle with gradient overlay */}
                <circle
                  cx={node.x}
                  cy={node.y}
                  r={radius}
                  fill={style.backgroundColor}
                  stroke={style.borderColor}
                  strokeWidth={style.borderWidth}
                  style={{
                    transition: 'all 0.3s ease',
                  }}
                />

                {/* Gradient overlay for depth */}
                <circle
                  cx={node.x}
                  cy={node.y}
                  r={radius}
                  fill="url(#nodeGradient)"
                  style={{ pointerEvents: 'none' }}
                />

                {/* Node label with outline */}
                {node.label && (
                  <>
                    <text
                      x={node.x}
                      y={node.y}
                      fontSize={style.fontSize}
                      fontWeight={style.fontWeight}
                      fill={style.textOutlineColor}
                      textAnchor="middle"
                      dominantBaseline="middle"
                      stroke={style.textOutlineColor}
                      strokeWidth={style.textOutlineWidth * 2}
                      className="graph-node-text"
                    >
                      {node.label}
                    </text>
                    <text
                      x={node.x}
                      y={node.y}
                      fontSize={style.fontSize}
                      fontWeight={style.fontWeight}
                      fill={style.textColor}
                      textAnchor="middle"
                      dominantBaseline="middle"
                      className="graph-node-text"
                    >
                      {node.label}
                    </text>
                  </>
                )}
              </g>
            );
          })}
        </g>
      </svg>
    </div>
  );
}
