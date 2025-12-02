# Implementation Plan: Hollywood Actors Graph with Next.js & Cytoscape.js

## Project Setup

### 1. Initialize Next.js Project
```bash
cd web
npx create-next-app@latest . --typescript --tailwind --app --no-src-dir
```

**Configuration choices:**
- TypeScript: Yes
- ESLint: Yes
- Tailwind CSS: Yes
- App Router: Yes
- No `src/` directory
- Import alias: `@/*`

### 2. Install Dependencies
```bash
npm install cytoscape
npm install --save-dev @types/cytoscape
npm install papaparse  # For parsing CSV files
npm install --save-dev @types/papaparse
```

## File Structure

```
web/
├── app/
│   ├── layout.tsx           # Root layout
│   ├── page.tsx             # Home page with graph
│   └── globals.css          # Global styles
├── components/
│   ├── Graph.tsx            # Main Cytoscape component
│   ├── GraphControls.tsx    # Zoom, reset, search UI (optional)
│   └── NodeDetails.tsx      # Actor/edge info panel (optional)
├── lib/
│   ├── data-loader.ts       # Load and parse CSV files
│   └── graph-config.ts      # Cytoscape configuration
├── public/
│   └── data/                # Copy CSV files here
│       ├── nodes.csv
│       └── edges.csv
└── types/
    └── graph.ts             # TypeScript types for nodes/edges
```

## Implementation Steps

### Step 1: Set Up Data Types
**File**: `types/graph.ts`
```typescript
export interface Actor {
  id: string;
  name: string;
  // Add other fields from actor_details.csv
}

export interface Movie {
  id: string;
  title: string;
  source: string;  // actor ID
  target: string;  // actor ID
  // Add other fields from edges.csv
}
```

### Step 2: Create Data Loader
**File**: `lib/data-loader.ts`
- Parse CSV files using papaparse
- Transform data into Cytoscape format:
  ```typescript
  {
    nodes: [{ data: { id, label } }],
    edges: [{ data: { source, target, label } }]
  }
  ```
- Handle file reading (from public/data or API route)

### Step 3: Configure Cytoscape
**File**: `lib/graph-config.ts`
- Define layout: `cose` (force-directed) or `cose-bilkent`
- Set node styles: uniform circles, labels
- Set edge styles: lines with optional labels
- Configure interaction: pan, zoom, tap events

### Step 4: Create Graph Component
**File**: `components/Graph.tsx`
- Use `useEffect` to initialize Cytoscape
- Create a client component (`'use client'`)
- Mount Cytoscape to a div ref
- Load data and render graph
- Handle cleanup on unmount
- Set up event listeners for hover/click

### Step 5: Build Main Page
**File**: `app/page.tsx`
- Import Graph component
- Full viewport layout (100vh, 100vw)
- Pass data to Graph component
- Optional: Add loading state

### Step 6: Copy Data Files
```bash
cp ../extract/data/nodes.csv web/public/data/
cp ../extract/data/edges.csv web/public/data/
# Or use nodes_1000_r10.csv, edges_1000_r10.csv for smaller test set
```

### Step 7: Style the Application
**File**: `app/globals.css`
- Remove default margins/padding
- Set graph container to full viewport
- Style node/edge details panel (if added)

## Cytoscape Configuration Details

### Layout Options
```typescript
layout: {
  name: 'cose',  // or 'cose-bilkent' for better quality
  animate: true,
  nodeDimensionsIncludeLabels: true,
  idealEdgeLength: 100,
  nodeRepulsion: 400000,
}
```

### Node Styling
```typescript
style: [
  {
    selector: 'node',
    style: {
      'background-color': '#4A90E2',
      'label': 'data(label)',
      'width': 30,
      'height': 30,
      'font-size': 12,
      'text-valign': 'center',
      'text-halign': 'center',
    }
  }
]
```

### Edge Styling
```typescript
{
  selector: 'edge',
  style: {
    'width': 2,
    'line-color': '#ccc',
    'curve-style': 'bezier',
    'label': 'data(label)',  // movie title
    'font-size': 10,
  }
}
```

## Development Workflow

### Phase 1: MVP (Basic Graph Display)
1. Set up Next.js project
2. Install dependencies
3. Copy minimal data (nodes_1000_r10.csv, edges_1000_r10.csv)
4. Create basic Graph component
5. Load and render graph with default styling
6. Verify pan and zoom work

**Goal**: See the graph on screen

### Phase 2: Data Integration
1. Implement full CSV parsing
2. Load complete dataset (or larger subset)
3. Map actor names and movie titles correctly
4. Optimize initial layout

**Goal**: Display real data with proper labels

### Phase 3: Interactivity
1. Add hover effects (highlight node/edges)
2. Click to show details in side panel or modal
3. Search bar to find and focus on actors
4. Reset/fit view buttons

**Goal**: Make it explorable and interactive

### Phase 4: Polish (Optional)
1. Better visual design (colors, fonts)
2. Performance optimization for large graphs
3. Filters (by time period, genre, etc.)
4. Responsive tweaks

## Quick Start Commands

```bash
# Navigate to web directory
cd web

# Initialize project
npx create-next-app@latest . --typescript --tailwind --app --no-src-dir

# Install graph dependencies
npm install cytoscape papaparse
npm install --save-dev @types/cytoscape @types/papaparse

# Copy data
mkdir -p public/data
cp ../extract/data/nodes_1000_r10.csv public/data/nodes.csv
cp ../extract/data/edges_1000_r10.csv public/data/edges.csv

# Start dev server
npm run dev
```

## Resources

- [Cytoscape.js Documentation](https://js.cytoscape.org/)
- [Cytoscape.js COSE Layout Demo](https://js.cytoscape.org/demos/cose-layout/)
- [Next.js App Router Docs](https://nextjs.org/docs/app)

## Notes

- Start with smaller dataset (1000 nodes) for faster iteration
- Cytoscape handles pan/zoom out of the box
- Canvas rendering is automatic for large graphs
- Can always switch layout algorithms by changing `layout.name`
- Keep it simple first, add features as needed
