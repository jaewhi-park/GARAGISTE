#!/usr/bin/env node
// Regression matrix for the guardrails of both flavors (a maintainer tool; the installers never copy it).
// Every case goes to claude/.claude/hooks/guardrails.mjs as a PreToolUse call (agent_type, tool_name, tool_input, cwd)
// and to opencode/plugins/guardrails.ts as a tool.execute.before call; the verdict is compared with the expected one.
// GENERIC cases hold for every role in both flavors (destructive commands, secret files, publishing, the push policy,
// gh api mutations); ROLE cases exercise the Claude Code hook's role boundaries (in opencode those live in the agents'
// permission blocks, which this script cannot run); WITH_RULES cases run in a throwaway directory whose CLAUDE.md lists
// commands (the verifier may run what "## Commands" lists); ON_BRANCH cases need a checkout, so two throwaway
// repositories — one on main, one on plan/x — are created under the temp directory and removed afterwards.
// Usage: node scripts/hook-check.mjs [--flavor claude|opencode] [--all]
//        --all prints every case with its verdict, not only the mismatches. Exit 1 when any verdict differs.
// The opencode plugin is TypeScript: Node 23.6+ strips types by itself; on Node 22.6–23.5 add --experimental-strip-types.
import { execFileSync, spawnSync } from "node:child_process";
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const HOOK = join(ROOT, "claude/.claude/hooks/guardrails.mjs");
const PLUGIN = join(ROOT, "opencode/plugins/guardrails.ts");

const argv = process.argv.slice(2);
const opt = { flavor: "", all: false };
for (let i = 0; i < argv.length; i++) {
  const a = argv[i];
  if (a === "--all") opt.all = true;
  else if (a === "--flavor") { opt.flavor = argv[++i] ?? ""; if (!["claude", "opencode"].includes(opt.flavor)) usage(); }
  else if (a === "-h" || a === "--help") { console.log(readFileSync(new URL(import.meta.url), "utf8").split("\n").slice(1, 11).join("\n").replace(/^\/\/ ?/gm, "")); process.exit(0); }
  else usage();
}
function usage() { console.error("Usage: node scripts/hook-check.mjs [--flavor claude|opencode] [--all]"); process.exit(2); }

const A = "allow", B = "block";
// ---- generic rules, both flavors: [tool, args, expected, only?] in opencode shape (bash/read/edit/write/grep,
// filePath/include); the claude side maps the names and runs them as team-implementer, the role with generic rules only.
const bash = (command, exp, only) => ["bash", { command }, exp, only];
const GENERIC = [
  // push policy: feature-branch pushes and PRs allowed; force, mirror, all, delete and anything aimed at main blocked
  bash("git push -u origin plan/foo", A), bash("git push origin plan/x:plan/x", A), bash("gh pr create --title x --body-file b.md", A), bash("gh pr merge --auto --squash", A),
  bash("git add docs/x.md && git commit -m x", A), bash("npm test", A),
  bash("git push --force origin plan/x", B), bash("git push origin main", B), bash("git push origin \"main\"", B), bash("git push origin main; echo done", B),
  bash("git push origin HEAD:main", B), bash("git push origin +plan/x", B), bash("git push --mirror origin", B), bash("git push origin --all", B),
  bash("git push origin --delete feat/x", B), bash("git push origin refs/heads/main", B), bash("git -c x=y push origin main", B), bash("git push origin plan/x:main", B),
  bash("git push origin master", B), bash("git push -f origin plan/x", B),
  // gh api: reads only
  bash("gh api -X PUT repos/o/r/pulls/1/merge", B), bash("gh api repos/o/r/pulls -f title=x", B), bash("gh api repos/o/r/branches/main/protection", A), bash("gh api -X GET repos/o/r", A),
  // publishing is the CEO's
  bash("npm publish", B), bash("pnpm publish --access public", B), bash("cargo publish", B), bash("gem push x.gem", B), bash("twine upload dist/*", B), bash("docker push img:1", B),
  bash("npm pack", A), bash("cargo build", A), bash("docker build -t img .", A),
  // secret files named next to a program that prints or evaluates files
  bash("cat .env", B), bash("cat <.env", B), bash("cat < .env", B), bash("sudo cat .env", B), bash("cat .env*", B), bash("/bin/cat .env", B), bash("bash -c \"cat .env\"", B),
  bash("ls .env | xargs cat", B), bash("find . -name .env -exec cat {} \\;", B), bash("git show HEAD:.env", B),
  bash("node -e \"console.log(require('fs').readFileSync('.env','utf8'))\"", B), bash("python -c \"print(open('.env').read())\"", B),
  bash("tac .env", B), bash("sort .env", B), bash("openssl rsa -in server.key -text", B), bash("cat ~/.aws/credentials", B), bash("cat .envrc", B), bash("cat ~/.ssh/id_ecdsa", B),
  bash("head -c 100 .env.local", B), bash("grep KEY .env", B), bash("Get-Content .env", B), bash("echo $(cat .env)", B), bash("cat secrets/prod.pem", B), bash("cat .npmrc", B),
  bash("cp .env ../repo-x/.env", A), bash("cat .env.example", A), bash("git commit -m \"add cat\"", A), bash("cat README.md", A), bash("echo $ENV_NAME", A), bash("source .env", A),
  bash("ls -la", A), bash("cat package.json", A), bash("npm run build:keycloak", A),
  ["read", { filePath: "C:/repo/.env" }, B], ["read", { filePath: "C:/repo/.envrc" }, B], ["read", { filePath: "C:/repo/.env.example" }, A],
  ["read", { filePath: "C:/Users/x/.aws/credentials" }, B], ["read", { filePath: "C:/repo/certs/server.pem" }, B], ["edit", { filePath: "C:/repo/certs/server.pem" }, B], ["read", { filePath: "C:/repo/src/env.ts" }, A],
  ["grep", { pattern: ".", path: "C:/repo/.env" }, B], ["grep", { pattern: "x", path: "C:/repo/src", include: "*.pem" }, B], ["grep", { pattern: "x", path: "C:/repo/src" }, A],
  ["powershell", { command: "Get-Content .env" }, B, "claude"], ["powershell", { command: "Get-ChildItem" }, A, "claude"],
  // destructive: history rewrites, root-like recursive deletes, forced branch deletion; ordinary cleanup stays allowed
  bash("git checkout -- ./", B), bash("git checkout -- \".\"", B), bash("git restore :/", B), bash("rm -rf ./", B), bash("rm -rf ./*", B), bash("rm -rf .git", B),
  bash("rm -rf \"$PWD\"", B), bash("rd /s /q C:\\", B), bash("git stash drop", B), bash("git branch -D x", B),
  bash("rm -rf build", A), bash("rm -rf node_modules", A), bash("git checkout -- src/app.ts", A), bash("git stash list", A), bash("rm -rf ./build", A), bash("git branch -d x", A),
  bash("git switch -c integrate/2026-09-12", A),
];
// ---- role rules, Claude Code hook only: [role, tool, args, expected] in claude shape (Bash/Edit/Write/Read, file_path).
const rb = (role, command, exp) => [role, "Bash", { command }, exp];
const ROLES = [
  // team-lead: read-only commands, git branch/merge/sync, docs-only add/rm/commit, pushes, gh PR commands, the scripts; no code runs, no shell writes
  rb("team-lead", "git status --porcelain docs/plans/0001-x.md", A), rb("team-lead", "git log --format=%s%n%b main..HEAD", A),
  rb("team-lead", "git switch -c plan/foo", A), rb("team-lead", "git switch -c integrate/2026-09-12", A), rb("team-lead", "git switch main", A),
  rb("team-lead", "git merge --no-ff plan/foo", A), rb("team-lead", "git merge --ff-only origin/main", A), rb("team-lead", "git rebase origin/main", A), rb("team-lead", "git rebase --abort", A),
  rb("team-lead", "git branch -d plan/foo", A), rb("team-lead", "git branch -r --list 'origin/plan/*' 'origin/integrate/*'", A), rb("team-lead", "git branch --show-current", A),
  rb("team-lead", "git fetch origin", A), rb("team-lead", "git remote", A), rb("team-lead", "git worktree list", A), rb("team-lead", "git worktree remove --force ../repo-x", A),
  rb("team-lead", "git revert --no-edit -m 1 abc123", A), rb("team-lead", "git revert --no-edit abc123..HEAD", A), rb("team-lead", "git tag -a v1.0.0 -m x", A),
  rb("team-lead", "git rev-parse --abbrev-ref HEAD", A), rb("team-lead", "git log -1 --format=%H", A), rb("team-lead", "git diff --stat main..HEAD", A),
  rb("team-lead", "gh pr view plan/foo --json state -q .state", A), rb("team-lead", "gh repo view --json autoMergeAllowed -q .autoMergeAllowed", A),
  rb("team-lead", "gh api repos/o/r/branches/main/protection", A), rb("team-lead", "gh pr list --state merged --head plan/x --json number", A),
  rb("team-lead", "node .claude/scripts/set-language.mjs --file CLAUDE.md ko", A), rb("team-lead", "node \"C:/Users/x/.claude/scripts/apply-models.mjs\" --flavor claude --dest .claude/agents", A),
  rb("team-lead", "node .claude/scripts/new-agent.mjs --flavor claude --name team-x", A), rb("team-lead", "node .claude/scripts/set-profile.mjs --file CLAUDE.md \"budget tier: low\"", A),
  rb("team-lead", "ls docs/specs", A), rb("team-lead", "cat docs/STATUS.md", A), rb("team-lead", "cd ../x && git status", A), rb("team-lead", "FOO=1 git status", A),
  rb("team-lead", "find docs -name '*.md' | wc -l", A), rb("team-lead", "node --version", A), rb("team-lead", "npm ls --depth=0", A), rb("team-lead", "jq .name package.json", A), rb("team-lead", "git config --get remote.origin.url", A),
  rb("team-lead", "git switch main && git merge --no-ff integrate/2026-09-12 && git branch -d integrate/2026-09-12", A),
  // docs-only commits and pushes are the lead's; code commits are not
  rb("team-lead", "git add docs/plans/0001-x.md docs/BACKLOG.md && git commit -m \"docs(plan): 0001-x\"", A), rb("team-lead", "git add CLAUDE.md .claude/agents/team-lead.md .gitignore", A),
  rb("team-lead", "git add docs/ && git commit -m 'docs(kickoff): charter, stack ADR, backlog, plan 0001'", A), rb("team-lead", "git commit -m \"docs(ship): x && y; z\"", A), rb("team-lead", "git commit -m x -- docs/METRICS.md", A),
  rb("team-lead", "git rm --cached docs/STATUS.md", A), rb("team-lead", "git add -f docs/STATUS.md", A), rb("team-lead", "git push -u origin plan/x", A), rb("team-lead", "git push", A),
  rb("team-lead", "gh pr merge 1 --squash", A), rb("team-lead", "gh pr merge --auto --squash", A), rb("team-lead", "gh pr create --title x --body-file b.md", A), rb("team-lead", "gh pr checks 1", A),
  rb("team-lead", "git add .", B), rb("team-lead", "git add -A", B), rb("team-lead", "git add src/app.ts", B), rb("team-lead", "git add docs/x.md src/app.ts", B), rb("team-lead", "git add -u", B),
  rb("team-lead", "git commit -am x", B), rb("team-lead", "git commit -a -m x", B), rb("team-lead", "git commit --amend --no-edit", B), rb("team-lead", "git commit -m x src/app.ts", B), rb("team-lead", "git commit -m x -- src/app.ts", B),
  rb("team-lead", "git rm src/x.ts", B), rb("team-lead", "git push --force origin plan/x", B), rb("team-lead", "git push origin main", B),
  rb("team-lead", "echo hi > src/app.js", B), rb("team-lead", "sed -i 's/a/b/' src/app.js", B), rb("team-lead", "mkdir -p docs/specs", B), rb("team-lead", "cp a.md docs/b.md", B), rb("team-lead", "touch docs/x.md", B),
  rb("team-lead", "gh api -X PUT repos/o/r/pulls/1/merge", B), rb("team-lead", "gh api repos/o/r/pulls -f title=x", B), rb("team-lead", "git cherry-pick abc", B), rb("team-lead", "git reset --soft HEAD~1", B),
  rb("team-lead", "git stash", B), rb("team-lead", "git checkout src/app.ts", B), rb("team-lead", "git config user.name x", B),
  rb("team-lead", "npm test", B), rb("team-lead", "npm install", B), rb("team-lead", "node -e \"1\"", B), rb("team-lead", "node x.js", B), rb("team-lead", "python x.py", B), rb("team-lead", "bash scripts/x.sh", B),
  rb("team-lead", "git log | tee out.txt", B), rb("team-lead", "cat docs/STATUS.md > /tmp/x", B), rb("team-lead", "git branch -D plan/x", B), rb("team-lead", "sudo ls", B), rb("team-lead", "ls | xargs rm", B),
  ["team-lead", "Edit", { file_path: "C:/repo/docs/STATUS.md" }, A], ["team-lead", "Write", { file_path: "C:/repo/docs/BRIEF.md" }, B], ["team-lead", "Edit", { file_path: "C:/repo/src/a.ts" }, B],
  // team-planner: documents only, read-only shell (listings and version checks included), no code runs
  rb("team-planner", "git log -5", A), rb("team-planner", "git diff main..HEAD", A), rb("team-planner", "git show abc", A), rb("team-planner", "git status", A),
  rb("team-planner", "ls docs", A), rb("team-planner", "find . -name '*.test.ts' | head", A), rb("team-planner", "cat package.json", A), rb("team-planner", "wc -l docs/SPEC.md", A), rb("team-planner", "tree -L 2 src", A),
  rb("team-planner", "node --version", A), rb("team-planner", "npm ls --depth=0", A), rb("team-planner", "pip list", A), rb("team-planner", "go list ./...", A), rb("team-planner", "git branch -a", A), rb("team-planner", "git tag -l", A), rb("team-planner", "git remote -v", A),
  rb("team-planner", "rm -rf src", B), rb("team-planner", "npm install left-pad", B), rb("team-planner", "npm test", B), rb("team-planner", "node x.js", B), rb("team-planner", "python -m pytest", B),
  rb("team-planner", "git add docs/x.md", B), rb("team-planner", "git commit -m x", B), rb("team-planner", "git switch -c x", B), rb("team-planner", "git stash", B), rb("team-planner", "git fetch", B),
  rb("team-planner", "echo x > docs/x.md", B), rb("team-planner", "mkdir docs/adr", B), rb("team-planner", "git branch x", B), rb("team-planner", "git tag v1", B), rb("team-planner", "git remote add o x", B),
  ["team-planner", "Edit", { file_path: "C:/repo/docs/plans/0001.md" }, A], ["team-planner", "Edit", { file_path: "C:/repo/CLAUDE.md" }, A], ["team-planner", "Write", { file_path: "docs/specs/0001-x.md" }, A],
  ["team-planner", "Edit", { file_path: "C:/repo/src/app.ts" }, B], ["team-planner", "Write", { file_path: "C:/repo/package.json" }, B], ["team-planner", "Read", { file_path: "C:/repo/src/app.ts" }, A],
  // Explore: the same read-only boundary
  rb("Explore", "ls src", A), rb("Explore", "git log --oneline -20", A), rb("Explore", "npm ls", A), rb("Explore", "rm -rf src", B), rb("Explore", "git commit -m x", B), rb("Explore", "npm test", B), rb("Explore", "echo x > y", B),
  // team-reviewer: read-only shell plus the toolchain (it may run the tests); never edits or commits
  rb("team-reviewer", "git diff main...HEAD", A), rb("team-reviewer", "git show HEAD", A), rb("team-reviewer", "git log --oneline main..HEAD", A), rb("team-reviewer", "git diff -w --color-moved abc", A),
  rb("team-reviewer", "npm test", A), rb("team-reviewer", "npx vitest run src/x.test.ts", A), rb("team-reviewer", "pytest tests/test_x.py", A), rb("team-reviewer", "node -e \"console.log(1)\"", A), rb("team-reviewer", "cat src/app.ts", A),
  rb("team-reviewer", "rm -rf src", B), rb("team-reviewer", "git checkout -- .", B), rb("team-reviewer", "git checkout src/app.ts", B), rb("team-reviewer", "git add src/x.ts", B), rb("team-reviewer", "git commit -m x", B),
  rb("team-reviewer", "git stash", B), rb("team-reviewer", "git switch main", B), rb("team-reviewer", "echo x > src/app.ts", B), rb("team-reviewer", "sed -i 's/a/b/' src/app.ts", B), rb("team-reviewer", "mv a b", B),
  // team-builder: commits in its worktree and may push its branch; never merges, rebases, pulls or touches worktrees
  rb("team-builder", "git add src/x.ts && git commit -m \"step 1\"", A), rb("team-builder", "npm test", A), rb("team-builder", "git status", A), rb("team-builder", "git push -u origin plan/foo", A),
  rb("team-builder", "git push --force origin plan/foo", B), rb("team-builder", "git push origin main", B),
  rb("team-builder", "git merge main", B), rb("team-builder", "git rebase main", B), rb("team-builder", "git worktree remove .", B), rb("team-builder", "git pull", B),
  // team-verifier: build/test/lint tools and read-only git only (what CLAUDE.md lists is added below, WITH_RULES)
  rb("team-verifier", "npm test", A), rb("team-verifier", "git status --porcelain", A), rb("team-verifier", "git diff --stat", A), rb("team-verifier", "cd packages/a && npm test", A), rb("team-verifier", "npm test | tail -20", A),
  rb("team-verifier", "npx vitest run", A), rb("team-verifier", "vitest run", A), rb("team-verifier", "tsc --noEmit", A), rb("team-verifier", "eslint .", A), rb("team-verifier", "cargo test", A), rb("team-verifier", "cat test-output.txt", A),
  rb("team-verifier", "rm -rf build", B), rb("team-verifier", "node -e 1", B), rb("team-verifier", "git push", B), rb("team-verifier", "bash scripts/test.sh", B), rb("team-verifier", "docker compose up -d", B), rb("team-verifier", "curl localhost:3000", B),
];
// ---- cases that read the rules file: run in a directory whose CLAUDE.md lists commands: [role, command, expected], Claude Code hook only.
const RULES_FILE = `# demo
## Commands
- setup: npm ci
- quick verification (under one minute — relevant tests, lint, typecheck): npm test && npm run lint
- full verification: bash scripts/test.sh && docker compose up -d && curl -f localhost:3000/health
- run one test file: npx vitest run <file>
- parity harness (legacy): python tools/parity.py --all — unverified
- build/run: \`npm run dev\`
\`\`\`
make -C tools smoke
\`\`\`
## Risk paths
- migrations/**
`;
const WITH_RULES = [
  rb("team-verifier", "bash scripts/test.sh", A), rb("team-verifier", "docker compose up -d", A), rb("team-verifier", "curl -f localhost:3000/health", A), rb("team-verifier", "python tools/parity.py --all", A),
  rb("team-verifier", "make -C tools smoke", A), rb("team-verifier", "npm run dev", A), rb("team-verifier", "bash scripts/test.sh --ci && npm test", A), rb("team-verifier", "npm ci", A),
  rb("team-verifier", "bash scripts/other.sh", B), rb("team-verifier", "docker compose down -v", B), rb("team-verifier", "curl -X POST localhost:3000/reset", B), rb("team-verifier", "python tools/other.py", B),
  rb("team-verifier", "node -e 1", B), rb("team-verifier", "rm -rf build", B),
  rb("team-lead", "bash scripts/test.sh", B), rb("team-planner", "bash scripts/test.sh", B),   // the listing widens the verifier only
];
// ---- pushes whose verdict depends on the checked-out branch: [command, expected on main, expected on plan/x], both flavors.
const ON_BRANCH = [["git push", B, A], ["git push origin HEAD", B, A], ["git push -u origin HEAD", B, A]];

// ---- runners ----
const TOOL_NAMES = { bash: "Bash", powershell: "PowerShell", read: "Read", edit: "Edit", write: "Write", grep: "Grep" };
function toClaude(tool, args) {
  const ti = { ...args };
  if ("filePath" in ti) { ti.file_path = ti.filePath; delete ti.filePath; }
  if ("include" in ti) { ti.glob = ti.include; delete ti.include; }
  return [TOOL_NAMES[tool], ti];
}
function runClaude(role, tool, input, cwd) {
  const r = spawnSync(process.execPath, [HOOK], { input: JSON.stringify({ agent_type: role, tool_name: tool, tool_input: input, cwd }), encoding: "utf8" });
  return r.status === 0 ? A : r.status === 2 ? B : `exit ${r.status}${r.stderr ? ` (${r.stderr.trim().slice(0, 80)})` : ""}`;
}
async function loadPlugin() {
  try { return (await import(pathToFileURL(PLUGIN).href)).Guardrails; }
  catch (e) { console.error(`cannot load ${PLUGIN}: ${e.message}\n(Node 23.6+ strips types by itself; on Node 22.6–23.5 run with --experimental-strip-types)`); process.exit(1); }
}
async function verdictOpencode(before, tool, args) {
  try { await before({ tool }, { args }); return A; }
  catch (e) { return /^\[guardrail\]/.test(e.message) ? B : `error: ${e.message}`; }
}
function label(role, tool, args) { return `${(role ?? "-").padEnd(16)} ${tool.padEnd(10)} ${args.command ?? args.filePath ?? args.file_path ?? args.path ?? JSON.stringify(args)}`; }

// ---- throwaway checkouts for the branch-dependent pushes ----
function makeRepos() {
  const base = mkdtempSync(join(tmpdir(), "hook-check-"));
  const rules = join(base, "rules"); mkdirSync(rules); writeFileSync(join(rules, "CLAUDE.md"), RULES_FILE);
  const git = (cwd, ...args) => execFileSync("git", ["-c", "user.name=hook-check", "-c", "user.email=hook-check@example.invalid", ...args], { cwd, stdio: ["ignore", "ignore", "pipe"] });
  try {
    const repos = {};
    for (const [name, branch] of [["main", "main"], ["branch", "plan/x"]]) {
      const dir = join(base, name);
      execFileSync("git", ["init", "-q", "-b", "main", dir], { stdio: ["ignore", "ignore", "pipe"] });
      git(dir, "commit", "-q", "--allow-empty", "-m", "init");
      if (branch !== "main") git(dir, "switch", "-q", "-c", branch);
      repos[name] = dir;
    }
    return { base, rules, ...repos };
  } catch (e) {
    rmSync(base, { recursive: true, force: true });
    return { error: String(e.stderr ?? e.message).trim() };
  }
}

// ---- run ----
const results = { claude: [], opencode: [] };   // { role, tool, args, expected, got, where? }
const record = (flavor, entry) => results[flavor].push(entry);
const repos = makeRepos();
if (repos.error) console.log(`ON_BRANCH cases skipped: could not create the throwaway repositories (${repos.error})`);
const neutral = repos.base ?? tmpdir();          // a directory that is not a git checkout: no branch, so pushes are judged by their arguments alone

if (opt.flavor !== "opencode") {
  for (const [tool, args, expected, only] of GENERIC) {
    if (only && only !== "claude") continue;
    const [name, input] = toClaude(tool, args);
    record("claude", { role: "team-implementer", tool: name, args: input, expected, got: runClaude("team-implementer", name, input, neutral) });
  }
  for (const [role, tool, args, expected] of ROLES) record("claude", { role, tool, args, expected, got: runClaude(role, tool, args, neutral) });
  if (!repos.error) for (const [role, tool, args, expected] of WITH_RULES) record("claude", { role, tool, args, expected, got: runClaude(role, tool, args, repos.rules), where: "with CLAUDE.md" });
  if (!repos.error) for (const [command, onMain, onBranch] of ON_BRANCH) {
    record("claude", { role: "team-implementer", tool: "Bash", args: { command }, expected: onMain, got: runClaude("team-implementer", "Bash", { command }, repos.main), where: "on main" });
    record("claude", { role: "team-implementer", tool: "Bash", args: { command }, expected: onBranch, got: runClaude("team-implementer", "Bash", { command }, repos.branch), where: "on plan/x" });
  }
  // fail closed: no input or unparsable input must block
  for (const [what, input] of [["empty stdin", ""], ["malformed JSON", "{not json"]]) {
    const r = spawnSync(process.execPath, [HOOK], { input, encoding: "utf8" });
    record("claude", { role: "-", tool: "-", args: { command: what }, expected: B, got: r.status === 2 ? B : `exit ${r.status}` });
  }
}
if (opt.flavor !== "claude") {
  const Guardrails = await loadPlugin();
  const before = async (dir) => (await Guardrails({ directory: dir }))["tool.execute.before"];
  const neutralHook = await before(neutral);
  for (const [tool, args, expected, only] of GENERIC) {
    if (only && only !== "opencode") continue;
    record("opencode", { role: "-", tool, args, expected, got: await verdictOpencode(neutralHook, tool, args) });
  }
  if (!repos.error) {
    const mainHook = await before(repos.main), branchHook = await before(repos.branch);
    for (const [command, onMain, onBranch] of ON_BRANCH) {
      record("opencode", { role: "-", tool: "bash", args: { command }, expected: onMain, got: await verdictOpencode(mainHook, "bash", { command }), where: "on main" });
      record("opencode", { role: "-", tool: "bash", args: { command }, expected: onBranch, got: await verdictOpencode(branchHook, "bash", { command }), where: "on plan/x" });
    }
  }
}
if (repos.base) rmSync(repos.base, { recursive: true, force: true });

let bad = 0;
const summary = [];
for (const flavor of ["claude", "opencode"]) {
  const rs = results[flavor];
  if (!rs.length) continue;
  for (const r of rs) {
    const ok = r.got === r.expected;
    if (!ok) bad++;
    if (!ok || opt.all) console.log(`${ok ? "✓" : "✗"} ${flavor.padEnd(8)} ${label(r.role, r.tool, r.args)}${r.where ? ` [${r.where}]` : ""}${ok ? "" : ` — expected ${r.expected}, got ${r.got}`}`);
  }
  summary.push(`${flavor}: ${rs.length} cases, ${rs.filter((r) => r.got !== r.expected).length} mismatches`);
}
console.log(summary.join(" · "));
process.exit(bad ? 1 : 0);
