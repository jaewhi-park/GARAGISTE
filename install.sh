#!/usr/bin/env bash
# GARAGISTE installer entry point
# Usage: ./install.sh <opencode|claude> [options]
#   Options are shared by both flavors; --project and -Project style are both accepted:
#     -Project <path>|.   Install into that path (its git repo root). Default: current directory
#     -Global             Global install
#     -Budget <tier>      Model assignment profile (recommended: /hire after installing)
#     -Set agent=model    Per-agent model override (repeatable)
#     -DryRun             Preview without changes
#   Examples: ./install.sh claude -Project ~/work/myapp
#             ./install.sh opencode -Global
set -euo pipefail
HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
usage() { sed -n '2,12p' "$0"; }
flavor="${1:-}"; [ $# -gt 0 ] && shift
case "$flavor" in
  opencode|oc)             exec "$HERE/opencode/install.sh" "$@" ;;
  claude|claude-code|cc)   exec "$HERE/claude/install.sh" "$@" ;;
  ""|-h|--help|-Help|help) usage; exit 0 ;;
  *) echo "Unknown target: $flavor (use opencode or claude)" >&2; usage; exit 1 ;;
esac
