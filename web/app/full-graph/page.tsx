'use client';

import Graph from '@/components/Graph';
import { ThemeToggle } from '@/components/ThemeToggle';

export default function FullGraphPage() {
  return (
    <main className="w-screen h-screen overflow-hidden relative">
      <Graph />
      <div className="absolute top-4 right-4 z-10 flex items-center gap-3">
        <a
          href="/"
          className="px-4 py-2 bg-blue-500 text-white rounded-lg shadow-lg hover:bg-blue-600 transition-colors"
        >
          Anchor Graph
        </a>
        <ThemeToggle />
      </div>
    </main>
  );
}
