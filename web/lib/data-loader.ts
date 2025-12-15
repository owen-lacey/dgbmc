import Papa from 'papaparse';
import { Actor, MovieEdge, GraphData, GraphNode, GraphEdge } from '@/types/graph';
import { getDataPaths } from './config';

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
    const graphNodes: GraphNode[] = nodesParsed.data.map((actor) => ({
      id: actor.id,
      label: actor.name,
      recognizability: actor.Recognizability,
      movieCount: actor.movie_count,
    }));

    // Transform edges to graph format
    const graphEdges: GraphEdge[] = edgesParsed.data.map((edge, index) => ({
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
  
  // Position costars in a grid
  const cols = Math.ceil(Math.sqrt(costarNodes.length));
  const spacing = 200; // pixels between nodes
  
  costarNodes.forEach((node, index) => {
    const row = Math.floor(index / cols);
    const col = index % cols;
    
    // Offset grid to avoid overlap with center
    const offsetX = (col - (cols - 1) / 2) * spacing;
    const offsetY = (row + 1.5) * spacing; // Start below center
    
    nodesWithPositions.push({
      ...node,
      x: offsetX,
      y: offsetY
    });
  });
  
  return {
    nodes: nodesWithPositions,
    edges: connectedEdges,
  };
}
