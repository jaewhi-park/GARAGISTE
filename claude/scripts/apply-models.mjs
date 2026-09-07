#!/usr/bin/env node
// Writes per-agent model/effort into frontmatter according to a budget profile. Idempotent.
// Usage: node apply-models.mjs --flavor opencode|claude --dest <agents dir> --budget inherit|unlimited|high|medium|low
//         [--strong provider/model] [--fast provider/model]   (opencode: actual models for the profile's strong/fast slots)
//         [--set <agent>=<model>[:<effort>]]...                (per-agent override, repeatable)
//         [--settings <path>] [--session <model>]              (claude: session model in settings.json; defaults to the team-lead override or the profile value)
import { readFileSync, writeFileSync, readdirSync, existsSync } from "node:fs";
import { join, basename } from "node:path";

const args = process.argv.slice(2);
const opt = { set: [] };
for (let i = 0; i < args.length; i++) {
  const a = args[i];
  if (a === "--set") opt.set.push(args[++i]);
  else if (a.startsWith("--")) opt[a.slice(2)] = args[++i];
}
const flavor = opt.flavor, dest = opt.dest, budget = opt.budget ?? "inherit";
if (!flavor || !dest) { console.error("usage: --flavor opencode|claude --dest <dir> --budget <tier>"); process.exit(1); }

// ---- profiles ----
// claude: aliases (opus/sonnet/haiku) resolve to the plan's latest models; effort is reasoning intensity.
const CLAUDE = {
  unlimited: { lead: ["opus", "high"], planner: ["opus", "high"], critic: ["opus", "high"], implementer: ["opus", "medium"], builder: ["opus", "medium"], reviewer: ["opus", "high"], verifier: ["haiku", "low"], session: "opus" },
  high:      { lead: ["opus", "high"], planner: ["opus", "high"], critic: ["opus", "high"], implementer: ["opus", "medium"], builder: ["opus", "medium"], reviewer: ["opus", "medium"], verifier: ["haiku", "low"], session: "opus" },
  medium:    { lead: ["opus", "medium"], planner: ["opus", "medium"], critic: ["sonnet", "high"], implementer: ["sonnet", "medium"], builder: ["sonnet", "medium"], reviewer: ["sonnet", "high"], verifier: ["haiku", "low"], session: "opus" },
  low:       { lead: ["sonnet", "medium"], planner: ["sonnet", "high"], critic: ["sonnet", "medium"], implementer: ["sonnet", "medium"], builder: ["sonnet", "medium"], reviewer: ["sonnet", "medium"], verifier: ["haiku", "low"], session: "sonnet" },
};
// opencode: the strong/fast slots take the actual model IDs given with --strong/--fast.
const OPENCODE = {
  unlimited: { lead: "strong", planner: "strong", critic: "strong", implementer: "strong", reviewer: "strong", verifier: "fast" },
  high:      { lead: "strong", planner: "strong", critic: "strong", implementer: "strong", reviewer: "strong", verifier: "fast" },
  medium:    { lead: "strong", planner: "strong", critic: "strong", implementer: "fast",   reviewer: "strong", verifier: "fast" },
  low:       { lead: "fast",   planner: "strong", critic: "strong", implementer: "fast",   reviewer: "fast",   verifier: "fast" },
};

const overrides = {};
for (const s of opt.set) { const m = /^([\w-]+)=([^:]+)(?::(\w+))?$/.exec(s); if (!m) { console.error("bad --set:", s); process.exit(1); } overrides[m[1].replace(/^team-/, "")] = [m[2], m[3]]; }

function resolve(role) {
  if (overrides[role]) return overrides[role];
  if (budget === "inherit") return [null, null];
  if (flavor === "claude") { const p = CLAUDE[budget]; if (!p) bad(); return p[role]; } // undefined: not in the profile (recruited role) → kept as is
  const p = OPENCODE[budget]; if (!p) bad();
  const slot = p[role]; if (!slot) return undefined;
  const id = slot === "strong" ? opt.strong : opt.fast;
  if (!id) { console.error(`--budget ${budget} requires --strong and --fast model IDs (run: opencode models).`); process.exit(1); }
  return [id, null];
}
function bad() { console.error("budget must be one of inherit|unlimited|high|medium|low"); process.exit(1); }

function rewrite(file, model, effort) {
  const src = readFileSync(file, "utf8");
  const m = /^---\n([\s\S]*?)\n---\n/.exec(src);
  if (!m) return null;
  let lines = m[1].split("\n").filter((l) => !/^(model|effort):/.test(l));
  if (model) lines.push(`model: ${model}`);
  if (effort && flavor === "claude") lines.push(`effort: ${effort}`);
  writeFileSync(file, `---\n${lines.join("\n")}\n---\n` + src.slice(m[0].length));
  return [model ?? "(inherit)", effort ?? ""];
}

const rows = [];
for (const f of readdirSync(dest).filter((n) => n.startsWith("team-") && n.endsWith(".md"))) {
  const role = basename(f, ".md").replace(/^team-/, "");
  const resolved = resolve(role);
  if (!resolved) { rows.push([basename(f, ".md"), "(kept: not in profile)", ""]); continue; }
  const [model, effort] = resolved;
  const r = rewrite(join(dest, f), model, effort);
  if (r) rows.push([basename(f, ".md"), ...r]);
}
if (flavor === "claude" && opt.settings && existsSync(opt.settings)) {
  const s = JSON.parse(readFileSync(opt.settings, "utf8"));
  const sess = opt.session ?? (overrides.lead ? overrides.lead[0] : (budget === "inherit" ? null : CLAUDE[budget].session));
  if (sess) s.model = sess; else delete s.model;
  writeFileSync(opt.settings, JSON.stringify(s, null, 2) + "\n");
  rows.push(["(session / lead)", sess ?? "(inherit)", ""]);
}
console.log(`→ Budget profile: ${budget}`);
for (const [a, m, e] of rows) console.log(`   ${a.padEnd(18)} ${m.padEnd(28)} ${e}`);
