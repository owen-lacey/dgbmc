import Papa from 'papaparse';
import { Actor, MovieEdge, GraphData, CytoscapeNode, CytoscapeEdge } from '@/types/graph';
import { getDataPaths } from './config';

export async function loadGraphData(): Promise<GraphData> {
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
    
    // Transform nodes to Cytoscape format
    console.log('loadGraphData: Transforming nodes...');
    const cytoscapeNodes: CytoscapeNode[] = nodesParsed.data.map((actor) => ({
      data: {
        id: actor.id,
        label: actor.name,
        recognizability: actor.Recognizability,
        movieCount: actor.movie_count,
      },
    }));
    console.log('loadGraphData: Nodes transformed:', cytoscapeNodes.length);
    
    // Transform edges to Cytoscape format
    console.log('loadGraphData: Transforming edges...');
    const cytoscapeEdges: CytoscapeEdge[] = edgesParsed.data.map((edge, index) => ({
      data: {
        id: `e${index}`,
        source: edge.Source,
        target: edge.Target,
        label: edge.movie_title,
        movieId: edge.movie_id,
        releaseDate: edge.release_date,
      },
    }));
    console.log('loadGraphData: Edges transformed:', cytoscapeEdges.length);
    
    console.log('loadGraphData: Complete!');
    return {
      nodes: cytoscapeNodes,
      edges: cytoscapeEdges,
    };
  } catch (error) {
    console.error('Error loading graph data:', error);
    throw error;
  }
}
