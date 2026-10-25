import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const conceptsDir = path.join(__dirname, "../../content/concepts");

export function getProgram() {
  return JSON.parse(
    fs.readFileSync(
      path.join(__dirname, "../../content/program.json"),
      "utf-8",
    ),
  );
}

// Flattens the current lesson schema into the fields older API consumers and
// tests expect (proveTask, checklist). Foundation files F1–F8 contribute only
// their original concept name; their old prose never leaks through.
export function getConcepts() {
  const files = fs
    .readdirSync(conceptsDir)
    .filter((file) => file.endsWith(".json"));
  const foundations = files.map((file) =>
    JSON.parse(fs.readFileSync(path.join(conceptsDir, file), "utf-8")),
  );
  const program = getProgram();
  return program.lessons.map((lesson) => {
    const foundation = foundations.find((item) => item.id === lesson.id);
    const byHand = lesson.byHand;
    const withAI = lesson.withAI;
    return {
      ...lesson,
      concept: foundation?.concept || lesson.concept || lesson.title,
      proveTask: byHand?.task || lesson.proveTask || "",
      checklist:
        lesson.checklist ||
        [...(byHand?.checklist || []), ...(withAI?.checklist || [])],
    };
  });
}
