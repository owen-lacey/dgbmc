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
│   ├── config.ts            # Configuration (recognizability level)
│   ├── data-loader.ts       # Load and parse CSV files
│   └── graph-config.ts      # Cytoscape configuration
├── public/
│   └── data/                # Copy CSV files here with recognizability suffix
│       ├── nodes_10.csv
│       ├── edges_10.csv
│       ├── nodes_9.csv
│       ├── edges_9.csv
│       ├── nodes_8.csv
│       └── edges_8.csv
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
  // Add other fields from edges_*.csv
}
```

### Step 2: Create Configuration
**File**: `lib/config.ts`
- Read `NEXT_PUBLIC_RECOGNIZABILITY` environment variable (defaults to 10)
- Export function to generate CSV paths: `nodes_${RECOGNIZABILITY}.csv`

### Step 3: Create Data Loader
**File**: `lib/data-loader.ts`
- Parse CSV files using papaparse
- Use configuration to determine which CSV files to load
- Transform data into Cytoscape format:
  ```typescript
  {
    nodes: [{ data: { id, label } }],
    edges: [{ data: { source, target, label } }]
  }
  ```
- Handle file reading from public/data

### Step 4: Configure Cytoscape
**File**: `lib/graph-config.ts`
- Define layout: `cose` (force-directed) or `cose-bilkent`
- Set node styles: uniform circles, labels
- Set edge styles: lines with optional labels
- Configure interaction: pan, zoom, tap events

### Step 5: Create Graph Component
**File**: `components/Graph.tsx`
- Use `useEffect` to initialize Cytoscape
- Create a client component (`'use client'`)
- Mount Cytoscape to a div ref
- Load data and render graph
- Handle cleanup on unmount
- Set up event listeners for hover/click

### Step 6: Build Main Page
**File**: `app/page.tsx`
- Import Graph component
- Full viewport layout (100vh, 100vw)
- Pass data to Graph component
- Optional: Add loading state

### Step 7: Copy Data Files
```bash
# Copy and rename CSV files with recognizability suffix
cp ../extract/data/nodes_1000_r10.csv web/public/data/nodes_10.csv
cp ../extract/data/edges_1000_r10.csv web/public/data/edges_10.csv
cp ../extract/data/nodes_1000_r9.csv web/public/data/nodes_9.csv
cp ../extract/data/edges_1000_r9.csv web/public/data/edges_9.csv
cp ../extract/data/nodes_1000_r8.csv web/public/data/nodes_8.csv
cp ../extract/data/edges_1000_r8.csv web/public/data/edges_8.csv
```

### Step 8: Style the Application
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
3. Copy data files with recognizability suffix (nodes_10.csv, edges_10.csv)
4. Create configuration module
5. Create basic Graph component
6. Load and render graph with default styling
7. Verify pan and zoom work

**Goal**: See the graph on screen

### Phase 2: Data Integration
1. Implement full CSV parsing
2. Add support for multiple recognizability levels via environment variable
3. Test with different datasets (r8, r9, r10)
4. Map actor names and movie titles correctly
5. Optimize initial layout

**Goal**: Display real data with proper labels across different dataset sizes

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

## Configuration

### Environment Variables
Create `.env.local` file:
```bash
# Recognizability level: 8, 9, or 10 (default: 10)
NEXT_PUBLIC_RECOGNIZABILITY=10
```

### Available Datasets
- **Recognizability 10**: 338 nodes, 4,113 edges (most recognizable actors)
- **Recognizability 9**: 876 nodes, 18,525 edges (highly recognizable)
- **Recognizability 8**: 1,002 nodes, 17,314 edges (recognizable)

## Quick Start Commands

```bash
# Navigate to web directory
cd web

# Initialize project
npx create-next-app@latest . --typescript --tailwind --app --no-src-dir

# Install graph dependencies
npm install cytoscape papaparse
npm install --save-dev @types/cytoscape @types/papaparse

# Copy data with recognizability suffix
mkdir -p public/data
cp ../extract/data/nodes_1000_r10.csv public/data/nodes_10.csv
cp ../extract/data/edges_1000_r10.csv public/data/edges_10.csv
cp ../extract/data/nodes_1000_r9.csv public/data/nodes_9.csv
cp ../extract/data/edges_1000_r9.csv public/data/edges_9.csv
cp ../extract/data/nodes_1000_r8.csv public/data/nodes_8.csv
cp ../extract/data/edges_1000_r8.csv public/data/edges_8.csv

# (Optional) Configure recognizability level
echo "NEXT_PUBLIC_RECOGNIZABILITY=10" > .env.local

# Start dev server
npm run dev
```

## Resources

- [Cytoscape.js Documentation](https://js.cytoscape.org/)
- [Cytoscape.js COSE Layout Demo](https://js.cytoscape.org/demos/cose-layout/)
- [Next.js App Router Docs](https://nextjs.org/docs/app)
- [Next.js Environment Variables](https://nextjs.org/docs/app/building-your-application/configuring/environment-variables)

## Notes

- Start with smaller dataset (recognizability 10: 338 nodes) for faster iteration
- Use environment variable to switch between datasets without code changes
- Cytoscape handles pan/zoom out of the box
- Canvas rendering is automatic for large graphs
- Can always switch layout algorithms by changing `layout.name`
- Keep it simple first, add features as needed
- All CSV files must include recognizability suffix (nodes_8.csv, nodes_9.csv, nodes_10.csv)
