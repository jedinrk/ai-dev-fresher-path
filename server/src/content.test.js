import { describe, expect, it } from "vitest";
import { getConcepts, getProgram } from "./content.js";

describe("getConcepts", () => {
  it("retains all foundation IDs in a complete four-week curriculum", () => {
    const concepts = getConcepts();

    expect(concepts).toHaveLength(20);
    expect(concepts.map((c) => c.id)).toEqual(
      expect.arrayContaining(["F1", "F2", "F3", "F4", "F5", "F6", "F7", "F8"]),
    );
    const program = getProgram();
    const mapped = program.weeks.flatMap((week) => week.ids);
    expect(new Set(mapped).size).toBe(20);
    expect(mapped).toEqual(concepts.map((c) => c.id));
    expect(program.weeks[0].ids).toContain("F8");

    for (const concept of concepts) {
      expect(concept.concept).toBeTruthy();
      expect(concept.predictPrompt).toBeTruthy();
      expect(concept.lesson).toBeTruthy();
      expect(concept.proveTask).toBeTruthy();
      expect(concept.checklist.length).toBeGreaterThan(0);
      for (const id of concept.resources)
        expect(program.resources.some((r) => r.id === id)).toBe(true);
    }
  });
});
