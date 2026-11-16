import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

export { ASSESSMENT_PROMPT_VERSION } from "./version";

const dir = path.dirname(fileURLToPath(import.meta.url));

import { ASSESSMENT_PROMPT_VERSION as PROMPT_VERSION } from "./version";

export function loadSystemPrompt(version: string = PROMPT_VERSION): string {
  const file = path.join(dir, `system-v${version}.md`);
  return readFileSync(file, "utf8");
}