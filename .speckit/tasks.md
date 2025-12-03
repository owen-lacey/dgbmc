# Tasks: Hollywood Actors Graph

## Phase 1: MVP - Basic Graph Display

### Setup
- [x] Initialize Next.js project with TypeScript, Tailwind, App Router
- [x] Install Cytoscape.js and types
- [x] Install papaparse for CSV parsing
- [x] Create project file structure (components, lib, types folders)
- [x] Copy test data (nodes_1000_r10.csv, edges_1000_r10.csv) to public/data/ as nodes_10.csv, edges_10.csv

### Core Implementation
- [x] Create TypeScript types for Actor and Movie (types/graph.ts)
- [x] Implement CSV data loader (lib/data-loader.ts)
- [x] Create Cytoscape configuration with COSE layout (lib/graph-config.ts)
- [x] Build Graph component with Cytoscape initialization (components/Graph.tsx)
- [x] Set up main page with full viewport layout (app/page.tsx)
- [x] Add global styles for full-screen graph (app/globals.css)
- [x] Add recognizability configuration (lib/config.ts)

### Verification
- [x] Verify graph renders on screen
- [x] Test pan (click and drag)
- [x] Test zoom (mouse wheel)
- [x] Check that nodes are uniform circles
- [x] Verify actor labels appear on nodes

## Phase 2: Data Integration

- [x] Parse full CSV data correctly
- [x] Map actor names from actor_details.csv to node labels
- [x] Map movie titles from movie_details.csv to edge labels
- [x] Add configuration for different recognizability levels (8, 9, 10)
- [ ] Test with larger datasets (r8, r9 variants)
- [ ] Verify all data displays correctly

## Phase 3: Interactivity

- [ ] Add hover effects on nodes (highlight + tooltip)
- [ ] Add hover effects on edges (show movie title)
- [ ] Implement click handler to show actor details
- [ ] Implement click handler to show movie details
- [ ] Add search functionality to find actors
- [ ] Add reset/fit view button
- [ ] Add zoom controls (optional)

## Phase 4: Polish (Optional)

- [ ] Improve visual design (colors, fonts, spacing)
- [ ] Optimize performance for large graphs
- [ ] Add filters (by year, genre, etc.)
- [ ] Add shortest path finder between two actors
- [ ] Improve layout algorithm or parameters
- [ ] Add loading state/spinner
- [ ] Add error handling

## Backlog / Future Ideas

- [ ] Export graph as image
- [ ] Animate layout transitions
- [ ] Cluster nodes by era or genre
- [ ] Show degree centrality visually
- [ ] Add keyboard shortcuts
- [ ] Dark mode toggle
- [ ] Mobile touch gestures

## Configuration

The application uses recognizability-based CSV files:
- `nodes_10.csv` / `edges_10.csv` - Most recognizable actors (recognizability = 10, 338 nodes)
- `nodes_9.csv` / `edges_9.csv` - Highly recognizable actors (recognizability ≥ 9, 876 nodes)
- `nodes_8.csv` / `edges_8.csv` - Recognizable actors (recognizability ≥ 8, 1002 nodes)

To change the dataset, set `NEXT_PUBLIC_RECOGNIZABILITY` environment variable to 8, 9, or 10 (default: 10).
