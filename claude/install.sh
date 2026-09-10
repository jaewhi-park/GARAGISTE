#!/usr/bin/env bash
# GARAGISTE / Claude Code — installs .claude/ and docs/README.md into a git repository (macOS / Linux / WSL)
# Usage: ./install.sh [--project <path>|.] [--global] [--budget inherit|unlimited|high|medium|low] [--set agent=model[:effort]]... [--dry-run]
#   --project <path>  Install into that path (its git repo root). Default: current directory.
#   --global          Install into ~/.claude so the team is available in every repo. No default agent is forced;
#                     start with `claude --agent team-lead`.
#   --budget          Per-role model (opus/sonnet/haiku aliases) and effort assignment, scripted path. Default inherit
#                     (no model lines = session model). The recommended path is /hire in the first session.
#                     unlimited (API/in-house) · high (Max 20x) · medium (Max 5x) · low (Pro).
#   --set             Per-agent override, e.g. --set team-implementer=sonnet:high (repeatable)
#   Re-runnable. PowerShell-style flags (-Project, -Global, -Budget, -Set, -DryRun) are accepted too.
set -euo pipefail
SRC="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DRY=0; BUDGET="inherit"; SETS=(); PROJECT=""; MODE="project"
while [ $# -gt 0 ]; do
  case "$1" in
    --dry-run|-DryRun)  DRY=1; shift ;;
    --project|-Project) PROJECT="$2"; shift 2 ;;
    --global|-Global)   MODE="global"; shift ;;
    --budget|-Budget)   BUDGET="$2"; shift 2 ;;
    --set|-Set)         SETS+=("--set" "$2"); shift 2 ;;
    -h|--help|-Help)    sed -n '2,11p' "$0"; exit 0 ;;
    *) echo "Unknown option: $1" >&2; exit 1 ;;
  esac
done
run() { if [ "$DRY" = 1 ]; then echo "+ $*"; else "$@"; fi; }

# ---------- global install ----------
if [ "$MODE" = global ]; then
  DEST="$HOME/.claude"; CFG="$DEST/settings.json"
  echo "→ Global install: $DEST"
  for d in agents skills hooks scripts; do run mkdir -p "$DEST/$d"; done
  for d in agents skills hooks; do run cp -R "$SRC/.claude/$d/." "$DEST/$d/"; done
  for f in apply-models.mjs set-language.mjs new-agent.mjs set-profile.mjs; do run cp "$SRC/scripts/$f" "$DEST/scripts/$f"; done
  # Skills call the scripts by a project-relative path; in a global install they live under $DEST, so point them there.
  if [ "$DRY" = 0 ]; then
    for f in "$DEST"/skills/*/SKILL.md; do
      sed -i.bak -E "s#node \\.claude/scripts/(apply-models|set-language|new-agent|set-profile)\\.mjs#node \"$DEST/scripts/\\1.mjs\"#g" "$f" && rm -f "$f.bak"
    done
  fi
  if [ "$DRY" = 0 ]; then
python3 - "$CFG" "$SRC/.claude/settings.json" "$DEST" << 'PY'
import json, sys, pathlib
dst, src, dest = pathlib.Path(sys.argv[1]), pathlib.Path(sys.argv[2]), sys.argv[3]
d = json.loads(dst.read_text()) if dst.exists() else {}
s = json.loads(src.read_text())
for entries in s["hooks"].values():
    for e in entries:
        for h in e["hooks"]:
            h["command"] = h["command"].replace("node .claude/hooks/", f'node "{dest}/hooks/') + '"'  # quoted: $HOME may contain spaces
s["permissions"]["allow"] = [a.replace("node .claude/scripts/", f'node "{dest}/scripts/').replace(".mjs:*", '.mjs":*') if a.startswith("Bash(node .claude/scripts/") else a for a in s["permissions"]["allow"]]
perm = d.setdefault("permissions", {})
for k in ("allow", "deny"):
    perm[k] = list(dict.fromkeys(list(perm.get(k, [])) + s["permissions"][k]))
# Hooks: keep the repo's own hooks and add ours when absent (an existing PreToolUse hook, e.g. a formatter, must not hide the guardrails).
hooks = d.setdefault("hooks", {})
for ev, entries in s["hooks"].items():
    cur = hooks.setdefault(ev, [])
    have = {h["command"] for e in cur for h in e.get("hooks", [])}
    cur.extend(e for e in entries if not all(h["command"] in have for h in e["hooks"]))
# Global install does not force a default agent (avoids team-lead appearing in every repo).
dst.parent.mkdir(parents=True, exist_ok=True)
dst.write_text(json.dumps(d, indent=2, ensure_ascii=False) + "\n")
print("→ Merged:", dst, "(hook paths absolute, no default agent)")
PY
  fi
  if [ "$BUDGET" != inherit ] || [ ${#SETS[@]} -gt 0 ]; then
    command -v node >/dev/null 2>&1 && run node "$SRC/scripts/apply-models.mjs" --flavor claude --dest "$DEST/agents" --settings "$CFG" --budget "$BUDGET" ${SETS[@]+"${SETS[@]}"}
  fi
  echo; echo "Next: in any repo run \`claude --agent team-lead\` → /kickoff or /assess. (To make it the default for one repo, set \"agent\": \"team-lead\" in that repo's .claude/settings.json.)"
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

# 4. .gitignore
GI="$ROOT/.gitignore"
for line in ".claude/worktrees/" ".claude/agent-memory-local/"; do
  grep -qxF "$line" "$GI" 2>/dev/null || { [ "$DRY" = 1 ] && echo "+ append $line >> .gitignore" || { [ -s "$GI" ] && [ -n "$(tail -c1 "$GI")" ] && echo >> "$GI"; echo "$line" >> "$GI"; }; }
done

command -v claude >/dev/null 2>&1 || echo "! 'claude' not found on PATH."
command -v node >/dev/null 2>&1 || echo "! node not found. Hooks (.claude/hooks/*.mjs) require Node.js."
cat << 'MSG'

Next steps:
  1. Run `claude` in the repo (settings.agent makes team-lead the main agent). Accept the folder-trust prompt so hooks are enabled.
  2. New project: /kickoff <idea>   Legacy: /assess <target>   Continue: /resume
  3. Models: /hire at the end of kickoff/assess refines them; pass -Budget <tier> here so the first session already runs the verifier on the fast model
MSG
