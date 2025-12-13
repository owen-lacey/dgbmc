import Graph from '@/components/Graph';

export default function FullGraphPage() {
  return (
    <main className="w-screen h-screen overflow-hidden relative">
      <Graph />
      <a
        href="/"
        className="absolute top-4 right-4 z-10 px-4 py-2 bg-blue-500 text-white rounded-lg shadow-lg hover:bg-blue-600 transition-colors"
      >
        Anchor Graph
      </a>
    </main>
  );
}
