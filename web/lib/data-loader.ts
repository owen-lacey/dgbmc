import Papa from 'papaparse';
import { Actor, MovieEdge, GraphData, GraphNode, GraphEdge } from '@/types/graph';
import { getDataPaths, HIDE_NON_ACTORS } from './config';

// Cache for graph data to prevent multiple loads
let graphDataCache: GraphData | null = null;
let graphDataPromise: Promise<GraphData> | null = null;

export async function loadGraphData(): Promise<GraphData> {
  // Return cached data if available
  if (graphDataCache) {
    return graphDataCache;
  }

  // Return existing promise if data is already loading
  if (graphDataPromise) {
    return graphDataPromise;
  }

  // Create new promise for loading data
  graphDataPromise = (async () => {
  const dataPaths = getDataPaths();

  try {
    // Load nodes CSV
    const nodesResponse = await fetch(dataPaths.nodes);
    const nodesText = await nodesResponse.text();

    // Load edges CSV
    const edgesResponse = await fetch(dataPaths.edges);
    const edgesText = await edgesResponse.text();

    // Parse nodes
    const nodesParsed = Papa.parse<Actor>(nodesText, {
      header: true,
      dynamicTyping: true,
      skipEmptyLines: true,
    });

    // Parse edges
    const edgesParsed = Papa.parse<MovieEdge>(edgesText, {
      header: true,
      dynamicTyping: true,
      skipEmptyLines: true,
    });

    // Transform nodes to graph format
    // Note: CSV parses "True"/"False" as strings, so we need to convert
    let graphNodes: GraphNode[] = nodesParsed.data.map((actor) => ({
      id: actor.id,
      label: actor.name,
      recognizability: actor.Recognizability,
      movieCount: actor.movie_count,
      bestKnownForActing: actor.best_known_for_acting === true || actor.best_known_for_acting === 'True',
    }));

    // Filter out non-actors if configured
    if (HIDE_NON_ACTORS) {
      graphNodes = graphNodes.filter(node => node.bestKnownForActing !== false);
    }

    // Transform edges to graph format
    const nodeIds = new Set(graphNodes.map(node => node.id));
    const graphEdges: GraphEdge[] = edgesParsed.data
      .filter(edge => nodeIds.has(edge.Source) && nodeIds.has(edge.Target))
      .map((edge, index) => ({
        id: `e${index}`,
        source: edge.Source,
        target: edge.Target,
        label: edge.movie_title,
        movieId: edge.movie_id,
        releaseDate: edge.release_date,
      }));

    const result = {
      nodes: graphNodes,
      edges: graphEdges,
    };
    graphDataCache = result;
    return result;
  } catch (error) {
    graphDataPromise = null; // Reset promise on error
    throw error;
  }
  })();

  return graphDataPromise;
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
