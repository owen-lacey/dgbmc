import { GraphNode, NodePosition } from '@/types/graph';

export interface LayoutOptions {
  centerX: number;
  centerY: number;
  radius?: number;
  minRadius?: number;
  maxRadius?: number;
}

/**
 * Calculate circular layout positions for nodes
 */
export function calculateCircularLayout(
  nodes: GraphNode[],
  options: LayoutOptions
): Map<string, NodePosition> {
  const {
    centerX,
    centerY,
    radius: providedRadius,
    minRadius = 100,
    maxRadius = 500,
  } = options;

  const nodeCount = nodes.length;
  if (nodeCount === 0) {
    return new Map();
  }

  if (nodeCount === 1) {
    const positionMap = new Map<string, NodePosition>();
    positionMap.set(nodes[0].id, { x: centerX, y: centerY });
    return positionMap;
  }

  // Calculate radius based on node count if not provided
  // Scale radius to accommodate more nodes
  const baseRadius = providedRadius ?? Math.min(
    maxRadius,
    Math.max(minRadius, (nodeCount * 30) / Math.PI)
  );

  const angleStep = (2 * Math.PI) / nodeCount;
  const positionMap = new Map<string, NodePosition>();

  nodes.forEach((node, index) => {
    const angle = index * angleStep - Math.PI / 2; // Start from top
    const x = centerX + baseRadius * Math.cos(angle);
    const y = centerY + baseRadius * Math.sin(angle);
    positionMap.set(node.id, { x, y });
  });

  return positionMap;
}

/**
 * Apply positions to nodes
 */
export function applyPositionsToNodes(
  nodes: GraphNode[],
  positions: Map<string, NodePosition>
): GraphNode[] {
  return nodes.map(node => {
    const position = positions.get(node.id);
    if (position) {
      return { ...node, x: position.x, y: position.y };
    }
    return node;
  });
}


