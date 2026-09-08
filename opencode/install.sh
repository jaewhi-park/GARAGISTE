#!/usr/bin/env bash
# GARAGISTE / opencode — installs .opencode/ and opencode.json into a git repository (macOS / Linux / WSL)
# Usage: ./install.sh [--project <path>|.] [--global] [--budget inherit|unlimited|high|medium|low] [--strong id] [--fast id] [--set agent=model]... [--dry-run]
#   default      Install only into the current git repo's .opencode/ and root opencode.json (global config untouched)
#   --project    Install into that path (its git repo root). Default: current directory.
#   --global     Install into ~/.config/opencode instead, applying to every repo
#   --budget     Per-role model assignment profile, scripted path. Default inherit (no model lines = session model).
#                The recommended path is /hire in the first session: the lead looks at the model list, budget and
#                project character and proposes an assignment. unlimited/high/medium/low distribute --strong/--fast
#                mechanically (non-interactive/scripting use).
#   --strong / --fast   Actual model IDs (provider/model) for the profile's strong/fast slots
#   --set        Per-agent override, e.g. --set team-reviewer=anthropic/claude-opus-4 (repeatable)
#   --model      Only to overwrite the default model in opencode.json
#   --dry-run    Print what would be done without changing anything
#   Re-runnable. PowerShell-style flags (-Project, -Global, -Budget, ...) are accepted too.
set -euo pipefail

SRC="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
MODEL=""; MODE="project"; DRY=0; BUDGET="inherit"; STRONG=""; FAST=""; SETS=(); PROJECT=""
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
    -h|--help|-Help)    sed -n '2,14p' "$0"; exit 0 ;;
    *) echo "Unknown option: $1" >&2; exit 1 ;;
  esac
done

if [ "$MODE" = global ]; then
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
    if [ "$DRY" = 0 ] && command -v git >/dev/null 2>&1 && [ -t 0 ]; then
      read -r -p "  Run git init here (default branch main)? [Y/n] " ans
      case "${ans:-Y}" in [Yy]*) git init -q && git symbolic-ref HEAD refs/heads/main && echo "→ git init done (main)";; esac
    fi
  fi
  DEST="$ROOT/.opencode"; CFG="$ROOT/opencode.json"; BKBASE="${TMPDIR:-/tmp}/garagiste-opencode-backup"
fi
run() { if [ "$DRY" = 1 ]; then echo "+ $*"; else "$@"; fi; }

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

[ -f "$DEST/../docs/README.md" ] || { run mkdir -p "$(dirname "$DEST")/docs"; run cp "$SRC/docs/README.md" "$(dirname "$DEST")/docs/README.md"; }

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
  2. New project: /kickoff <idea>   Legacy: /assess <target>   Continue: /resume
  3. Model assignment (hiring): /hire
MSG
