#!/usr/bin/env bash
# GARAGISTE / Claude Code — installs .claude/ and docs/README.md into a git repository (macOS / Linux / WSL)
# Usage: ./install.sh [--project <path>|.] [--global] [--budget inherit|unlimited|high|medium|low] [--set agent=model[:effort]]... [--uninstall] [--dry-run]
#   --project <path>  Install into that path (its git repo root). Default: current directory.
#   --global          Only with --uninstall: removes an older global install from ~/.claude. There is no global install —
#                     the team lives in the repository (.claude/ is committed with the project), so install into a project.
#   --budget          Per-role model (opus/sonnet/haiku aliases) and effort assignment, scripted path. Default inherit
#                     (no model lines = session model). The recommended path is /hire in the first session.
#                     unlimited (API/in-house) · high (Max 20x) · medium (Max 5x) · low (Pro).
#   --set             Per-agent override, e.g. --set team-implementer=sonnet:high (repeatable)
#   --uninstall       Remove what this installer put there (the project's .claude/ or, with --global, ~/.claude): the team's
#                     agents, skills, hooks and scripts and its settings entries. Your own files and settings stay. --dry-run previews.
#   Re-runnable. PowerShell-style flags (-Project, -Global, -Budget, -Set, -Uninstall, -DryRun) are accepted too.
set -euo pipefail
SRC="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DRY=0; BUDGET="inherit"; SETS=(); PROJECT=""; MODE="project"; UNINSTALL=0
while [ $# -gt 0 ]; do
  case "$1" in
    --dry-run|-DryRun)  DRY=1; shift ;;
    --project|-Project) PROJECT="$2"; shift 2 ;;
    --global|-Global)   MODE="global"; shift ;;
    --budget|-Budget)   BUDGET="$2"; shift 2 ;;
    --set|-Set)         SETS+=("--set" "$2"); shift 2 ;;
    --uninstall|-Uninstall) UNINSTALL=1; shift ;;
    -h|--help|-Help)    sed -n '2,13p' "$0"; exit 0 ;;
    *) echo "Unknown option: $1" >&2; exit 1 ;;
  esac
done
run() { if [ "$DRY" = 1 ]; then echo "+ $*"; else "$@"; fi; }
if [ "$MODE" = global ] && [ "$UNINSTALL" = 0 ]; then
  echo "! No global install: the team lives in the repository (.claude/ is committed with the project). Install into a project — ./install.sh claude -Project <path>; an older global install is removed with -Global -Uninstall." >&2; exit 1
fi

# ---------- uninstall (project or global) ----------
# Removes only what the installer put there — the template's agents, skills, hooks and scripts, the hook and permission
# entries it merged into settings.json, the project's default agent — and backs each removed path up first. Your own
# agents, skills, hooks and settings, docs/ and .gitignore stay; what is left in the team's folders is listed at the end.
if [ "$UNINSTALL" = 1 ]; then
  if [ "$MODE" = global ]; then
    DEST="$HOME/.claude"
  else
    if [ -n "$PROJECT" ]; then [ -d "$PROJECT" ] || { echo "! Path not found: $PROJECT" >&2; exit 1; }; cd "$PROJECT"; fi
    ROOT="$(git rev-parse --show-toplevel 2>/dev/null || pwd -P)"
    DEST="$ROOT/.claude"
  fi
  CFG="$DEST/settings.json"
  echo "→ Uninstall [$MODE]: $DEST"
  [ -d "$DEST" ] || { echo "→ Nothing to remove: $DEST does not exist"; exit 0; }
  INPLACE=0
  if [ "$MODE" = project ] && [ "$(cd "$SRC" && pwd -P)" = "$(cd "$ROOT" && pwd -P)" ]; then INPLACE=1; echo "→ Template is extracted directly in the repo root; its files stay, settings only."; fi
  BK="${TMPDIR:-/tmp}/garagiste-claude-backup.$(date +%Y%m%d-%H%M%S)"; REMOVED=0
  bk_rm() {   # $1 = path relative to $DEST — copied under $BK, then removed
    local p="$DEST/$1"; { [ -e "$p" ] || [ -L "$p" ]; } || return 0
    if [ "$DRY" = 1 ]; then echo "- remove $p"; else mkdir -p "$BK/$(dirname "$1")" && cp -R "$p" "$BK/$1" && rm -rf "$p" && echo "- removed $p"; fi
    REMOVED=$((REMOVED + 1))
  }
  if [ "$INPLACE" = 0 ]; then
    for f in "$SRC"/.claude/agents/*.md; do bk_rm "agents/$(basename "$f")"; done
    for d in "$SRC"/.claude/skills/*/; do bk_rm "skills/$(basename "$d")"; done
    for f in "$SRC"/.claude/hooks/*.mjs; do bk_rm "hooks/$(basename "$f")"; done
  fi
  for f in apply-models.mjs set-language.mjs new-agent.mjs set-profile.mjs; do bk_rm "scripts/$f"; done
  [ "$MODE" = project ] && bk_rm "session"     # git-ignored runtime logs: compactions, denies.jsonl, spawns.jsonl
  if [ -f "$CFG" ]; then
python3 - "$CFG" "$SRC/.claude/settings.json" "$SRC/.claude/hooks" "$DEST" "$MODE" "$DRY" "$BK" << 'PY'
import json, pathlib, re, shutil, sys
cfg, src, hookdir, dest, mode, dry, bk = sys.argv[1:8]
cfg = pathlib.Path(cfg)
try:
    d = json.loads(cfg.read_text(encoding="utf-8"))
except Exception as e:
    print(f"! {cfg} is not valid JSON ({e}); left as it is"); sys.exit(0)
s = json.loads(pathlib.Path(src).read_text(encoding="utf-8"))
names = sorted(p.name for p in pathlib.Path(hookdir).glob("*.mjs"))
ours = lambda cmd: any(re.search(r"[\\/]hooks[\\/]" + re.escape(n) + r"(?![\w.-])", str(cmd)) for n in names)
changed = []
hooks = d.get("hooks")
if isinstance(hooks, dict):
    for ev in list(hooks):
        keep = []
        for e in (hooks[ev] if isinstance(hooks[ev], list) else []):
            inner = e.get("hooks", []) if isinstance(e, dict) else []
            rest = [h for h in inner if not (isinstance(h, dict) and ours(h.get("command", "")))]
            if inner and not rest:
                changed.append(f"hooks.{ev}: {inner[0].get('command')}"); continue
            if len(rest) != len(inner):
                e = dict(e, hooks=rest); changed.append(f"hooks.{ev}: {len(inner) - len(rest)} of ours out of a mixed entry")
            keep.append(e)
        if keep: hooks[ev] = keep
        else: del hooks[ev]
    if not hooks: del d["hooks"]
def gform(a):   # the global install writes the script permissions with absolute paths
    return a.replace("node .claude/scripts/", f'node "{dest}/scripts/').replace(".mjs:*", '.mjs":*') if a.startswith("Bash(node .claude/scripts/") else a
perm = d.get("permissions")
if isinstance(perm, dict):
    for k in ("allow", "deny"):
        tpl = s.get("permissions", {}).get(k, [])
        mine = set(tpl) | {gform(a) for a in tpl}
        cur = perm.get(k)
        if isinstance(cur, list):
            new = [a for a in cur if a not in mine]
            if len(new) != len(cur): changed.append(f"permissions.{k}: {len(cur) - len(new)} entries")
            if new: perm[k] = new
            else: del perm[k]
    if not perm: del d["permissions"]
if mode == "project" and "agent" in d and d.get("agent") == s.get("agent"):
    del d["agent"]; changed.append(f"agent: {s.get('agent')}")
if mode == "project" and "worktree" in d and d.get("worktree") == s.get("worktree"):
    del d["worktree"]; changed.append("worktree")
if not changed:
    print(f"→ {cfg}: nothing of ours in it"); sys.exit(0)
for c in changed: print(f"- {'remove' if dry == '1' else 'removed'} from {cfg.name}: {c}")
if dry == "1": sys.exit(0)
pathlib.Path(bk).mkdir(parents=True, exist_ok=True); shutil.copy2(cfg, pathlib.Path(bk) / cfg.name)
if d:
    cfg.write_text(json.dumps(d, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    left = [k for k in ("model", "language") if k in d]
    if left: print(f"→ Left in {cfg.name}: {', '.join(left)} — Claude Code settings written by /hire or /lang; yours to keep or drop")
else:
    cfg.unlink(); print(f"- removed {cfg} (nothing else was in it)")
PY
  fi
  if [ "$DRY" = 0 ]; then for d in agents skills hooks scripts; do rmdir "$DEST/$d" 2>/dev/null || true; done; rmdir "$DEST" 2>/dev/null || true; fi
  [ "$REMOVED" = 0 ] && echo "→ No template files under $DEST"
  [ "$DRY" = 0 ] && [ "$REMOVED" -gt 0 ] && echo "→ Backup of what was removed: $BK"
  for d in agents skills hooks scripts; do
    [ -d "$DEST/$d" ] || continue
    left="$(ls -A "$DEST/$d" 2>/dev/null | tr '\n' ' ')"
    [ -n "$left" ] && echo "→ Left in $d/ (yours, or an older GARAGISTE name — remove by hand if unwanted): $left"
  done
  [ "$MODE" = project ] && echo "→ docs/, .gitignore (the installer added .claude/worktrees/, .claude/session/, docs/screens/) and .claude/worktrees/ stay; commit the removal yourself."
  [ "$MODE" = global ] && echo "→ From now on a project's own .claude/ is all Claude Code loads (a same-named skill under ~/.claude used to win over the project's)."
  exit 0
fi

# ---------- project install ----------
if [ -n "$PROJECT" ]; then
  [ -d "$PROJECT" ] || { echo "! Path not found: $PROJECT" >&2; exit 1; }
  cd "$PROJECT"
fi
if ROOT="$(git rev-parse --show-toplevel 2>/dev/null)"; then
  [ "$ROOT" = "$(pwd -P)" ] || echo "→ Using git root: $ROOT"
else
  ROOT="$PWD"
  echo "! Not a git repository: $ROOT"
  echo "  The team relies on branches, commits and worktrees, so git is required."
  if [ "$DRY" = 0 ] && command -v git >/dev/null 2>&1 && [ -t 0 ]; then
    read -r -p "  Run git init here (default branch main)? [Y/n] " ans
    case "${ans:-Y}" in [Yy]*) git init -q && git symbolic-ref HEAD refs/heads/main && echo "→ git init done (main)";; esac
  fi
fi
INPLACE=0; [ "$(cd "$SRC" && pwd -P)" = "$(cd "$ROOT" && pwd -P)" ] && INPLACE=1 && echo "→ Template is extracted directly in the repo root; skipping file copy, merging settings only."
echo "→ Install location: $ROOT/.claude"

# 1. Backup (temp dir outside the repo)
if [ -d "$ROOT/.claude" ] && [ "$INPLACE" = 0 ]; then
  BK="${TMPDIR:-/tmp}/garagiste-claude-backup.$(date +%Y%m%d-%H%M%S)"
  echo "→ Backing up existing .claude to: $BK"; run cp -R "$ROOT/.claude" "$BK"
fi

# 2. Copy team files (overwrites same-named files only)
if [ "$INPLACE" = 0 ]; then
  for d in agents skills hooks; do
    run mkdir -p "$ROOT/.claude/$d"; run cp -R "$SRC/.claude/$d/." "$ROOT/.claude/$d/"
  done
fi
run mkdir -p "$ROOT/.claude/scripts"; for f in apply-models.mjs set-language.mjs new-agent.mjs set-profile.mjs; do run cp "$SRC/scripts/$f" "$ROOT/.claude/scripts/$f"; done
run mkdir -p "$ROOT/docs"
[ -f "$ROOT/docs/README.md" ] || run cp "$SRC/docs/README.md" "$ROOT/docs/README.md"

# 3. Merge settings.json (agent, permissions union, hook entries added when absent)
CFG="$ROOT/.claude/settings.json"
if [ "$DRY" = 1 ]; then echo "+ merge $SRC/.claude/settings.json -> $CFG"
else
python3 - "$CFG" "$SRC/.claude/settings.json" << 'PY'
import json, sys, pathlib
dst, src = pathlib.Path(sys.argv[1]), pathlib.Path(sys.argv[2])
d = json.loads(dst.read_text()) if dst.exists() else {}
s = json.loads(src.read_text())
d["agent"] = s["agent"]
if "worktree" in s: d.setdefault("worktree", s["worktree"])   # /parallel builders branch from the session HEAD, not the remote default branch
perm = d.setdefault("permissions", {})
for k in ("allow", "deny"):
    perm[k] = list(dict.fromkeys(list(perm.get(k, [])) + s["permissions"][k]))
# Hooks: keep the repo's own hooks and add ours when absent (an existing PreToolUse hook, e.g. a formatter, must not hide the guardrails).
hooks = d.setdefault("hooks", {})
for ev, entries in s["hooks"].items():
    cur = hooks.setdefault(ev, [])
    have = {h["command"] for e in cur for h in e.get("hooks", [])}
    cur.extend(e for e in entries if not all(h["command"] in have for h in e["hooks"]))
dst.write_text(json.dumps(d, indent=2, ensure_ascii=False) + "\n")
print("→ Merged:", dst)
PY
fi

# 3.5 Per-role model/effort assignment (budget profile)
if [ "$BUDGET" != inherit ] || [ ${#SETS[@]} -gt 0 ]; then
  if command -v node >/dev/null 2>&1; then
    run node "$SRC/scripts/apply-models.mjs" --flavor claude --dest "$ROOT/.claude/agents" --settings "$CFG" --budget "$BUDGET" ${SETS[@]+"${SETS[@]}"}
  else echo "! node not found; skipping model assignment."; fi
fi

# 4. .gitignore (the status board docs/STATUS.md is committed; an older install git-ignored it — that line is removed)
GI="$ROOT/.gitignore"
for line in ".claude/worktrees/" ".claude/session/" "docs/screens/"; do
  grep -qxF "$line" "$GI" 2>/dev/null || { [ "$DRY" = 1 ] && echo "+ append $line >> .gitignore" || { [ -s "$GI" ] && [ -n "$(tail -c1 "$GI")" ] && echo >> "$GI"; echo "$line" >> "$GI"; }; }
done
if grep -qxF "docs/STATUS.md" "$GI" 2>/dev/null; then
  [ "$DRY" = 1 ] && echo "- remove docs/STATUS.md from .gitignore (the board is committed now)" || { grep -vxF "docs/STATUS.md" "$GI" > "$GI.tmp" && mv "$GI.tmp" "$GI"; echo "→ docs/STATUS.md removed from .gitignore: the board is committed from now on (the next milestone commit adds it)"; }
fi

command -v claude >/dev/null 2>&1 || echo "! 'claude' not found on PATH."
command -v node >/dev/null 2>&1 || echo "! node not found. Hooks (.claude/hooks/*.mjs) require Node.js."
cat << 'MSG'

Next steps:
  1. Run `claude` in the repo (settings.agent makes team-lead the main agent). Accept the folder-trust prompt so hooks are enabled.
  2. Brief first: /brainstorm <idea or file>   New project: /kickoff   Legacy: /assess <target>   Continue: /resume
  3. Models: /hire at the end of kickoff/assess refines them; pass -Budget <tier> here so the first session already runs the verifier on the fast model
MSG
