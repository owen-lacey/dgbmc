import cytoscape from 'cytoscape';

export const getGraphConfig = (): cytoscape.CytoscapeOptions => ({
  style: [
    {
      selector: 'node',
      style: {
        'background-color': '#4A90E2',
        'label': 'data(label)',
        'width': 30,
        'height': 30,
        'font-size': '12px',
        'text-valign': 'center',
        'text-halign': 'center',
        'text-wrap': 'wrap',
        'text-max-width': '100px',
        'color': '#333',
        'text-outline-color': '#fff',
        'text-outline-width': 2,
      } as any,
    },
    {
      selector: 'node:hover',
      style: {
        'background-color': '#2171D6',
        'border-width': 3,
        'border-color': '#1557B0',
      } as any,
    },
    {
      selector: 'edge',
      style: {
        'width': 2,
        'line-color': '#ccc',
        'curve-style': 'bezier',
        'opacity': 0.6,
      } as any,
    },
    {
      selector: 'edge:hover',
      style: {
        'line-color': '#888',
        'width': 3,
        'opacity': 1,
      } as any,
    },
  ],
  layout: {
    name: 'cose',
    animate: true,
    animationDuration: 1000,
    fit: true,
    padding: 50,
    nodeDimensionsIncludeLabels: true,
    // @ts-ignore - cose-specific options
    idealEdgeLength: 100,
    nodeRepulsion: 400000,
    edgeElasticity: 100,
    nestingFactor: 5,
    gravity: 80,
    numIter: 1000,
    initialTemp: 200,
    coolingFactor: 0.95,
    minTemp: 1.0,
  },
  minZoom: 0.1,
  maxZoom: 3,
  wheelSensitivity: 0.2,
});
