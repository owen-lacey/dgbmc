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
    
    // Transform edges to graph format and combine repeated edges
    console.log('loadGraphData: Transforming edges...');

    // Group edges by source-target pair (treating edges as undirected)
    const edgeGroups = new Map<string, MovieEdge[]>();

    edgesParsed.data.forEach((edge) => {
      // Normalize the pair so that the smaller ID is always first
      const pair = edge.Source < edge.Target
        ? `${edge.Source}-${edge.Target}`
        : `${edge.Target}-${edge.Source}`;

      if (!edgeGroups.has(pair)) {
        edgeGroups.set(pair, []);
      }
      edgeGroups.get(pair)!.push(edge);
    });

    // Create combined edges
    const graphEdges: GraphEdge[] = [];
    let edgeIndex = 0;

    edgeGroups.forEach((edges) => {
      // Get the first edge for source/target info
      const firstEdge = edges[0];

      // Collect all movie information
      const movieTitles = edges.map(e => e.movie_title);
      const movieIds = edges.map(e => e.movie_id);
      const releaseDates = edges.map(e => e.release_date);

      // Create a label that shows first few movies and "+X more" if needed
      const maxToShow = 3;
      let label: string;
      if (movieTitles.length <= maxToShow) {
        label = movieTitles.join('\n');
      } else {
        const shownTitles = movieTitles.slice(0, maxToShow);
        const remaining = movieTitles.length - maxToShow;
        label = `${shownTitles.join('\n')}\n+${remaining} more`;
      }

      graphEdges.push({
        id: `e${edgeIndex++}`,
        source: firstEdge.Source,
        target: firstEdge.Target,
        label: label,
        movieId: firstEdge.movie_id,
        releaseDate: firstEdge.release_date,
        movieIds: movieIds,
        movieTitles: movieTitles,
        releaseDates: releaseDates,
        movieCount: movieTitles.length,
      });
    });

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
