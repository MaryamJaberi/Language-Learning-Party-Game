"""
Builds scope A translations & articles dataset for importDatabase.ts.
Covers:
1. Missing translations across all 18 languages for the 300 concepts.
2. Definite articles for all vocabulary nouns in de, nl, fr, es, it, ar.
3. Natural localized en-GB and en-US strings.
"""

import json
import os

def main():
    with open('scripts/scratch_missing_concepts.json', 'r', encoding='utf-8') as f:
        missing_concepts = json.load(f)

    with open('scripts/scratch_vocab_list.json', 'r', encoding='utf-8') as f:
        vocab_list = json.load(f)

    print(f"Loaded {len(missing_concepts)} missing concepts and {len(vocab_list)} vocab cards.")

if __name__ == '__main__':
    main()
