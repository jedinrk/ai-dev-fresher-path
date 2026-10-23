import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const conceptsDir = path.join(__dirname, '../../content/concepts');

export function getConcepts() {
  const files = fs.readdirSync(conceptsDir).filter((file) => file.endsWith('.json'));
  return files
    .map((file) => JSON.parse(fs.readFileSync(path.join(conceptsDir, file), 'utf-8')))
    .sort((a, b) => a.id.localeCompare(b.id));
}
