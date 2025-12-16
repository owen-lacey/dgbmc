export interface Actor {
  id: string;
  name: string;
  type: string;
  Recognizability: number;
  movie_count: number;
}

export interface MovieEdge {
  Source: string;
  Target: string;
  Type: string;
  Weight: number;
  movie_id: string;
  movie_title: string;
  release_date: string;
}

export interface GraphNode {
  id: string;
  label: string;
  recognizability?: number;
  movieCount?: number;
  x?: number;
  y?: number;
}

export interface GraphEdge {
  id: string;
  source: string;
  target: string;
  label: string;
  movieId?: number;
  releaseDate?: string;
}

export interface GraphData {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

export interface ViewportTransform {
  x: number;
  y: number;
  zoom: number;
}

export interface InteractionState {
  hoveredNodeId: string | null;
  hoveredEdgeId: string | null;
  selectedNodeId: string | null;
  selectedEdgeId: string | null;
}
