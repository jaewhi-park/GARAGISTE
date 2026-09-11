#!/usr/bin/env node
// Cross-flavor parity check for the template itself (a maintainer tool; the installers never copy it).
// Pairs every claude/ file with its opencode/ counterpart, rewrites the claude side into opencode vocabulary
// (CLAUDE.md → AGENTS.md, AskUserQuestion → the question tool, /parallel → /spawn, … — REWRITE below) and diffs
// the rest. What still differs is the intentional divergence between the flavors; it is recorded in
// scripts/parity-baseline.txt, and the check fails when it changes: a line that now differs between the flavors,
// or a line that no longer does. Three more checks ride along: the flavor READMEs (separate reference documents) must
// mention the same commands, roles, docs/ artifacts and scripts; the scripts/*.mjs must be byte-identical; and every
// <doc>.ko.md must keep the structure of its <doc>.md (same sections; per section the same number of headings,
// list items, table rows, code fences and paragraphs).
// Usage: node scripts/parity-check.mjs                  compare with the baseline; exit 1 when the divergence changed
//        node scripts/parity-check.mjs --update         accept the current divergence as the new baseline
//        node scripts/parity-check.mjs --all            print every pair's divergence, not only the changed ones
//        node scripts/parity-check.mjs --pair <text>    only pairs whose name contains <text>
import { existsSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const BASELINE = "scripts/parity-baseline.txt";

const argv = process.argv.slice(2);
const opt = { update: false, all: false, pair: "" };
for (let i = 0; i < argv.length; i++) {
  const a = argv[i];
  if (a === "--update") opt.update = true;
  else if (a === "--all") opt.all = true;
  else if (a === "--pair") { opt.pair = argv[++i] ?? ""; if (!opt.pair) usage(); }
  else if (a === "-h" || a === "--help") { console.log(readFileSync(new URL(import.meta.url), "utf8").split("\n").slice(1, 13).join("\n").replace(/^\/\/ ?/gm, "")); process.exit(0); }
  else usage();
}
function usage() { console.error("Usage: node scripts/parity-check.mjs [--update] [--all] [--pair <text>]"); process.exit(2); }

// ---- the flavor vocabulary, claude → opencode (applied to the claude side only, in this order) ----
const REWRITE = [
  [/(?<!AGENTS\.md \/ )CLAUDE\.md/g, "AGENTS.md"],                               // "(AGENTS.md / CLAUDE.md)" names both and stays
  [/\bclaude-md\b/g, "agents-md"],
  [/ --file AGENTS\.md\b/g, ""],                                                 // set-language / set-profile name the rules file only in claude
  [/ --settings \.claude\/settings\.json\b/g, ""],                                // apply-models writes the session model only in claude
  [/~\/\.claude\b/g, "~/.config/opencode"],
  [/\.claude\/ and \.gitignore/g, ".opencode/, opencode.json and .gitignore"],   // the docs-only file list
  [/\.claude\/ if not yet tracked/g, ".opencode/ and opencode.json if not yet tracked"],
  [/\.claude\//g, ".opencode/"],
  [/\bClaude Code\b/g, "opencode"],
  [/\bclaude --continue\b/g, "opencode -c"],
  [/\bclaude\b(?!\/opencode)/g, "opencode"],                                      // the CLI and the installers' flavor argument ("claude/opencode output" names both)
  [/\bone AskUserQuestion call\b/g, "one question-tool call"],
  [/\bone AskUserQuestion:/g, "one question-tool call:"],
  [/\bAskUserQuestion\b/g, "the question tool"],
  [/\bthe Explore subagent\b/g, "explore"],
  [/\bAgent calls\b/g, "task calls"],
  [/\/parallel\b/g, "/spawn"],
  [/Awaiting integration/g, "Parallel in progress"],
  [/Awaiting-integration/g, "Parallel-in-progress"],
  [/do not call it via the Skill tool — suggest to the CEO in a sentence: "run `([^`]+)`"/g, "suggest `$1` to the CEO in a sentence"],
  [/do not invoke it via the Skill tool — suggest/g, "suggest"],
];
// Claude-only lines about the Skill-tool mechanism: dropped from the claude side (opencode has no counterpart by design).
const DROP = [/^This skill runs only when the CEO invoked it directly/, /^- Skill invocation rule:/];
// Applied to both sides: tool names are capitalized in claude and plain verbs in opencode.
const CANON = [[/\b(Read|Grep|Glob|Edit|Write|Explore)\b/g, (m) => m.toLowerCase()]];
// Frontmatter keys compared when both sides have them; every other key is flavor-specific by construction.
const FM_SKIP = new Set(["color"]);
// claude skills whose opencode counterpart has another name.
const RENAMED = { parallel: "spawn", "claude-md": "agents-md" };

// ---- pairs ----
const read = (p) => readFileSync(join(ROOT, p), "utf8");
const has = (p) => existsSync(join(ROOT, p));
const ls = (dir, re) => (has(dir) ? readdirSync(join(ROOT, dir)).filter((f) => re.test(f)).sort() : []);

const pairs = [];      // { name, kind: content | identical | structure, a, b }
const coverage = [];   // files with no counterpart
const claimed = new Set();
for (const name of ls("claude/.claude/skills", /^[\w-]+$/)) {
  const a = `claude/.claude/skills/${name}/SKILL.md`;
  const other = RENAMED[name] ?? name;
  const b = [`opencode/commands/${other}.md`, `opencode/skills/${other}/SKILL.md`].find(has);
  if (b) { pairs.push({ kind: "content", a, b }); claimed.add(b); } else coverage.push(`claude-only: ${a}`);
}
for (const f of ls("opencode/commands", /\.md$/)) { const b = `opencode/commands/${f}`; if (!claimed.has(b)) coverage.push(`opencode-only: ${b}`); }
for (const d of ls("opencode/skills", /^[\w-]+$/)) { const b = `opencode/skills/${d}/SKILL.md`; if (!claimed.has(b)) coverage.push(`opencode-only: ${b}`); }
const agents = new Set([...ls("claude/.claude/agents", /\.md$/), ...ls("opencode/agents", /\.md$/)]);
for (const f of [...agents].sort()) {
  const a = `claude/.claude/agents/${f}`, b = `opencode/agents/${f}`;
  if (has(a) && has(b)) pairs.push({ kind: "content", a, b });
  else coverage.push(has(a) ? `claude-only: ${a}` : `opencode-only: ${b}`);
}
for (const f of [...ls("claude", /\.md$/), ...ls("claude/docs", /\.md$/).map((f) => `docs/${f}`)]) {
  // The flavor READMEs are separate reference documents with their own sections: only what they mention is compared.
  const a = `claude/${f}`, b = `opencode/${f}`;
  if (has(b)) pairs.push({ kind: /^README/.test(f) ? "mentions" : "content", a, b }); else coverage.push(`claude-only: ${a}`);
}
for (const f of ls("opencode", /\.md$/)) if (!has(`claude/${f}`)) coverage.push(`opencode-only: opencode/${f}`);
const scripts = new Set([...ls("claude/scripts", /\.mjs$/), ...ls("opencode/scripts", /\.mjs$/)]);
for (const f of [...scripts].sort()) {
  const a = `claude/scripts/${f}`, b = `opencode/scripts/${f}`;
  if (has(a) && has(b)) pairs.push({ kind: "identical", a, b });
  else coverage.push(has(a) ? `claude-only: ${a}` : `opencode-only: ${b}`);
}
for (const dir of ["", "claude/", "opencode/"]) {
  for (const f of ls(dir || ".", /\.ko\.md$/)) {
    const a = `${dir}${f.replace(/\.ko\.md$/, ".md")}`, b = `${dir}${f}`;
    if (has(a)) pairs.push({ kind: "structure", a, b }); else coverage.push(`ko-only: ${b}`);
  }
}
for (const p of pairs) p.name = `${p.a} ↔ ${p.b}`;

// ---- diffing ----
function lcs(a, b) {
  // Classic LCS table (inputs are a few hundred lines or tokens); returns ["=", i, j] | ["-", i] | ["+", j] ops.
  const n = a.length, m = b.length;
  const dp = Array.from({ length: n + 1 }, () => new Uint16Array(m + 1));
  for (let i = n - 1; i >= 0; i--) for (let j = m - 1; j >= 0; j--)
    dp[i][j] = a[i] === b[j] ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1]);
  const ops = []; let i = 0, j = 0;
  while (i < n && j < m) {
    if (a[i] === b[j]) ops.push(["=", i++, j++]);
    else if (dp[i + 1][j] >= dp[i][j + 1]) ops.push(["-", i++]);
    else ops.push(["+", j++]);
  }
  while (i < n) ops.push(["-", i++]);
  while (j < m) ops.push(["+", j++]);
  return ops;
}
function wordDiff(a, b) {
  // One changed line as git's plain word-diff would print it: [-removed-]{+added+} around the common words.
  const ta = a.trim().split(/\s+/), tb = b.trim().split(/\s+/);
  const out = []; let del = [], add = [];
  const flush = () => { if (del.length) out.push(`[-${del.join(" ")}-]`); if (add.length) out.push(`{+${add.join(" ")}+}`); del = []; add = []; };
  for (const op of lcs(ta, tb)) {
    if (op[0] === "=") { flush(); out.push(ta[op[1]]); }
    else if (op[0] === "-") del.push(ta[op[1]]);
    else add.push(tb[op[1]]);
  }
  flush();
  return out.join(" ");
}
function lineDiff(a, b) {
  // Changed lines only, no positions (so an insertion elsewhere does not move the baseline): removed and added lines
  // of one hunk are paired in order and word-diffed; the rest print whole. Blank lines never count.
  const out = []; let del = [], add = [];
  const flush = () => {
    for (let k = 0; k < Math.max(del.length, add.length); k++) {
      if (k < del.length && k < add.length) out.push(wordDiff(del[k], add[k]));
      else out.push(k < del.length ? `[-${del[k]}-]` : `{+${add[k]}+}`);
    }
    del = []; add = [];
  };
  for (const op of lcs(a, b)) {
    if (op[0] === "=") flush();
    else if (op[0] === "-") { if (a[op[1]].trim()) del.push(a[op[1]]); }
    else if (b[op[1]].trim()) add.push(b[op[1]]);
  }
  flush();
  return out;
}

// ---- normalization ----
function split(text) {
  // Frontmatter as key → value (continuation lines join their key), body as lines.
  const lines = text.replace(/^﻿/, "").split(/\r?\n/);
  const fm = {};
  let body = lines;
  if (lines[0] === "---") {
    const end = lines.indexOf("---", 1);
    if (end > 0) {
      let key = "";
      for (const l of lines.slice(1, end)) {
        const m = /^([A-Za-z][\w-]*):\s*(.*)$/.exec(l);
        if (m) { key = m[1]; fm[key] = m[2]; } else if (key) fm[key] = `${fm[key]} ${l.trim()}`.trim();
      }
      body = lines.slice(end + 1);
    }
  }
  return { fm, body };
}
function tidy(lines) {
  // Trailing whitespace off, inner runs of spaces (code-block alignment) collapsed, blank runs collapsed, no leading or
  // trailing blank lines.
  const out = [];
  for (const raw of lines) { const l = raw.replace(/\s+$/, "").replace(/(\S)[ \t]{2,}/g, "$1 "); if (l || (out.length && out[out.length - 1])) out.push(l); }
  while (out.length && !out[out.length - 1]) out.pop();
  return out;
}
const canon = (s) => CANON.reduce((t, [re, fn]) => t.replace(re, fn), s);
const rewrite = (s) => REWRITE.reduce((t, [re, to]) => t.replace(re, to), s);
function normalizeClaude(text) {
  const { fm, body } = split(text);
  for (const k of Object.keys(fm)) fm[k] = canon(rewrite(fm[k]));
  return { fm, body: tidy(body.filter((l) => !DROP.some((re) => re.test(l))).map((l) => canon(rewrite(l)))) };
}
function normalizeOpencode(text) {
  const { fm, body } = split(text);
  for (const k of Object.keys(fm)) fm[k] = canon(fm[k]);
  return { fm, body: tidy(body.map(canon)) };
}
function mentions(text) {
  // Slash commands, team roles, docs/ artifacts (with or without .md) and scripts named in a document.
  return new Set(Array.from(text.matchAll(/(?<![\w.~/*])\/[a-z][a-z-]*\b|\bteam-[a-z]+\b|\bdocs\/[A-Za-z_]+(?:\.md)?|\b[\w-]+\.mjs\b/g), (m) => m[0].replace(/\.md$/, "")));
}
const COUNTS = ["h", "li", "row", "fence", "para"];
function structure(text) {
  // Per section (an h1/h2 heading opens one): counts of deeper headings, list items, table rows, code fences and
  // paragraphs. Titles are only shown, never compared — they are in different languages.
  const fresh = (title) => ({ title, h: 0, li: 0, row: 0, fence: 0, para: 0 });
  const sections = []; let cur = fresh("(top)"); let fence = false;
  for (const raw of text.replace(/^﻿/, "").split(/\r?\n/)) {
    const l = raw.replace(/\s+$/, "");
    if (/^\s*(```|~~~)/.test(l)) { fence = !fence; if (fence) cur.fence++; continue; }
    if (fence) continue;
    const h = /^(#{1,6})\s+(.*)$/.exec(l);
    if (h && h[1].length <= 2) { sections.push(cur); cur = fresh(h[2]); }
    else if (h) cur.h++;
    else if (/^\s*\|/.test(l)) { if (!/^\s*\|\s*:?-+/.test(l)) cur.row++; }
    else if (/^\s*([-*]|\d+\.)\s/.test(l)) cur.li++;
    else if (l.trim()) cur.para++;
  }
  sections.push(cur);
  return sections.filter((s, i) => i > 0 || s.h + s.li + s.row + s.fence + s.para > 0);
}

// ---- residual per pair ----
function residual(p) {
  if (p.kind === "identical") return lineDiff(read(p.a).split(/\r?\n/), read(p.b).split(/\r?\n/));
  if (p.kind === "mentions") {
    const A = mentions(rewrite(read(p.a))), B = mentions(read(p.b));
    return [...[...A].filter((t) => !B.has(t)).sort().map((t) => `only in claude: ${t}`), ...[...B].filter((t) => !A.has(t)).sort().map((t) => `only in opencode: ${t}`)];
  }
  if (p.kind === "structure") {
    // Sections are aligned by their counts (titles are in different languages): equal ones pair up, the rest pair in
    // order inside each run of differences; a section left over is missing on the other side or, when an equal one is
    // left over there, moved.
    const en = structure(read(p.a)), ko = structure(read(p.b));
    const key = (s) => COUNTS.map((c) => `${c}${s[c]}`).join(" ");
    const out = [], loneEn = [], loneKo = []; let del = [], add = [];
    const flush = () => {
      for (let k = 0; k < Math.max(del.length, add.length); k++) {
        if (k < del.length && k < add.length) out.push(`en "${del[k].title}" | ko "${add[k].title}": ${COUNTS.filter((c) => del[k][c] !== add[k][c]).map((c) => `${c} ${del[k][c]}→${add[k][c]}`).join(", ")}`);
        else if (k < del.length) loneEn.push(del[k]);
        else loneKo.push(add[k]);
      }
      del = []; add = [];
    };
    for (const op of lcs(en.map(key), ko.map(key))) {
      if (op[0] === "=") flush();
      else if (op[0] === "-") del.push(en[op[1]]);
      else add.push(ko[op[1]]);
    }
    flush();
    for (const e of loneEn) {
      const i = loneKo.findIndex((k) => key(k) === key(e));
      if (i >= 0) { out.push(`en "${e.title}" and ko "${loneKo[i].title}" are in a different order`); loneKo.splice(i, 1); }
      else out.push(`en "${e.title}" has no ko section`);
    }
    for (const k of loneKo) out.push(`ko "${k.title}" has no en section`);
    return out;
  }
  const A = normalizeClaude(read(p.a)), B = normalizeOpencode(read(p.b));
  const out = [];
  for (const k of Object.keys(A.fm)) {
    if (FM_SKIP.has(k) || !(k in B.fm) || A.fm[k] === B.fm[k]) continue;
    out.push(`${k}: ${wordDiff(A.fm[k], B.fm[k])}`);
  }
  return out.concat(lineDiff(A.body, B.body));
}

// ---- baseline ----
function parseBaseline(text) {
  const sections = new Map();
  let cur = null;
  for (const l of text.split(/\r?\n/)) {
    if (l.startsWith("#") || !l.trim()) continue;
    if (l.startsWith("  ")) { if (cur) cur.push(l.slice(2)); }
    else { cur = []; sections.set(l.replace(/ \(identical\)$/, ""), cur); }
  }
  return sections;
}
function renderBaseline(results) {
  const out = [
    "# GARAGISTE parity baseline — the accepted divergence between the claude and opencode flavors, after normalization",
    "# (scripts/parity-check.mjs rewrites the claude side into opencode vocabulary first). Written by",
    "# `node scripts/parity-check.mjs --update`; do not edit by hand. A `git diff` of this file shows which divergent",
    "# lines a change touched. Content lines are word-diffs, claude [-removed-] and opencode {+added+}; structure lines",
    "# compare a doc with its .ko.md translation per section; coverage lists files with no counterpart.",
    "",
  ];
  for (const r of results) {
    out.push(r.lines.length ? r.name : `${r.name} (identical)`);
    for (const l of r.lines) out.push(`  ${l}`);
    out.push("");
  }
  return out.join("\n");
}
function bag(lines) { const m = new Map(); for (const l of lines) m.set(l, (m.get(l) ?? 0) + 1); return m; }
function compare(now, before) {
  // Order-insensitive: what is divergent now but was not, and what was divergent but no longer is.
  const a = bag(now), b = bag(before);
  const added = [], removed = [];
  for (const [l, n] of a) for (let k = (b.get(l) ?? 0); k < n; k++) added.push(l);
  for (const [l, n] of b) for (let k = (a.get(l) ?? 0); k < n; k++) removed.push(l);
  return { added, removed };
}

// ---- run ----
const results = [{ name: "coverage", lines: coverage }, ...pairs.map((p) => ({ name: p.name, lines: residual(p) }))]
  .filter((r) => !opt.pair || r.name.includes(opt.pair));

if (opt.update) {
  if (opt.pair) { console.error("--update rewrites the whole baseline; drop --pair"); process.exit(2); }
  writeFileSync(join(ROOT, BASELINE), renderBaseline(results));
  const divergent = results.filter((r) => r.lines.length).length;
  console.log(`→ ${BASELINE} written: ${results.length} entries, ${divergent} with an accepted divergence (${results.reduce((n, r) => n + r.lines.length, 0)} lines)`);
  process.exit(0);
}

const baseline = has(BASELINE) ? parseBaseline(read(BASELINE)) : null;
if (!baseline) console.log(`no ${BASELINE} yet — showing every pair's divergence; run --update to accept it`);
let changed = 0;
for (const r of results) {
  const before = baseline?.get(r.name);
  const { added, removed } = baseline ? compare(r.lines, before ?? []) : { added: r.lines, removed: [] };
  const drift = added.length + removed.length > 0 || (baseline && !before);
  if (drift) changed++;
  if (!drift && !opt.all) continue;
  const state = drift ? (before ? `divergence changed (+${added.length} / -${removed.length})` : "new pair, not in the baseline") : !r.lines.length ? "identical" : `accepted divergence (${r.lines.length} lines)`;
  console.log(`${drift ? "✗" : "✓"} ${r.name} — ${state}`);
  if (opt.all && !drift) for (const l of r.lines) console.log(`    ${l}`);
  for (const l of added) console.log(`  + ${l}`);
  for (const l of removed) console.log(`  - ${l}`);
}
if (baseline) for (const name of baseline.keys()) if (!results.some((r) => r.name === name) && (!opt.pair || name.includes(opt.pair))) { changed++; console.log(`✗ ${name} — in the baseline but no longer paired`); }
const identical = results.filter((r) => !r.lines.length).length;
console.log(`${results.length} entries: ${identical} identical, ${results.length - identical} with a divergence, ${changed} changed${changed ? " — check both flavors say the same thing, then run --update" : ""}`);
process.exit(changed || !baseline ? 1 : 0);
