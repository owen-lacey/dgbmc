'use client';

import { useEffect, useState, useCallback } from 'react';
import { loadGraphData } from '@/lib/data-loader';
import { getGraphConfig } from '@/lib/graph-config';
import { useTheme } from './ThemeProvider';
import ManualGraph from './ManualGraph';
import { GraphData } from '@/types/graph';

export default function Graph() {
  const { resolvedTheme } = useTheme();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [graphData, setGraphData] = useState<GraphData | null>(null);

  useEffect(() => {
    let mounted = true;
    
    const initGraph = async () => {
      console.log('Starting graph initialization...');
      
      try {
        // Load data
        console.log('Loading graph data...');
        const data = await loadGraphData();
        console.log('Graph data loaded:', {
          nodeCount: data.nodes.length,
          edgeCount: data.edges.length
        });
        
        if (mounted) {
          setGraphData(data);
          setLoading(false);
        }
      } catch (err) {
        console.error('Failed to initialize graph:', err);
        if (mounted) {
          setError('Failed to load graph data');
          setLoading(false);
        }
      }
    };

    initGraph();

    return () => {
      mounted = false;
    };
  }, []);

  const handleNodeClick = useCallback((node: any) => {
    console.log('Clicked node:', node);
  }, []);

  const handleEdgeClick = useCallback((edge: any) => {
    console.log('Clicked edge:', edge);
  }, []);

  return (
    <>
      {graphData && !loading && !error && (
        <ManualGraph
          graphData={graphData}
          config={getGraphConfig(resolvedTheme === 'dark')}
          onNodeClick={handleNodeClick}
          onEdgeClick={handleEdgeClick}
        />
      )}

      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-50 dark:bg-gray-900 z-10">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-400">Loading graph...</p>
          </div>
        </div>
      )}

      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-50 dark:bg-gray-900 z-10">
          <div className="text-center text-red-600 dark:text-red-400">
            <p className="text-xl font-semibold mb-2">Error</p>
            <p>{error}</p>
          </div>
        </div>
      )}
    </>
  );
}
