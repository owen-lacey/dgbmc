'use client';

import { useEffect, useState, useCallback } from 'react';
import { filterGraphDataByAnchor, loadGraphData } from '@/lib/data-loader';
import { getAnchorGraphConfig } from '@/lib/graph-config';
import { useTheme } from './ThemeProvider';
import ManualGraph from './ManualGraph';
import { GraphData } from '@/types/graph';

interface AnchorGraphProps {
  anchorActorId: string;
}

export default function AnchorGraph({ anchorActorId }: AnchorGraphProps) {
  const { resolvedTheme } = useTheme();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [noConnections, setNoConnections] = useState(false);
  const [graphData, setGraphData] = useState<GraphData | null>(null);

  useEffect(() => {
    let mounted = true;
    
    const initGraph = async () => {
      console.log('Starting anchor graph initialization...', anchorActorId);
      
      try {
        // Load data
        console.log('Loading graph data...');
        const fullGraphData = await loadGraphData();
        console.log('Full graph data loaded:', {
          nodeCount: fullGraphData.nodes.length,
          edgeCount: fullGraphData.edges.length
        });
        
        // Filter data for anchor actor
        const filteredData = filterGraphDataByAnchor(fullGraphData, anchorActorId);
        console.log('Filtered graph data:', {
          nodeCount: filteredData.nodes.length,
          edgeCount: filteredData.edges.length
        });
        
        // Check if anchor has connections
        if (filteredData.edges.length === 0) {
          if (mounted) {
            setNoConnections(true);
            setLoading(false);
          }
          return;
        }
        
        if (mounted) {
          setNoConnections(false);
          setGraphData(filteredData);
          setLoading(false);
        }
      } catch (err) {
        console.error('Failed to initialize anchor graph:', err);
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
  }, [anchorActorId]);

  const handleNodeClick = useCallback((node: any) => {
    console.log('Clicked node:', node);
  }, []);

  const handleEdgeClick = useCallback((edge: any) => {
    console.log('Clicked edge:', edge);
  }, []);

  return (
    <>
      {graphData && !loading && !error && !noConnections && (
        <ManualGraph
          graphData={graphData}
          config={getAnchorGraphConfig(resolvedTheme === 'dark')}
          anchorNodeId={anchorActorId}
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

      {noConnections && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-50 dark:bg-gray-900 z-10">
          <div className="text-center text-gray-600 dark:text-gray-400">
            <p className="text-xl font-semibold mb-2">No Connections Found</p>
            <p>This actor has no costars in the current dataset.</p>
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
