# Hollywood Actors Graph Web Application

## Overview
An interactive graph visualization showing Hollywood actors connected by movies they co-starred in.

## Data Model

### Nodes
- **Type**: Actors
- **Attributes**: 
  - Actor name
  - Actor ID
  - Optional: Photo, bio, filmography count

### Edges
- **Type**: Movies (connections between actors)
- **Attributes**:
  - Movie title
  - Movie ID
  - Optional: Release year, genre, rating

## Visual Design

### Layout
- **Canvas**: Infinite scrollable area (horizontal and vertical)
- **Graph Type**: Force-directed or network layout
- **Responsive**: Takes as much space as necessary to display all nodes without overlap

### Node Appearance
- Circular shapes (uniform size)
- All nodes are the same size
- Label: Actor name

### Edge Appearance
- Lines connecting actor nodes
- Thickness/style may indicate:
  - Number of movies together
  - Recency of collaboration
- Optional: Show movie title on hover or click

## Interaction

### Navigation
- **Pan**: Click and drag to move around the graph
- **Zoom**: Mouse wheel or pinch to zoom in/out
- **Scroll**: Both horizontal and vertical scrolling enabled

### Information Display
- **Hover**: Show basic info (actor name, connection count)
- **Click Node**: Show detailed actor information
- **Click Edge**: Show movie details and shared cast
- **Search**: Find specific actors quickly

### Optional Features
- Filter by time period, genre, or connection strength
- Highlight paths between two actors
- Cluster actors by genre, era, or collaboration frequency

## Technical Approach

### Graph Library Options
- Cytoscape.js (mentioned in notes.md)
- D3.js force layout
- Vis.js network
- Sigma.js

### Data Source
- CSV files in `extract/data/`:
  - `actor_details.csv`
  - `movie_details.csv`
  - `movie_cast_mapping.csv`
  - `edges.csv` / `nodes.csv`

### Performance Considerations
- Load data progressively if dataset is large
- Use canvas rendering for large graphs (>1000 nodes)
- Implement level-of-detail (hide labels when zoomed out)
- Consider WebGL for very large graphs

## Implementation Phases

### Phase 1: Basic Graph Display
- Load actor and movie data
- Render nodes (actors) and edges (movies)
- Implement pan and zoom
- Basic styling

### Phase 2: Interactivity
- Hover effects
- Click to view details
- Search functionality
- Smooth transitions

### Phase 3: Enhanced Features (Optional)
- Filters and clustering
- Path highlighting
- Advanced layout algorithms
- Performance optimization

## Out of Scope (For Now)
- User accounts or authentication
- Real-time data updates
- Social features
- Mobile-first design (desktop focus acceptable)
- Accessibility compliance (nice to have, not required)

## Success Criteria
- Graph loads and displays all actors and connections
- Smooth pan and zoom on desktop
- Can navigate to any part of the graph
- Performance remains acceptable with full dataset
- Visually interesting and explorable

## Notes
- This is an exploratory visualization project
- Prioritize getting something working over perfect UX
- Experiment with different layouts and visual styles
- Data files already exist in `extract/data/`
