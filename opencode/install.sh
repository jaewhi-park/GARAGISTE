#!/usr/bin/env bash
# GARAGISTE / opencode — installs .opencode/ and opencode.json into a git repository (macOS / Linux / WSL)
# Usage: ./install.sh [--project <path>|.] [--global] [--budget inherit|unlimited|high|medium|low] [--strong id] [--fast id] [--set agent=model]... [--uninstall] [--dry-run]
#   default      Install only into the current git repo's .opencode/ and root opencode.json (global config untouched)
#   --project    Install into that path (its git repo root). Default: current directory.
#   --global     Only with --uninstall: removes an older global install from ~/.config/opencode (the team lives in the repository)
#   --budget     Per-role model assignment profile, scripted path. Default inherit (no model lines = session model).
#                The recommended path is /hire in the first session: the lead looks at the model list, budget and
#                project character and proposes an assignment. unlimited/high/medium/low distribute --strong/--fast
#                mechanically (non-interactive/scripting use).
#   --strong / --fast   Actual model IDs (provider/model) for the profile's strong/fast slots
#   --set        Per-agent override, e.g. --set team-reviewer=anthropic/claude-opus-4 (repeatable)
#   --model      Only to overwrite the default model in opencode.json
#   --uninstall  Remove what this installer put there (the project's .opencode/ and opencode.json entries, or with --global
#                ~/.config/opencode): the team's agents, commands, skills, plugins, scripts and config entries. Yours stay.
#   --dry-run    Print what would be done without changing anything
#   Re-runnable. PowerShell-style flags (-Project, -Global, -Budget, -Uninstall, ...) are accepted too.
set -euo pipefail

SRC="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
MODEL=""; MODE="project"; DRY=0; BUDGET="inherit"; STRONG=""; FAST=""; SETS=(); PROJECT=""; UNINSTALL=0
while [ $# -gt 0 ]; do
  case "$1" in
    --model|-Model)     MODEL="$2"; shift 2 ;;
    --budget|-Budget)   BUDGET="$2"; shift 2 ;;
    --strong|-Strong)   STRONG="$2"; shift 2 ;;
    --fast|-Fast)       FAST="$2"; shift 2 ;;
    --set|-Set)         SETS+=("--set" "$2"); shift 2 ;;
    --global|-Global)   MODE="global"; shift ;;
    --project|-Project) PROJECT="$2"; shift 2 ;;
    --dry-run|-DryRun)  DRY=1; shift ;;
    --uninstall|-Uninstall) UNINSTALL=1; shift ;;
    -h|--help|-Help)    sed -n '2,16p' "$0"; exit 0 ;;
    *) echo "Unknown option: $1" >&2; exit 1 ;;
  esac
done

if [ "$MODE" = global ] && [ "$UNINSTALL" = 0 ]; then
  echo "! No global install: the team lives in the repository (.opencode/ and opencode.json are committed with the project). Install into a project — ./install.sh opencode -Project <path>; an older global install is removed with -Global -Uninstall." >&2; exit 1
fi
if [ "$MODE" = global ]; then   # only reached with --uninstall
  DEST="${XDG_CONFIG_HOME:-$HOME/.config}/opencode"; CFG="$DEST/opencode.json"; BKBASE="$DEST.bak"
else
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
    if [ "$DRY" = 0 ] && [ "$UNINSTALL" = 0 ] && command -v git >/dev/null 2>&1 && [ -t 0 ]; then
      read -r -p "  Run git init here (default branch main)? [Y/n] " ans
      case "${ans:-Y}" in [Yy]*) git init -q && git symbolic-ref HEAD refs/heads/main && echo "→ git init done (main)";; esac
    fi
  fi
  DEST="$ROOT/.opencode"; CFG="$ROOT/opencode.json"; BKBASE="${TMPDIR:-/tmp}/garagiste-opencode-backup"
fi
run() { if [ "$DRY" = 1 ]; then echo "+ $*"; else "$@"; fi; }

# ---------- uninstall (project or global) ----------
# Removes only what the installer put there — the template's agents, commands, skills, plugins and scripts, and the entries it
# merged into opencode.json (instructions, subagent_depth, permission keys, team agent entries) — and backs each removed path up
# first. Your own agents, commands, skills, config keys, docs/ and .gitignore stay; what is left in the team's folders is listed.
if [ "$UNINSTALL" = 1 ]; then
  echo "→ Uninstall [$MODE]: $DEST  (config: $CFG)"
  [ -d "$DEST" ] || [ -f "$CFG" ] || { echo "→ Nothing to remove: $DEST does not exist"; exit 0; }
  BK="$BKBASE.$(date +%Y%m%d-%H%M%S)"; REMOVED=0
  bk_rm() {   # $1 = path relative to $DEST — copied under $BK, then removed
    local p="$DEST/$1"; { [ -e "$p" ] || [ -L "$p" ]; } || return 0
    if [ "$DRY" = 1 ]; then echo "- remove $p"; else mkdir -p "$BK/$(dirname "$1")" && cp -R "$p" "$BK/$1" && rm -rf "$p" && echo "- removed $p"; fi
    REMOVED=$((REMOVED + 1))
  }
  for f in "$SRC"/agents/*.md; do bk_rm "agents/$(basename "$f")"; done
  for f in "$SRC"/commands/*.md; do bk_rm "commands/$(basename "$f")"; done
  for d in "$SRC"/skills/*/; do bk_rm "skills/$(basename "$d")"; done
  for f in "$SRC"/plugins/*; do bk_rm "plugins/$(basename "$f")"; done
  for f in apply-models.mjs set-language.mjs new-agent.mjs set-profile.mjs; do bk_rm "scripts/$f"; done
  if [ -f "${CFG%.json}.jsonc" ]; then
    echo "! ${CFG%.json}.jsonc exists; the merge was by hand, so is the removal — drop these from it: instructions docs/CHARTER*.md · docs/STATUS*.md, subagent_depth, the permission block and the agent entries of $SRC/opencode.json"
  elif [ -f "$CFG" ]; then
python3 - "$CFG" "$SRC/opencode.json" "$DRY" "$BK" << 'PY'
import json, pathlib, shutil, sys
cfg, src, dry, bk = sys.argv[1:5]
cfg = pathlib.Path(cfg)
try:
    d = json.loads(cfg.read_text(encoding="utf-8"))
except Exception as e:
    print(f"! {cfg} is not valid JSON ({e}); left as it is"); sys.exit(0)
s = json.loads(pathlib.Path(src).read_text(encoding="utf-8"))
changed = []
ins = d.get("instructions")
if isinstance(ins, list):
    new = [i for i in ins if i not in s.get("instructions", [])]
    if len(new) != len(ins): changed.append(f"instructions: {len(ins) - len(new)} entries")
    if new: d["instructions"] = new
    else: del d["instructions"]
if "subagent_depth" in s and "subagent_depth" in d and d["subagent_depth"] == s["subagent_depth"]:
    del d["subagent_depth"]; changed.append("subagent_depth")
perm = d.get("permission")
if isinstance(perm, dict):
    for k, v in s.get("permission", {}).items():
        if k in perm and perm[k] == v: del perm[k]; changed.append(f"permission.{k}")
    if not perm: del d["permission"]
ag = d.get("agent")
if isinstance(ag, dict):
    for name in s.get("agent", {}):
        if name in ag: del ag[name]; changed.append(f"agent.{name}")
    if not ag: del d["agent"]
if changed and set(d) <= {"$schema"}: d = {}
if not changed:
    print(f"→ {cfg}: nothing of ours in it"); sys.exit(0)
for c in changed: print(f"- {'remove' if dry == '1' else 'removed'} from {cfg.name}: {c}")
if dry == "1": sys.exit(0)
pathlib.Path(bk).mkdir(parents=True, exist_ok=True); shutil.copy2(cfg, pathlib.Path(bk) / cfg.name)
if d:
    cfg.write_text(json.dumps(d, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    if "model" in d: print(f"→ Left in {cfg.name}: model — yours to keep or drop")
else:
    cfg.unlink(); print(f"- removed {cfg} (nothing else was in it)")
PY
  fi
  if [ "$DRY" = 0 ]; then for d in agents commands skills plugins scripts; do rmdir "$DEST/$d" 2>/dev/null || true; done; rmdir "$DEST" 2>/dev/null || true; fi
  [ "$REMOVED" = 0 ] && echo "→ No template files under $DEST"
  [ "$DRY" = 0 ] && [ "$REMOVED" -gt 0 ] && echo "→ Backup of what was removed: $BK"
  for d in agents commands skills plugins scripts; do
    [ -d "$DEST/$d" ] || continue
    left="$(ls -A "$DEST/$d" 2>/dev/null | tr '\n' ' ')"
    [ -n "$left" ] && echo "→ Left in $d/ (yours, or an older GARAGISTE name — remove by hand if unwanted): $left"
  done
  [ "$MODE" = project ] && echo "→ docs/ and .gitignore (the installer added docs/screens/) stay; commit the removal yourself."
  [ "$MODE" = global ] && echo "→ From now on a project's own .opencode/ and opencode.json are all opencode loads from the team."
  exit 0
fi

echo "→ Install location [$MODE]: $DEST  (config: $CFG)"

# 1. Backup
if [ -d "$DEST" ] && [ -n "$(ls -A "$DEST" 2>/dev/null)" ]; then
  BK="$BKBASE.$(date +%Y%m%d-%H%M%S)"
  echo "→ Backing up existing config to: $BK"
  run cp -R "$DEST" "$BK"
fi

# 2. Copy team files (overwrites same-named files only; the user's other files stay)
for d in agents commands skills plugins scripts; do
  run mkdir -p "$DEST/$d"
  run cp -R "$SRC/$d/." "$DEST/$d/"
done

# 2.5 Per-role model assignment (budget profile)
if [ "$BUDGET" != inherit ] || [ ${#SETS[@]} -gt 0 ]; then
  if ! command -v node >/dev/null 2>&1; then
    echo "! node not found; skipping model assignment. Add model: lines to agents/*.md yourself."
  else
    if [ "$BUDGET" != inherit ] && { [ -z "$STRONG" ] || [ -z "$FAST" ]; }; then
      if command -v opencode >/dev/null 2>&1; then
        echo "→ Available models (opencode models):"; opencode models 2>/dev/null | head -40 | sed 's/^/     /'
      fi
      echo "! --budget requires --strong and --fast model IDs. If you need judgment about which model is strong or fast, use /hire in the first session instead."; exit 1
    fi
    run node "$SRC/scripts/apply-models.mjs" --flavor opencode --dest "$DEST/agents" --budget "$BUDGET" \
      ${STRONG:+--strong "$STRONG"} ${FAST:+--fast "$FAST"} ${SETS[@]+"${SETS[@]}"}
  fi
fi

if [ "$MODE" = project ]; then
  [ -f "$DEST/../docs/README.md" ] || { run mkdir -p "$(dirname "$DEST")/docs"; run cp "$SRC/docs/README.md" "$(dirname "$DEST")/docs/README.md"; }
  # .gitignore (the status board docs/STATUS.md is committed; an older install git-ignored it — that line is removed)
  GI="$(dirname "$DEST")/.gitignore"
  for line in "docs/screens/"; do
    grep -qxF "$line" "$GI" 2>/dev/null || { [ "$DRY" = 1 ] && echo "+ append $line >> .gitignore" || { [ -s "$GI" ] && [ -n "$(tail -c1 "$GI")" ] && echo >> "$GI"; echo "$line" >> "$GI"; }; }
  done
  if grep -qxF "docs/STATUS.md" "$GI" 2>/dev/null; then
    [ "$DRY" = 1 ] && echo "- remove docs/STATUS.md from .gitignore (the board is committed now)" || { grep -vxF "docs/STATUS.md" "$GI" > "$GI.tmp" && mv "$GI.tmp" "$GI"; echo "→ docs/STATUS.md removed from .gitignore: the board is committed from now on (the next milestone commit adds it)"; }
  fi
fi

# 3. Merge opencode.json (keep existing provider/model, union instructions, permission and agent entries only when absent)
if [ -f "${CFG%.json}.jsonc" ]; then
  echo "! ${CFG%.json}.jsonc exists; skipping automatic merge. Merge the following by hand:"
  cat "$SRC/opencode.json"
elif [ "$DRY" = 1 ]; then
  echo "+ merge $SRC/opencode.json -> $CFG${MODEL:+ (model=$MODEL)}"
else
  python3 - "$CFG" "$SRC/opencode.json" "$MODEL" << 'PY'
import json, sys, pathlib
dst, src, model = pathlib.Path(sys.argv[1]), pathlib.Path(sys.argv[2]), sys.argv[3]
d = json.loads(dst.read_text()) if dst.exists() else {}
s = json.loads(src.read_text())
d.setdefault("$schema", s["$schema"])
if "subagent_depth" in s: d.setdefault("subagent_depth", s["subagent_depth"])
d["instructions"] = list(dict.fromkeys(list(d.get("instructions", [])) + s["instructions"]))
perm = d.get("permission")
if isinstance(perm, dict):
    for k, v in s["permission"].items(): perm.setdefault(k, v)
elif perm is None:
    d["permission"] = s["permission"]
ag = d.get("agent")
if ag is None:
    d["agent"] = s.get("agent", {})
elif isinstance(ag, dict):
    for name, cfg in s.get("agent", {}).items():
        cur = ag.setdefault(name, {})
        if not isinstance(cur, dict): continue
        for k, v in cfg.items():
            if k == "permission" and isinstance(cur.get("permission"), dict):
                for pk, pv in v.items(): cur["permission"].setdefault(pk, pv)
            else:
                cur.setdefault(k, v)

if model: d["model"] = model
dst.parent.mkdir(parents=True, exist_ok=True)
dst.write_text(json.dumps(d, indent=2, ensure_ascii=False) + "\n")
print("→ Merged:", dst, "(model =", d.get("model", "inherited") + ")")
PY
fi

# 4. Next steps
echo
command -v opencode >/dev/null 2>&1 || echo "! 'opencode' not found on PATH."
cat << 'MSG'
Next steps:
  1. Run `opencode` in the repo → press Tab to select team-lead
  2. Brief first: /brainstorm <idea or file>   New project: /kickoff   Legacy: /assess <target>   Continue: /resume
  3. Models: /hire at the end of kickoff/assess refines them; pass -Budget <tier> -Strong <id> -Fast <id> here so the first session already runs the verifier on the fast model
MSG
