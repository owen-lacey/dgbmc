'use client';

import { useEffect, useRef, useState } from 'react';
import cytoscape from 'cytoscape';
import { loadGraphData } from '@/lib/data-loader';
import { getGraphConfig } from '@/lib/graph-config';

export default function Graph() {
  const containerRef = useRef<HTMLDivElement>(null);
  const cyRef = useRef<cytoscape.Core | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    
    const initGraph = async () => {
      console.log('Starting graph initialization...');
      
      // Wait a bit for the container to be ready
      await new Promise(resolve => setTimeout(resolve, 100));
      
      if (!mounted || !containerRef.current) {
        console.error('Container ref is null or component unmounted');
        return;
      }
      
      console.log('Container ref exists');

      try {
        // Load data
        console.log('Loading graph data...');
        const graphData = await loadGraphData();
        console.log('Graph data loaded:', {
          nodeCount: graphData.nodes.length,
          edgeCount: graphData.edges.length
        });
        
        // Initialize Cytoscape
        console.log('Initializing Cytoscape...');
        const cy = cytoscape({
          container: containerRef.current,
          elements: [...graphData.nodes, ...graphData.edges],
          ...getGraphConfig(),
        });
        console.log('Cytoscape initialized');

        cyRef.current = cy;
        
        // Add event listeners
        cy.on('tap', 'node', (event) => {
          const node = event.target;
          console.log('Clicked node:', node.data());
        });

        cy.on('tap', 'edge', (event) => {
          const edge = event.target;
          console.log('Clicked edge:', edge.data());
        });

        console.log('Setting loading to false');
        setLoading(false);
      } catch (err) {
        console.error('Failed to initialize graph:', err);
        setError('Failed to load graph data');
        setLoading(false);
      }
    };

    initGraph();

    // Cleanup
    return () => {
      mounted = false;
      if (cyRef.current) {
        cyRef.current.destroy();
      }
    };
  }, []);

  return (
    <>
      <div 
        ref={containerRef} 
        className="w-full h-full"
        style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
      />
      
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-50 z-10">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading graph...</p>
          </div>
        </div>
      )}
      
      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-50 z-10">
          <div className="text-center text-red-600">
            <p className="text-xl font-semibold mb-2">Error</p>
            <p>{error}</p>
          </div>
        </div>
      )}
    </>
  );
}
