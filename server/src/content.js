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
    return {
      ...foundation,
      ...lesson,
      concept: foundation?.concept || lesson.concept || lesson.title,
    };
  });
}
