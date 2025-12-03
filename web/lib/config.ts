/**
 * Application configuration
 */

/**
 * Recognizability level for actor filtering (8, 9, or 10)
 * Defaults to 10 (most recognizable actors)
 * Can be overridden with NEXT_PUBLIC_RECOGNIZABILITY environment variable
 */
export const RECOGNIZABILITY = parseInt(
  process.env.NEXT_PUBLIC_RECOGNIZABILITY || '10',
  10
);

/**
 * Generate CSV file paths based on recognizability level
 */
export function getDataPaths() {
  return {
    nodes: `/data/nodes_${RECOGNIZABILITY}.csv`,
    edges: `/data/edges_${RECOGNIZABILITY}.csv`,
  };
}
