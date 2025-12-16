# Feature Specification: Bacon Number Calculation & Path Exploration

**Feature Branch**: `001-bacon-number-paths`  
**Created**: 2024-12-15  
**Status**: Draft  
**Input**: User description: "Calculate bacon numbers and paths for actors with web app integration for path exploration and actor details display"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - View Actor's Bacon Number (Priority: P1)

As a user exploring the actor graph, I want to see an actor's "bacon number" (shortest path distance to Kevin Bacon) when I select their node, so I can understand how connected they are to the Hollywood network through Kevin Bacon.

**Why this priority**: The bacon number is the core metric this feature provides. Without it, the other features have no meaning.

**Independent Test**: Can be fully tested by selecting any actor node and verifying the bacon number displays correctly. Delivers immediate value by showing the fundamental connectivity metric.

**Acceptance Scenarios**:

1. **Given** a user has the graph loaded, **When** they select an actor node (e.g., Mark Hamill), **Then** they see the actor's bacon number displayed in the details panel
2. **Given** Kevin Bacon is selected, **When** viewing his details, **Then** the bacon number shows as 0
3. **Given** an actor has no path to Kevin Bacon (isolated in graph), **When** viewing their details, **Then** the bacon number shows as "∞" or "Not connected"
4. **Given** an actor is a direct costar of Kevin Bacon, **When** viewing their details, **Then** the bacon number shows as 1

---

### User Story 2 - View Actor's Average Path Length (Priority: P2)

As a user analyzing the actor network, I want to see the average shortest path length from a selected actor to all other actors, so I can understand how central they are in the overall network.

**Why this priority**: Provides deeper network analysis beyond just Kevin Bacon connectivity, adding value to the actor details panel.

**Independent Test**: Can be tested by selecting an actor and verifying the average path length calculation is displayed alongside the bacon number.

**Acceptance Scenarios**:

1. **Given** a user selects an actor node, **When** viewing the details panel, **Then** they see the actor's average path length to all other connected actors
2. **Given** an actor is highly connected, **When** viewing their average path length, **Then** the value should be lower than less connected actors
3. **Given** an actor is isolated (no connections), **When** viewing their details, **Then** the average path length shows as "N/A" or "Not connected"

---

### User Story 3 - Explore Path Between Actors (Priority: P2)

As a user exploring actor connections, I want to select an anchor actor, then a target costar, and finally a third actor to see the shortest path from the anchor to that third actor, so I can discover how actors are connected through their co-starring relationships.

**Why this priority**: This is the primary interactive exploration feature that makes the bacon number data actionable and engaging.

**Independent Test**: Can be tested by selecting three actors in sequence and verifying the path visualization displays correctly.

**Acceptance Scenarios**:

1. **Given** a user has selected an anchor actor and a target costar, **When** they select a third actor, **Then** the system displays the shortest path from the anchor to the third actor
2. **Given** a path is displayed, **When** viewing the path, **Then** each step shows the connecting movie title
3. **Given** no path exists between the anchor and selected actor, **When** attempting to show path, **Then** a message indicates "No path exists"
4. **Given** a path is displayed, **When** viewing the path, **Then** each intermediate actor is shown with their names

---

### User Story 4 - Pre-computed Path Data (Priority: P1)

As a system, I need to have all shortest paths between actor pairs pre-computed and available, so that path lookups are instantaneous for users.

**Why this priority**: This is the foundational data that enables all other features. Without pre-computed paths, real-time calculation would be too slow for a good user experience.

**Independent Test**: Can be tested by verifying the generated data files contain correct shortest paths for sample actor pairs.

**Acceptance Scenarios**:

1. **Given** the graph data with recognizability ≥ 8 filter, **When** path computation runs, **Then** all shortest paths between all actor pairs are calculated
2. **Given** a computed path exists, **When** inspecting the data, **Then** the path includes the sequence of actors and connecting movies
3. **Given** Kevin Bacon exists in the dataset, **When** computation completes, **Then** every connected actor has a bacon number assigned

---

### Edge Cases

- What happens when Kevin Bacon is not in the filtered dataset (recognizability < 8)? System should handle gracefully with a clear error or fallback.
- How does the system handle multiple shortest paths of equal length? Display one valid path (deterministic selection).
- What happens when the graph has disconnected components? Actors in disconnected components from Kevin Bacon have bacon number = ∞.
- How are self-loops or duplicate edges handled? Ignore self-loops; use unique edges based on movie connections.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST pre-compute shortest paths between all pairs of actors in the graph using established graph traversal algorithms
- **FR-002**: System MUST calculate the "bacon number" (shortest path distance to Kevin Bacon) for each actor
- **FR-003**: System MUST store the complete path (sequence of actors and connecting movies) for each computed shortest path
- **FR-004**: System MUST calculate the average shortest path length for each actor to all other connected actors
- **FR-005**: System MUST filter actors to only include those with recognizability score ≥ 8
- **FR-006**: System MUST identify actors in the same connected component as Kevin Bacon vs. those in disconnected components
- **FR-007**: Web application MUST display bacon number when an actor node is selected
- **FR-008**: Web application MUST display average path length when an actor node is selected
- **FR-009**: Web application MUST support the path exploration workflow: anchor → target costar → third actor → display path
- **FR-010**: Web application MUST display path details including intermediate actors and connecting movie titles
- **FR-011**: System MUST persist computed path data in a format consumable by the web application
- **FR-012**: System MUST handle the case where Kevin Bacon does not exist in the dataset (recognizability filter excludes him) by reporting an error or using an alternative reference actor

### Key Entities

- **Actor Node**: Represents an actor with id, name, recognizability score, movie count, bacon number, and average path length
- **Movie Edge**: Represents a co-starring relationship through a specific movie, connecting two actors
- **Shortest Path**: A sequence of actors and the movies connecting them, representing the minimum number of steps between two actors
- **Bacon Number**: The length (number of edges) of the shortest path from an actor to Kevin Bacon; 0 for Kevin Bacon, ∞ for disconnected actors
- **Average Path Length**: The mean shortest path distance from an actor to all other reachable actors in the graph

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can view an actor's bacon number within 1 second of selecting their node
- **SC-002**: Users can view the shortest path between any two actors within 1 second of selection
- **SC-003**: Path computation completes for the full filtered dataset (recognizability ≥ 8) within a reasonable processing time (under 5 minutes for batch processing)
- **SC-004**: 100% of actors in Kevin Bacon's connected component have a valid bacon number assigned
- **SC-005**: Path visualization clearly shows each step with actor names and connecting movie titles
- **SC-006**: The path exploration workflow (anchor → costar → target → path display) is completable in under 30 seconds

## Assumptions

- Kevin Bacon is present in the dataset with a recognizability score ≥ 8 (he is a well-known actor)
- The actor graph for recognizability ≥ 8 is small enough that all-pairs shortest path computation is feasible
- Users understand the concept of "bacon number" as the number of steps to reach Kevin Bacon
- The existing graph visualization infrastructure can be extended to show path highlighting
- Movie titles are sufficient identifiers for edges (no need for additional movie metadata in path display)
