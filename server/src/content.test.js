import { describe, expect, it } from "vitest";
import { getConcepts, getProgram } from "./content.js";

describe("getConcepts", () => {
  it("lists thirty-six lessons across six weeks in order", () => {
    const concepts = getConcepts();

    expect(concepts).toHaveLength(36);
    expect(concepts.map((c) => c.id).slice(0, 6)).toEqual([
      "L01", "L02", "L03", "L04", "L05", "L06",
    ]);
    const program = getProgram();
    expect(program.weeks).toHaveLength(6);
    const mapped = program.weeks.flatMap((week) => week.ids);
    expect(new Set(mapped).size).toBe(36);
    expect(mapped).toEqual(concepts.map((c) => c.id));
    expect(program.weeks[0].ids).toContain("L01");
    expect(program.weeks[5].ids).toContain("L31");

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

  it("never shows the retired foundation prose and keeps lesson titles as concept names", () => {
    for (const concept of getConcepts()) {
      expect(concept.concept).toBe(concept.title);
      expect(concept.proveTask).toBe(concept.byHand.task);
    }
    expect(JSON.stringify(getConcepts())).not.toMatch(/Run Claude Code in plan mode\. Reject one plan/);
  });
});

describe("program content rules", () => {
  const program = getProgram();

  it("gives every lesson a prediction, checks with one correct answer and feedback, a no-AI task, three staged hints, and a reading under five minutes", () => {
    for (const lesson of program.lessons) {
      expect(lesson.predictPrompt.length).toBeGreaterThan(20);
      expect(lesson.checks.length).toBeGreaterThanOrEqual(2);
      for (const check of lesson.checks) {
        expect(check.options.filter((o) => o.correct)).toHaveLength(1);
        for (const option of check.options) expect(option.feedback).toBeTruthy();
      }
      expect(lesson.byHand.task).toBeTruthy();
      expect(lesson.byHand.checklist.length).toBeGreaterThan(0);
      if (lesson.withAI) {
        expect(lesson.withAI.task).toBeTruthy();
        expect(lesson.withAI.checklist.length).toBeGreaterThan(0);
      }
      expect(lesson.hints).toHaveLength(3);
      expect(lesson.examples.length).toBeGreaterThan(0);
      // ~200 words per minute; keep the explanation under about five minutes.
      expect(lesson.lesson.split(/\s+/).length).toBeLessThan(450);
    }
  });

  it("keeps the independent-explanation demo free of AI and the weekly load under five hours of lessons", () => {
    const demo = program.lessons.find((l) => l.id === "L35");
    expect(demo.ai).toBe("Explain without AI");
    expect(demo.withAI).toBeNull();
    for (const week of program.weeks) {
      const minutes = week.ids
        .map((id) => program.lessons.find((l) => l.id === id).time)
        .reduce((a, b) => a + b, 0);
      expect(minutes).toBeLessThanOrEqual(300);
      expect(week.deliverables.length).toBeGreaterThan(0);
    }
  });

  it("gives Week 1 interactive widgets with known types, and installs tools before any prediction", () => {
    const types = new Set([
      "setup-checklist", "request-tracer", "stack-map",
      "git-playground", "token-counter", "bucket-sort", "prompt-builder",
      "render-tracer", "flow-tracer",
    ]);
    for (const lesson of program.lessons)
      for (const widget of lesson.widgets || []) {
        expect(types.has(widget.type)).toBe(true);
        expect(widget.title).toBeTruthy();
      }
    const setup = program.lessons.find((l) => l.id === "L01");
    expect(setup.kind).toBe("Setup");
    expect(setup.widgets[0].type).toBe("setup-checklist");
    expect(setup.widgets[0].items.map((i) => i.name)).toEqual(
      expect.arrayContaining(["VS Code", "Node.js (LTS)", "Git", "GitHub account"]),
    );
    expect(setup.withAI).toBeNull();
    for (const id of program.weeks[0].ids)
      expect(program.lessons.find((l) => l.id === id).withAI).toBeNull();
    for (const id of program.weeks[0].ids) {
      const lesson = program.lessons.find((l) => l.id === id);
      expect(lesson.prepare.length).toBeGreaterThan(0);
      for (const item of lesson.prepare) {
        expect(item.topic).toBeTruthy();
        expect(item.meaning).toBeTruthy();
        for (const rid of item.resources) {
          expect(program.resources.some((r) => r.id === rid)).toBe(true);
          expect(lesson.resources).toContain(rid);
        }
      }
    }
    expect(program.weeks[1].ids).toEqual(["L07", "L08", "L09", "L10", "L11", "L12"]);
    for (const id of program.weeks[1].ids) {
      const lesson = program.lessons.find((l) => l.id === id);
      expect(lesson.prepare.length).toBeGreaterThan(0);
      expect(lesson.keyReading).toBeTruthy();
      if (lesson.explainBack) expect(lesson.withAI).toBeTruthy();
    }
    expect(program.lessons.find((l) => l.id === "L07").withAI).toBeNull();
    expect(program.lessons.find((l) => l.id === "L08").widgets[0].type).toBe("setup-checklist");
    expect(program.lessons.find((l) => l.id === "L09").widgets[0].type).toBe("prompt-builder");
    expect(program.lessons.find((l) => l.id === "L12").explainBack.prompt).toMatch(/SQL injection/);
    for (const lesson of program.lessons) {
      if (!lesson.keyReading) continue;
      expect(program.resources.some((r) => r.id === lesson.keyReading.resource)).toBe(true);
      expect(lesson.resources).toContain(lesson.keyReading.resource);
      expect(lesson.keyReading.why.length).toBeGreaterThan(20);
    }
    const sorter = program.lessons.find((l) => l.id === "L06").widgets.find((w) => w.type === "bucket-sort");
    const bucketNames = sorter.buckets.map((b) => b.name);
    for (const card of sorter.cards) expect(bucketNames).toContain(card.answer);
    for (const bucket of sorter.buckets) expect(bucket.meaning).toBeTruthy();
  });

  it("spreads correct answers across option positions so there is no pattern to guess", () => {
    const positions = {};
    let total = 0;
    for (const lesson of program.lessons)
      for (const check of lesson.checks) {
        const i = check.options.findIndex((o) => o.correct);
        positions[i] = (positions[i] || 0) + 1;
        total += 1;
      }
    for (const i of [0, 1, 2]) expect(positions[i] / total).toBeGreaterThan(0.2);
  });

  it("publishes the mentor rhythm and the primary tool", () => {
    expect(program.mentor.reviewSlot).toMatch(/Thursday/);
    expect(program.mentor.questionResponseTime).toMatch(/working day/);
    expect(program.tools.primary).toBe("Claude Code");
    expect(JSON.stringify(program.lessons)).not.toMatch(/Cline/);
    expect(JSON.stringify(program.resources)).not.toMatch(/microsoft\.github\.io/);
    expect(program.lessons.some((l) => /real team|team repository/i.test(l.title + l.summary))).toBe(false);
    for (const week of program.weeks)
      for (const id of week.ids) {
        const lesson = program.lessons.find((l) => l.id === id);
        expect(lesson.prepare.length).toBeGreaterThan(0);
        expect(lesson.keyReading).toBeTruthy();
      }
  });
});
