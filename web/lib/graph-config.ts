export interface NodeStyle {
  backgroundColor: string;
  borderColor: string;
  borderWidth: number;
  size: number;
  fontSize: number;
  fontWeight: string;
  textColor: string;
  textOutlineColor: string;
  textOutlineWidth: number;
}

export interface EdgeStyle {
  color: string;
  width: number;
  opacity: number;
  fontSize: number;
  textColor: string;
  textOutlineColor: string;
  textOutlineWidth: number;
}

export interface GraphConfig {
  node: NodeStyle;
  anchorNode: NodeStyle;
  hoveredNode: NodeStyle;
  edge: EdgeStyle;
  hoveredEdge: EdgeStyle;
  minZoom: number;
  maxZoom: number;
  wheelSensitivity: number;
}

// Memoized config object to prevent unnecessary re-renders
const anchorGraphConfigCache: GraphConfig = {
  node: {
    backgroundColor: '#4A90E2',
    borderColor: '#4A90E2',
    borderWidth: 0,
    size: 30,
    fontSize: 12,
    fontWeight: 'normal',
    textColor: '#333',
    textOutlineColor: '#fff',
    textOutlineWidth: 2,
  },
  anchorNode: {
    backgroundColor: '#E74C3C',
    borderColor: '#C0392B',
    borderWidth: 3,
    size: 50,
    fontSize: 14,
    fontWeight: 'bold',
    textColor: '#333',
    textOutlineColor: '#fff',
    textOutlineWidth: 2,
  },
  hoveredNode: {
    backgroundColor: '#2171D6',
    borderColor: '#1557B0',
    borderWidth: 3,
    size: 30,
    fontSize: 12,
    fontWeight: 'normal',
    textColor: '#333',
    textOutlineColor: '#fff',
    textOutlineWidth: 2,
  },
  edge: {
    color: '#ccc',
    width: 2,
    opacity: 0.6,
    fontSize: 10,
    textColor: '#666',
    textOutlineColor: '#fff',
    textOutlineWidth: 2,
  },
  hoveredEdge: {
    color: '#888',
    width: 3,
    opacity: 1,
    fontSize: 10,
    textColor: '#666',
    textOutlineColor: '#fff',
    textOutlineWidth: 2,
  },
  minZoom: 0.1,
  maxZoom: 3,
  wheelSensitivity: 0.05,
};

const anchorGraphConfigDarkCache: GraphConfig = {
  node: {
    backgroundColor: '#60A5FA',
    borderColor: '#60A5FA',
    borderWidth: 0,
    size: 30,
    fontSize: 12,
    fontWeight: 'normal',
    textColor: '#E5E7EB',
    textOutlineColor: '#1F2937',
    textOutlineWidth: 2,
  },
  anchorNode: {
    backgroundColor: '#F87171',
    borderColor: '#DC2626',
    borderWidth: 3,
    size: 50,
    fontSize: 14,
    fontWeight: 'bold',
    textColor: '#E5E7EB',
    textOutlineColor: '#1F2937',
    textOutlineWidth: 2,
  },
  hoveredNode: {
    backgroundColor: '#3B82F6',
    borderColor: '#2563EB',
    borderWidth: 3,
    size: 30,
    fontSize: 12,
    fontWeight: 'normal',
    textColor: '#E5E7EB',
    textOutlineColor: '#1F2937',
    textOutlineWidth: 2,
  },
  edge: {
    color: '#4B5563',
    width: 2,
    opacity: 0.6,
    fontSize: 10,
    textColor: '#9CA3AF',
    textOutlineColor: '#1F2937',
    textOutlineWidth: 1,
  },
  hoveredEdge: {
    color: '#6B7280',
    width: 3,
    opacity: 1,
    fontSize: 10,
    textColor: '#9CA3AF',
    textOutlineColor: '#1F2937',
    textOutlineWidth: 1,
  },
  minZoom: 0.1,
  maxZoom: 3,
  wheelSensitivity: 0.05,
};

export const getGraphConfig = (isDark = false): GraphConfig =>
  isDark ? graphConfigDarkCache : graphConfigCache;

export const getAnchorGraphConfig = (isDark = false): GraphConfig =>
  isDark ? anchorGraphConfigDarkCache : anchorGraphConfigCache;
