#!/usr/bin/env bash
# aissisted-consolidate.sh
# DESTRUCTIVE but SAFE: moves stale Aissisted copies to a timestamped archive.
# Nothing is deleted. You can rm -rf the archive after you're confident (7+ days).
#
# Run aissisted-audit.sh FIRST and resolve anything flagged before running this.

set -euo pipefail

CANONICAL="$HOME/Documents/GitHub/aissisted"
ARCHIVE_DIR="$HOME/Archive/aissisted-stale-$(date +%Y%m%d-%H%M%S)"

# Paths to archive. Updated 2026-04-16 to match actual audit output.
# NOTE: $HOME/Documents/Claude/Projects/Aissisted is intentionally NOT here —
# that's the Cowork workspace. The guardrails script repoints it via symlink.
CANDIDATES=(
  "$HOME/Desktop/aissisted"
  "$HOME/Downloads/Aissisted files"
)

bold() { printf "\033[1m%s\033[0m\n" "$1"; }

echo
bold "=== Aissisted consolidation ==="
echo "Canonical:   $CANONICAL  (KEPT)"
echo "Archive to:  $ARCHIVE_DIR"
echo

# 1. Confirm canonical is healthy before we touch anything else
if [ ! -d "$CANONICAL/.git" ]; then
  echo "ABORT: canonical is not a git repo at $CANONICAL"
  exit 1
fi
(
  cd "$CANONICAL"
  dirty=$(git status --porcelain | wc -l | tr -d ' ')
  if [ "$dirty" -gt 0 ]; then
    echo "WARNING: canonical has $dirty uncommitted file(s)."
    echo "Commit or stash in the canonical repo before consolidating."
    read -p "Continue anyway? [y/N] " ok
    [[ "$ok" == "y" ]] || exit 1
  fi
)

# 2. Show what will move
echo
bold "Will move the following to $ARCHIVE_DIR :"
to_move=()
for path in "${CANDIDATES[@]}"; do
  if [ -d "$path" ]; then
    echo "  - $path"
    to_move+=("$path")
  fi
done

if [ ${#to_move[@]} -eq 0 ]; then
  echo "  (nothing to archive — all clear)"
  exit 0
fi

echo
read -p "Proceed? This moves, does NOT delete. [y/N] " ok
[[ "$ok" == "y" ]] || { echo "Aborted."; exit 0; }

# 3. Execute
mkdir -p "$ARCHIVE_DIR"
for path in "${to_move[@]}"; do
  name=$(basename "$path")
  dest="$ARCHIVE_DIR/$name"
  i=1
  while [ -e "$dest" ]; do
    dest="$ARCHIVE_DIR/${name}-${i}"
    i=$((i+1))
  done
  mv "$path" "$dest"
  echo "  moved: $path  ->  $dest"
done

# 4. Report
cat <<EOF

=== Done ===
Canonical preserved at: $CANONICAL
Stale copies archived:  $ARCHIVE_DIR

Next steps:
  1. Verify everything builds/deploys from canonical for ~7 days.
  2. Then permanently remove the archive:
       rm -rf "$ARCHIVE_DIR"
  3. Install shell guardrails (see aissisted-guardrails.sh).
  4. Repoint Cowork workspace to canonical (see guardrails doc).
EOF
