#!/usr/bin/env node
// Writes the "## Operating profile" section of the rules file (AGENTS.md or CLAUDE.md). Used by /hire after CEO approval.
// Usage: node set-profile.mjs [--file AGENTS.md|CLAUDE.md] [--root <repo dir>] "<line>" ["<line>"...]
//   Each argument becomes one bullet, e.g. "budget tier: high" "default review lenses: 2" "parallelism: none"
//   "plan-size target: 4" "per-step verifier: off" "step-size target: 300" "hired: 2026-09-10 — MVP, opus where judgment happens".
// Replaces just that section when it exists (or inserts it before "## Merge policy" / at the end); everything else is untouched.
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { basename, join, resolve } from "node:path";

const argv = process.argv.slice(2);
let file = "AGENTS.md", root = process.cwd();
const items = [];
const usage = () => { console.error('Usage: node set-profile.mjs [--file AGENTS.md|CLAUDE.md] [--root <dir>] "<line>" ["<line>"...]'); process.exit(2); };
for (let i = 0; i < argv.length; i++) {
  const a = argv[i];
  if (a === "--file" || a === "--root") {
    const v = argv[++i];
    if (v === undefined || v.startsWith("--")) usage();
    if (a === "--file") file = v; else root = v;
  } else if (a === "-h" || a === "--help") { console.log(readFileSync(new URL(import.meta.url), "utf8").split("\n").slice(1, 6).join("\n").replace(/^\/\/ ?/gm, "")); process.exit(0); }
  else if (a.trim()) items.push(a.trim());
}
if (!items.length) usage();

const path = resolve(join(root, file));
const HEADING = "## Operating profile";
const section = [HEADING, ...items.map((l) => (l.startsWith("- ") ? l : `- ${l}`))];

if (!existsSync(path)) {
  writeFileSync(path, `# ${basename(resolve(root))}\n\n${section.join("\n")}\n`);
  console.log(`→ ${file} created with an Operating profile (${items.length} lines)`);
  process.exit(0);
}

const raw = readFileSync(path, "utf8");
const eol = raw.includes("\r\n") ? "\r\n" : "\n";
const lines = raw.split(/\r?\n/);
// Lines inside fenced code blocks are never headings (the rules-file template shows the section as an example).
const fenced = []; { let f = false; for (const l of lines) { if (/^[ \t]*(```|~~~)/.test(l)) f = !f; fenced.push(f); } }
const isH2 = (l, i) => !fenced[i] && /^##\s/.test(l);
const start = lines.findIndex((l, i) => !fenced[i] && l.trim() === HEADING);
if (start >= 0) {
  let end = start + 1;
  while (end < lines.length && !isH2(lines[end], end)) end++;
  const tail = lines.slice(end);
  lines.splice(start, lines.length - start, ...section, "", ...tail);
} else {
  let at = lines.findIndex((l, i) => !fenced[i] && l.trim() === "## Merge policy");
  if (at < 0) { at = lines.length; while (at > 0 && lines[at - 1].trim() === "") at--; lines.splice(at, lines.length - at, "", ...section, ""); }
  else lines.splice(at, 0, ...(at > 0 && lines[at - 1].trim() ? [""] : []), ...section, "");
}
let out = lines.join(eol).replace(/(\r?\n){2,}$/, eol);
if (!out.endsWith(eol)) out += eol;
writeFileSync(path, out);
console.log(`→ ${file} Operating profile written (${items.length} lines)`);
