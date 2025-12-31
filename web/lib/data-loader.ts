import { GraphData, GraphNode } from '@/types/graph';
import { GRAPH_DATA } from './graph-data.generated';

/**
 * Load graph data from the embedded build-time generated data.
 * The data is bundled with the JavaScript, not exposed as a separate endpoint.
 */
export async function loadGraphData(): Promise<GraphData> {
  return GRAPH_DATA;
}

export interface ActorOption {
  id: string;
  name: string;
}

export function getActorList(graphData: GraphData): ActorOption[] {
  const actors = graphData.nodes
    .map(node => ({
      id: node.id,
      name: node.label,
    }))
    .sort((a, b) => a.name.localeCompare(b.name));

  return actors;
}

export function findActorIdByName(graphData: GraphData, name: string): string | undefined {
  const node = graphData.nodes.find(n => n.label === name);
  return node?.id;
}

function randomGaussian(mean = 0, stdDev = 1) {
  // Box-Muller transform
  const u1 = Math.random();
  const u2 = Math.random();

  const z0 = Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);

  return z0 * stdDev + mean;
}


export function filterGraphDataByAnchor(graphData: GraphData, anchorId: string): GraphData {
  // Find all edges connected to the anchor
  const connectedEdges = graphData.edges.filter(
    edge => edge.source === anchorId || edge.target === anchorId
  );

  // Find all node IDs connected to the anchor
  const connectedNodeIds = new Set<string>([anchorId]);
  connectedEdges.forEach(edge => {
    connectedNodeIds.add(edge.source);
    connectedNodeIds.add(edge.target);
  });

  // Filter nodes to include only anchor and connected nodes
  const filteredNodes = graphData.nodes.filter(node =>
    connectedNodeIds.has(node.id)
  );

  // Calculate positions for preset layout
  const anchorNode = filteredNodes.find(n => n.id === anchorId);
  const costarNodes = filteredNodes.filter(n => n.id !== anchorId);

  // Sort costars by recognizability (descending)
  costarNodes.sort((a, b) => {
    const aRecog = a.recognizability || 0;
    const bRecog = b.recognizability || 0;
    return bRecog - aRecog;
  });

  // Position anchor at center
  const nodesWithPositions: GraphNode[] = [];
  if (anchorNode) {
    nodesWithPositions.push({
      ...anchorNode,
      x: 0,
      y: 0
    });
  }

  const spacing = 10; // pixels between nodes

  // Ordered list of angles around the circle
  let existingThetas: number[] = [];

  costarNodes.forEach((node, index) => {
    const radius = 100 + (index + 1 ) * spacing;
    // find the index of the theta with the biggest gap from the previous theta
    let maxDiff = 0;
    const gapIndex = existingThetas.reduce((maxGapIndex, theta, index) => {
      let diff = 0;
      if (index === existingThetas.length - 1) {
        diff = existingThetas[0] - theta;
      } else {
        diff = existingThetas[index + 1] - theta;
      }
      if (diff < 0) {
        diff += 360;
      }
      if (diff > maxDiff) {
        maxDiff = diff;
        maxGapIndex = index;
      }
      return maxGapIndex;
    }, 0);

    let theta: number;
    if (existingThetas.length === 0) {
      theta = Math.random() * 360;
    } else if (existingThetas.length === 1) {
      theta = randomGaussian(existingThetas[0]+180, 22.5);
    } else {
      const prevTheta = existingThetas[gapIndex];
      theta = randomGaussian(maxDiff / 2 + prevTheta, maxDiff / 8);
    }
    existingThetas.push(theta % 360);
    existingThetas = existingThetas.sort((a, b) => a - b);

    nodesWithPositions.push({
      ...node,
      x: radius * Math.cos(theta / 180 * Math.PI),
      y: radius * Math.sin(theta / 180 * Math.PI)
    });
  });

  return {
    nodes: nodesWithPositions,
    edges: connectedEdges,
  };
}
