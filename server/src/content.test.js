import { describe, expect, it } from 'vitest';
import { getConcepts } from './content.js';

describe('getConcepts', () => {
  it('loads all 8 foundation concepts with the required fields', () => {
    const concepts = getConcepts();

    expect(concepts).toHaveLength(8);
    expect(concepts.map((c) => c.id)).toEqual([
      'F1',
      'F2',
      'F3',
      'F4',
      'F5',
      'F6',
      'F7',
      'F8',
    ]);

    for (const concept of concepts) {
      expect(concept.concept).toBeTruthy();
      expect(concept.predictPrompt).toBeTruthy();
      expect(concept.lesson).toBeTruthy();
      expect(concept.proveTask).toBeTruthy();
    }
  });
});
