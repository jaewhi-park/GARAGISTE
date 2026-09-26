#!/usr/bin/env node
// Sets the working language of the team: writes the "## Language" section of the rules file (AGENTS.md or CLAUDE.md) and,
// with --settings, the `language` key of a settings file (Claude Code's own response-language setting; opencode has none).
// Usage: node set-language.mjs <code> [--file AGENTS.md|CLAUDE.md] [--root <repo dir>] [--settings <settings.json>]
//   <code>   e.g. ko, en, ja. Free text is accepted ("ko, docs in en"); the settings key gets the leading code only.
// Creates the file with only a title and the Language section when it does not exist; otherwise replaces just that section
// (or inserts it after the title block). Everything else in the file is left untouched. Prints old → new.
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { basename, join, resolve } from "node:path";

const argv = process.argv.slice(2);
let file = "AGENTS.md", root = process.cwd(), code = "", settings = "";
const usage = () => { console.error("Usage: node set-language.mjs <code> [--file AGENTS.md|CLAUDE.md] [--root <dir>] [--settings <settings.json>]"); process.exit(2); };
for (let i = 0; i < argv.length; i++) {
  const a = argv[i];
  if (a === "--file" || a === "--root" || a === "--settings") {
    const v = argv[++i];
    if (v === undefined || v.startsWith("--")) usage();
    if (a === "--file") file = v; else if (a === "--root") root = v; else settings = v;
  }
  else if (a === "-h" || a === "--help") { console.log(readFileSync(new URL(import.meta.url), "utf8").split("\n").slice(1, 6).join("\n").replace(/^\/\/ ?/gm, "")); process.exit(0); }
  else code = code ? `${code} ${a}` : a;
}
code = code.trim();
if (!code) usage();

// The settings key: the leading language code of <code> ("ko, docs in en" → ko), merged into an existing file or a new one.
function writeSettings() {
  if (!settings) return;
  const short = (/^[A-Za-z]{2,3}(?:[-_][A-Za-z]+)?/.exec(code) ?? [])[0]?.toLowerCase();
  if (!short) { console.error(`! ${settings}: no language code at the start of "${code}"; settings left alone`); return; }
  const sp = resolve(join(root, settings));
  let s = {};
  if (existsSync(sp)) { try { s = JSON.parse(readFileSync(sp, "utf8")); } catch { console.error(`! ${settings}: not valid JSON; settings left alone`); return; } }
  const was = s.language ?? "(unset)";
  s.language = short;
  writeFileSync(sp, JSON.stringify(s, null, 2) + "\n");
  console.log(`→ ${settings} language: ${was} → ${short}`);
}


const path = resolve(join(root, file));
const HEADING = "## Language";
const section = [HEADING, `- ${code}  (responses, questions and documents; change with /lang)`];

if (!existsSync(path)) {
  writeFileSync(path, `# ${basename(resolve(root))}\n\n${section.join("\n")}\n`);
  console.log(`→ ${file} created with Language = ${code}`);
  writeSettings();
  process.exit(0);
}

const raw = readFileSync(path, "utf8");
const eol = raw.includes("\r\n") ? "\r\n" : "\n";
const lines = raw.split(/\r?\n/);
// Lines inside fenced code blocks are never headings (CLAUDE.md often shows "## Language" as an example).
const fenced = []; { let f = false; for (const l of lines) { if (/^[ \t]*(```|~~~)/.test(l)) f = !f; fenced.push(f); } }
const isH2 = (l, i) => !fenced[i] && /^##\s/.test(l);
let start = lines.findIndex((l, i) => !fenced[i] && l.trim() === HEADING);
let previous = "(unset)";
if (start >= 0) {
  let end = start + 1;
  while (end < lines.length && !isH2(lines[end], end)) end++;
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
// Only the file's tail is normalised (one trailing newline); blank lines elsewhere, including inside code blocks, are left alone.
let out = lines.join(eol).replace(/(\r?\n){2,}$/, eol);
if (!out.endsWith(eol)) out += eol;
writeFileSync(path, out);
console.log(`→ ${file} Language: ${previous} → ${code}`);
writeSettings();
