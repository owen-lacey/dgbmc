#!/usr/bin/env python3
"""
Script to update web CSV files with best_known_for_acting column.
"""

import pandas as pd
import os

def main():
    script_dir = os.path.dirname(os.path.abspath(__file__))
    data_dir = os.path.join(script_dir, '..', 'data')
    web_data_dir = os.path.join(script_dir, '..', '..', 'web', 'public', 'data')

    # Load actor_details.csv to get the best_known_for_acting mapping
    actor_details_path = os.path.join(data_dir, 'actor_details.csv')
    actors_df = pd.read_csv(actor_details_path)

    # Create a mapping from person_id to best_known_for_acting
    # Use drop_duplicates to get unique person_ids
    actor_flag_map = actors_df[['person_id', 'best_known_for_acting']].drop_duplicates('person_id')
    print(f"Loaded {len(actor_flag_map)} actor flag mappings")

    # Process each web nodes CSV file
    for level in [8, 9, 10]:
        nodes_file = os.path.join(web_data_dir, f'nodes_{level}.csv')
        if not os.path.exists(nodes_file):
            print(f"Skipping {nodes_file} - file not found")
            continue

        print(f"\nProcessing {nodes_file}...")
        nodes_df = pd.read_csv(nodes_file)
        print(f"  Loaded {len(nodes_df)} nodes")

        # Extract person_id from the 'id' column (format: P-{person_id})
        nodes_df['person_id'] = nodes_df['id'].str.replace('P-', '').astype(int)

        # Merge with actor_flag_map
        nodes_df = nodes_df.merge(actor_flag_map, on='person_id', how='left')

        # Fill any NaN values with True (default to best known for acting)
        nodes_df['best_known_for_acting'] = nodes_df['best_known_for_acting'].fillna(True)

        # Drop the temporary person_id column and reorder
        nodes_df = nodes_df.drop('person_id', axis=1)

        # Reorder columns to put best_known_for_acting at the end
        cols = ['id', 'name', 'type', 'Recognizability', 'movie_count', 'best_known_for_acting']
        nodes_df = nodes_df[cols]

        # Save the updated file
        nodes_df.to_csv(nodes_file, index=False)
        print(f"  Saved updated file with best_known_for_acting column")

        # Count non-actors
        non_actors = nodes_df[nodes_df['best_known_for_acting'] == False]
        print(f"  Non-actors in this file: {len(non_actors)}")
        if len(non_actors) > 0:
            print(f"  Examples: {', '.join(non_actors['name'].head(5).tolist())}")

    print("\nDone!")

if __name__ == '__main__':
    main()
