// Normalises a lesson into the parts the learner and mentor views render.
// Older lesson shapes (proveTask, checklist, hint, code, prompt) still work so
// tests and any historical content keep rendering.
export function lessonParts(lesson) {
  const byHand =
    lesson.byHand ||
    (lesson.proveTask
      ? { task: lesson.proveTask, checklist: lesson.checklist || [] }
      : { task: "", checklist: [] })
  const withAI = lesson.withAI
    ? lesson.withAI
    : lesson.byHand || !lesson.prompt
      ? null
      : { task: "", prompt: lesson.prompt, checklist: [] }
  const hints = lesson.hints || (lesson.hint ? [lesson.hint] : [])
  const examples =
    lesson.examples || (lesson.code ? [{ code: lesson.code }] : [])
  const checks = lesson.checks || []
  const aiLabel =
    lesson.ai ||
    (withAI ? "By hand first · then Claude Code" : "No AI in this lesson")
  return { byHand, withAI, hints, examples, checks, aiLabel }
}
