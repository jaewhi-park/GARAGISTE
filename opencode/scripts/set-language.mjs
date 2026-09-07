#!/usr/bin/env node
// Sets the working language of the team: writes the "## Language" section of the rules file (AGENTS.md or CLAUDE.md).
// Usage: node set-language.mjs <code> [--file AGENTS.md|CLAUDE.md] [--root <repo dir>]
//   <code>   e.g. ko, en, ja. Free text is accepted ("ko, docs in en").
// Creates the file with only a title and the Language section when it does not exist; otherwise replaces just that section
// (or inserts it after the title block). Everything else in the file is left untouched. Prints old → new.
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { basename, join, resolve } from "node:path";

const argv = process.argv.slice(2);
let file = "AGENTS.md", root = process.cwd(), code = "";
for (let i = 0; i < argv.length; i++) {
  const a = argv[i];
  if (a === "--file") file = argv[++i];
  else if (a === "--root") root = argv[++i];
  else if (a === "-h" || a === "--help") { console.log(readFileSync(new URL(import.meta.url), "utf8").split("\n").slice(1, 6).join("\n").replace(/^\/\/ ?/gm, "")); process.exit(0); }
  else code = code ? `${code} ${a}` : a;
}
code = code.trim();
if (!code) { console.error("Usage: node set-language.mjs <code> [--file AGENTS.md|CLAUDE.md] [--root <dir>]"); process.exit(2); }

const path = resolve(join(root, file));
const HEADING = "## Language";
const section = [HEADING, `- ${code}  (responses, questions and documents; change with /lang)`];

if (!existsSync(path)) {
  writeFileSync(path, `# ${basename(resolve(root))}\n\n${section.join("\n")}\n`);
  console.log(`→ ${file} created with Language = ${code}`);
  process.exit(0);
}

const raw = readFileSync(path, "utf8");
const eol = raw.includes("\r\n") ? "\r\n" : "\n";
const lines = raw.split(/\r?\n/);
const isH2 = (l) => /^##\s/.test(l);
let start = lines.findIndex((l) => l.trim() === HEADING);
let previous = "(unset)";
if (start >= 0) {
  let end = start + 1;
  while (end < lines.length && !isH2(lines[end])) end++;
  const old = lines.slice(start + 1, end).map((l) => l.trim().replace(/^-\s*/, "").replace(/\s*\(.*\)\s*$/, "")).filter(Boolean);
  if (old.length) previous = old.join(" ");
  // keep one blank line before the next section
  const tail = lines.slice(end);
  lines.splice(start, lines.length - start, ...section, "", ...tail);
} else {
  let at = lines.findIndex(isH2);
  if (at < 0) { at = lines.length; while (at > 0 && lines[at - 1].trim() === "") at--; lines.splice(at, lines.length - at, "", ...section, ""); }
  else lines.splice(at, 0, ...section, "");
}
let out = lines.join(eol).replace(/(\r?\n){3,}$/, eol).replace(/(\r?\n){3,}/g, `${eol}${eol}`);
if (!out.endsWith(eol)) out += eol;
writeFileSync(path, out);
console.log(`→ ${file} Language: ${previous} → ${code}`);
