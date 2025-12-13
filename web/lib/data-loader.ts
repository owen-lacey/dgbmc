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
  console.log('loadGraphData: Starting...');
  
  const dataPaths = getDataPaths();
  console.log('loadGraphData: Using data paths:', dataPaths);
  
  try {
    // Load nodes CSV
    console.log('loadGraphData: Fetching', dataPaths.nodes);
    const nodesResponse = await fetch(dataPaths.nodes);
    console.log('loadGraphData: Nodes response status:', nodesResponse.status);
    const nodesText = await nodesResponse.text();
    console.log('loadGraphData: Nodes text length:', nodesText.length);
    
    // Load edges CSV
    console.log('loadGraphData: Fetching', dataPaths.edges);
    const edgesResponse = await fetch(dataPaths.edges);
    console.log('loadGraphData: Edges response status:', edgesResponse.status);
    const edgesText = await edgesResponse.text();
    console.log('loadGraphData: Edges text length:', edgesText.length);
    
    // Parse nodes
    console.log('loadGraphData: Parsing nodes...');
    const nodesParsed = Papa.parse<Actor>(nodesText, {
      header: true,
      dynamicTyping: true,
      skipEmptyLines: true,
    });
    console.log('loadGraphData: Nodes parsed:', nodesParsed.data.length);
    
    // Parse edges
    console.log('loadGraphData: Parsing edges...');
    const edgesParsed = Papa.parse<MovieEdge>(edgesText, {
      header: true,
      dynamicTyping: true,
      skipEmptyLines: true,
    });
    console.log('loadGraphData: Edges parsed:', edgesParsed.data.length);
    
    // Transform nodes to graph format
    console.log('loadGraphData: Transforming nodes...');
    const graphNodes: GraphNode[] = nodesParsed.data.map((actor) => ({
      id: actor.id,
      label: actor.name,
      recognizability: actor.Recognizability,
      movieCount: actor.movie_count,
    }));
    console.log('loadGraphData: Nodes transformed:', graphNodes.length);
    
    // Transform edges to graph format
    console.log('loadGraphData: Transforming edges...');
    const graphEdges: GraphEdge[] = edgesParsed.data.map((edge, index) => ({
      id: `e${index}`,
      source: edge.Source,
      target: edge.Target,
      label: edge.movie_title,
      movieId: edge.movie_id,
      releaseDate: edge.release_date,
    }));
    console.log('loadGraphData: Edges transformed:', graphEdges.length);
    
    console.log('loadGraphData: Complete!');
    const result = {
      nodes: graphNodes,
      edges: graphEdges,
    };
    graphDataCache = result;
    return result;
  } catch (error) {
    console.error('Error loading graph data:', error);
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
