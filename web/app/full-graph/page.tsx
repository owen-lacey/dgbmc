'use client';

import Graph from '@/components/Graph';
import { ThemeToggle } from '@/components/ThemeToggle';

export default function FullGraphPage() {
  return (
    <main className="w-screen h-screen overflow-hidden relative">
      <ThemeToggle />
      <Graph />
      <a
        href="/"
        className="absolute top-4 right-20 z-10 px-4 py-2 bg-blue-500 text-white rounded-lg shadow-lg hover:bg-blue-600 transition-colors"
      >
        Anchor Graph
      </a>
    </main>
  );
}
