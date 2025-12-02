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

export interface CytoscapeNode {
  data: {
    id: string;
    label: string;
    recognizability?: number;
    movieCount?: number;
  };
}

export interface CytoscapeEdge {
  data: {
    id: string;
    source: string;
    target: string;
    label: string;
    movieId?: string;
    releaseDate?: string;
  };
}

export interface GraphData {
  nodes: CytoscapeNode[];
  edges: CytoscapeEdge[];
}
