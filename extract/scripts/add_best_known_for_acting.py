#!/usr/bin/env python3
"""
Script to add 'best_known_for_acting' column to actor_details.csv
Defaults to true, with specific non-actors marked as false.
"""

import pandas as pd
import os

# Non-actors by category (person_id values)
# These are people who appear in movies but are NOT best known for acting

NON_ACTORS = {
    # Musicians/Singers
    82702,   # Michael Jackson
    8851,    # Whitney Houston
    7487,    # David Bowie
    111946,  # Britney Spears
    14386,   # Beyoncé
    7175,    # Aretha Franklin
    155488,  # Kelly Clarkson
    85757,   # Joe Jonas
    1562344, # Cardi B
    1549008, # The Weeknd
    7174,    # Ray Charles
    7172,    # James Brown
    108558,  # Shania Twain
    20497,   # Fergie
    8261,    # Willie Nelson
    1459,    # Tina Turner
    57108,   # Usher
    31136,   # Chris Brown
    33684,   # Bono
    212208,  # Taylor Swift
    76594,   # Miley Cyrus
    77948,   # Selena Gomez
    54421,   # Janet Jackson
    3125,    # Madonna
    66586,   # Mariah Carey
    11370,   # Elton John
    119454,  # Mars (Bruno Mars alternate entry)
    969218,  # Bruno Mars
    224235,  # DJ Khaled
    1959397, # Dua Lipa
    217371,  # Adam Levine
    1136517, # Sia
    968660,  # Nicki Minaj
    10215,   # Paul McCartney
    85138,   # Demi Lovato
    85930,   # John Mayer
    226001,  # Ariana Grande
    1821863, # Post Malone
    113461,  # John Legend
    446511,  # Shakira
    1009740, # Pitbull
    31133,   # Ne-Yo
    131519,  # Rihanna
    96091,   # Carrie Underwood
    111455,  # Katy Perry
    108661,  # Chester Bennington
    197315,  # Drake
    998387,  # Ed Sheeran
    20472,   # Norah Jones
    1052109, # Harry Styles
    53397,   # Christina Aguilera
    77271,   # Pink
    77069,   # Lenny Kravitz
    60642,   # Tom Petty
    60017,   # Faith Hill
    71041,   # 'Weird Al' Yankovic
    237405,  # Lady Gaga
    130640,  # Hailee Steinfeld (singer/actress - but primarily known for singing now)

    # TV Hosts/Personalities
    13309,   # Oprah Winfrey
    165899,  # Simon Cowell
    1238247, # Chrissy Teigen
    33663,   # Donald Trump
    12219,   # Jon Stewart
    31309,   # Hugh Hefner
    91609,   # Joe Rogan
    81200,   # Conan O'Brien
    58769,   # Stephen Colbert
    151657,  # Regis Philbin
    55466,   # James Corden
    14837,   # Carol Burnett (TV personality/comedian)

    # Athletes
    35806,   # Shaquille O'Neal
    147445,  # Derek Jeter
    59538,   # David Beckham
    107379,  # LeBron James
    216294,  # Lewis Hamilton
    12951,   # O. J. Simpson

    # Models
    56367,   # Naomi Campbell
    10583,   # Gisele Bündchen

    # YouTubers/Internet Personalities
    2282154, # Jimmy Donaldson (MrBeast)
    1700631, # Liza Koshy

    # Reality TV / Other
    212225,  # Kim Kardashian
    1216701, # Meghan, Duchess of Sussex
    1493224, # Ruth Bader Ginsburg

    # Other (astronauts, etc.)
    87485,   # Neil Armstrong

    # Puppets/Characters
    3203609, # Elmo
}

def main():
    # Path to the data file
    script_dir = os.path.dirname(os.path.abspath(__file__))
    data_dir = os.path.join(script_dir, '..', 'data')
    actor_details_path = os.path.join(data_dir, 'actor_details.csv')

    print(f"Reading {actor_details_path}...")
    df = pd.read_csv(actor_details_path)

    print(f"Loaded {len(df)} actor records")
    print(f"Columns: {list(df.columns)}")

    # Add best_known_for_acting column, defaulting to true
    df['best_known_for_acting'] = True

    # Mark non-actors as false
    non_actor_mask = df['person_id'].isin(NON_ACTORS)
    df.loc[non_actor_mask, 'best_known_for_acting'] = False

    # Count how many were marked
    non_actor_count = non_actor_mask.sum()
    print(f"Marked {non_actor_count} entries as NOT best known for acting")

    # Show which ones were marked
    if non_actor_count > 0:
        marked_names = df.loc[non_actor_mask, ['person_id', 'name', 'Recognizability']].drop_duplicates()
        print("\nMarked as non-actors:")
        for _, row in marked_names.iterrows():
            print(f"  - {row['name']} (ID: {row['person_id']}, Recognizability: {row['Recognizability']})")

    # Save the updated file
    df.to_csv(actor_details_path, index=False)
    print(f"\nSaved updated file to {actor_details_path}")

    # Verify
    print("\nVerification - sample of data:")
    print(df[['person_id', 'name', 'Recognizability', 'best_known_for_acting']].head(10))

if __name__ == '__main__':
    main()
