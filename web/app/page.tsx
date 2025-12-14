'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import AnchorGraph from '@/components/AnchorGraph';
import ActorDropdown from '@/components/ActorDropdown';
import { ThemeToggle } from '@/components/ThemeToggle';
import { loadGraphData, getActorList, findActorIdByName, ActorOption } from '@/lib/data-loader';

export default function Home() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [actors, setActors] = useState<ActorOption[]>([]);
  const [selectedActorId, setSelectedActorId] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initActors = async () => {
      try {
        // Load full graph data to get actor list
        const graphData = await loadGraphData();
        const actorList = getActorList(graphData);
        setActors(actorList);

        // Get actor from URL params or default to Kevin Bacon
        const actorParam = searchParams.get('actor');
        let actorId: string | undefined;

        if (actorParam) {
          actorId = findActorIdByName(graphData, actorParam);
        }

        if (!actorId) {
          // Default to Kevin Bacon
          actorId = findActorIdByName(graphData, 'Kevin Bacon');
        }

        if (actorId) {
          setSelectedActorId(actorId);
        }

        setLoading(false);
      } catch (err) {
        console.error('Failed to load actors:', err);
        setLoading(false);
      }
    };

    initActors();
  }, [searchParams]);

  const handleActorChange = useCallback((actorId: string) => {
    setSelectedActorId(actorId);
    
    // Update URL with actor name
    const actor = actors.find(a => a.id === actorId);
    if (actor) {
      router.push(`/?actor=${encodeURIComponent(actor.name)}`);
    }
  }, [actors, router]);

  if (loading) {
    return (
      <div className="w-screen h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading actors...</p>
        </div>
      </div>
    );
  }

  if (!selectedActorId) {
    return (
      <div className="w-screen h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center text-red-600 dark:text-red-400">
          <p className="text-xl font-semibold mb-2">Error</p>
          <p>Could not find actor</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-screen h-screen overflow-hidden relative">
      <ThemeToggle />
      <ActorDropdown
        actors={actors}
        selectedActorId={selectedActorId}
        onActorChange={handleActorChange}
      />
      <AnchorGraph anchorActorId={selectedActorId} />
      <a
        href="/full-graph"
        className="absolute top-4 right-20 z-10 px-4 py-2 bg-blue-500 text-white rounded-lg shadow-lg hover:bg-blue-600 transition-colors"
      >
        Full Graph
      </a>
    </div>
  );
}
