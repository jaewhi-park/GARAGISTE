#!/usr/bin/env node
// Creates a new team agent from a permission preset and a role prompt written by team-planner. Used by /recruit after CEO approval.
// Usage: node new-agent.mjs --flavor opencode|claude --dest <agents dir> --name team-<slug> --preset researcher|author|engineer|judge
//         --description "<one line>" --body <docs/roles/team-<slug>.md>
//         [--like team-<role>]            copy the model (and effort) line from that agent: the sibling of the same kind
//         [--model <id>[:<effort>]]       explicit model instead of --like
//         [--force]                       overwrite an existing agent file
// Writes only <dest>/<name>.md. claude flavor: also adds the name to team-lead's Agent(...) tool list so the lead may delegate to it.
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const args = process.argv.slice(2);
const opt = {};
for (let i = 0; i < args.length; i++) {
  const a = args[i];
  if (a === "--force") opt.force = true;
  else if (a.startsWith("--")) opt[a.slice(2)] = args[++i];
}
const { flavor, dest, name, preset, description, body } = opt;
function die(msg) { console.error(msg); process.exit(1); }
if (!flavor || !dest || !name || !preset || !description || !body) die("usage: --flavor opencode|claude --dest <dir> --name team-<slug> --preset researcher|author|engineer|judge --description <text> --body <file> [--like team-<role> | --model <id>[:<effort>]] [--force]");
if (!/^team-[a-z0-9]+(-[a-z0-9]+)*$/.test(name)) die(`name must look like team-<slug> (lowercase, digits, hyphens): ${name}`);
if (!["opencode", "claude"].includes(flavor)) die("flavor must be opencode or claude");
if (!existsSync(body)) die(`body file not found: ${body}`);

// ---- presets: a distinct permission boundary is the only reason a role exists as an agent rather than a skill ----
const READ_ONLY_BASH = ['"*": deny', '"git status*": allow', '"git log*": allow', '"git diff*": allow', '"git show*": allow', '"git ls-files*": allow', '"ls *": allow', '"cat *": allow', '"grep *": allow', '"rg *": allow', '"find *": allow'];
const indent = (lines) => lines.map((l) => "  " + l);
const OPENCODE = {
  researcher: { temperature: 0.2, steps: 40, color: "info", perm: ["edit: deny", "question: deny", "external_directory: deny", "bash:", ...indent(READ_ONLY_BASH), "task:", '  "*": deny', '  "explore": allow'] },
  author: { temperature: 0.3, steps: 60, color: "info", perm: ["edit:", '  "*": deny', '  "docs/*": allow', "question: deny", "external_directory: deny", "bash:", '  "*": deny', '  "git log*": allow', '  "git diff*": allow', "task:", '  "*": deny', '  "explore": allow'] },
  engineer: { temperature: 0.1, steps: 100, color: "success", perm: ["edit: allow", "bash: allow", "question: deny", "external_directory: deny", "todowrite: allow", "task:", '  "*": deny', '  "explore": allow'] },
  judge: { temperature: 0.1, steps: 30, color: "accent", perm: ["edit: deny", "question: deny", "external_directory: deny", "bash:", ...indent(READ_ONLY_BASH), "task:", '  "*": deny', '  "explore": allow'] },
};
const CLAUDE = {
  researcher: { tools: "Read, Grep, Glob, Bash, WebSearch, WebFetch", maxTurns: 40, color: "cyan" },
  author: { tools: "Read, Grep, Glob, Edit, Write, Bash", maxTurns: 60, color: "cyan" },
  engineer: { tools: "Read, Grep, Glob, Edit, Write, Bash, TodoWrite", maxTurns: 100, color: "green" },
  judge: { tools: "Read, Grep, Glob, Bash", maxTurns: 30, color: "purple" },
};
const RULES = {
  researcher: ["You never edit files and never run commands that change state. Report facts with file paths and line numbers; conclusions only, no long quotes."],
  author: ["You edit only under docs/. You never edit code. Leave undecided items marked as undecided; never fill gaps with guesses."],
  engineer: ["Small diffs (a step targets the operating profile's step-size target, default 300 changed lines of logic; state the reason if larger, never beyond 2x), tests first per the step's proves lines (red on an assertion, then green), run the quick verification from the rules file before reporting, commit with a clear message. Never force push, never push to main, never weaken or skip tests."],
  judge: ["You never edit and never fix. Judge only what you were given. The last line of your report is exactly one verdict: PASS / FAIL, or APPROVE / REQUEST_CHANGES, whichever the lead asked for. Findings above it in severity order with file:line."],
};
if (!OPENCODE[preset]) die("preset must be one of researcher|author|engineer|judge");

// ---- model: explicit, or copied from the sibling role ----
let model = null, effort = null;
if (opt.model) { const m = flavor !== "claude" ? [null, opt.model] : /^([^:]+)(?::(\w+))?$/.exec(opt.model); model = m[1]; effort = m[2] ?? null; }
else if (opt.like) {
  const f = join(dest, opt.like.endsWith(".md") ? opt.like : `${opt.like}.md`);
  if (!existsSync(f)) die(`--like agent not found: ${f}`);
  const fm = /^---\r?\n([\s\S]*?)\r?\n---/.exec(readFileSync(f, "utf8"))?.[1] ?? "";
  model = /^model:\s*(.+)$/m.exec(fm)?.[1]?.trim() ?? null;
  effort = /^effort:\s*(.+)$/m.exec(fm)?.[1]?.trim() ?? null;
}

const rulesFile = flavor === "claude" ? "CLAUDE.md" : "AGENTS.md";
const language = `Write reports and documents in the language given under "## Language" in ${rulesFile} (or the CEO's language if absent).`;
const prompt = readFileSync(body, "utf8").replace(/\r\n/g, "\n").trim();

let front;
if (flavor === "opencode") {
  const p = OPENCODE[preset];
  front = [`description: ${JSON.stringify(description)}`, "mode: subagent", `temperature: ${p.temperature}`, `steps: ${p.steps}`, `color: ${p.color}`];
  if (model) front.push(`model: ${model}`);
  front.push("permission:", ...indent(p.perm));
} else {
  const p = CLAUDE[preset];
  front = [`name: ${name}`, `description: ${JSON.stringify(description)}`, `tools: ${p.tools}`, `maxTurns: ${p.maxTurns}`, `color: ${p.color}`];
  if (model) front.push(`model: ${model}`);
  if (effort) front.push(`effort: ${effort}`);
}
const out = `---\n${front.join("\n")}\n---\n${prompt}\n${language}\n\n## Rules (${preset} preset)\n${RULES[preset].map((r) => "- " + r).join("\n")}\n`;

const target = join(dest, `${name}.md`);
if (existsSync(target) && !opt.force) die(`${target} exists; pass --force to overwrite`);
writeFileSync(target, out);

let leadNote = "";
if (flavor === "claude") {
  const lead = join(dest, "team-lead.md");
  if (existsSync(lead)) {
    const src = readFileSync(lead, "utf8");
    const m = /^(tools:.*Agent\()([^)]*)(\).*)$/m.exec(src);
    if (m && !m[2].split(",").map((s) => s.trim()).includes(name)) {
      writeFileSync(lead, src.replace(m[0], `${m[1]}${m[2]}, ${name}${m[3]}`));
      leadNote = " · added to team-lead's Agent(...) list";
    }
  }
}
console.log(`→ ${target} created (preset ${preset}, model ${model ?? "inherited"}${effort ? ":" + effort : ""})${leadNote}`);
console.log("  Loads from the next session. /roster lists it; /hire re-assigns its model like any other role.");
