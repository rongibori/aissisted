#!/usr/bin/env bash
# fix-icloud-dupes.sh — repair iCloud Drive's "* 2.*" duplicate-file syndrome
#
# Symptom: Next.js (and other tools) crash with `MODULE_NOT_FOUND` for files
# like './global'. Inspecting node_modules reveals the canonical filename was
# stripped and only "* 2.*" copies remain (e.g. `global 2.js` exists, but
# `global.js` is gone). This is iCloud Drive's collision-rename behavior.
#
# What this script does, on a target directory (defaults to node_modules):
#   1. For each "X 2.ext" file, if "X.ext" is missing, restore it from the dupe.
#   2. Delete every " 2" duplicate.
#   3. Print a summary.
#
# Run from repo root:
#   ./scripts/fix-icloud-dupes.sh                 # repair node_modules
#   ./scripts/fix-icloud-dupes.sh some/other/dir  # repair another tree
#
# Long-term fix: MOVE THIS REPO OUT OF iCloud Drive (e.g. ~/Code/aissisted).

set -e
TARGET="${1:-node_modules}"

if [[ ! -d "$TARGET" ]]; then
  echo "✗ Target directory not found: $TARGET"
  exit 1
fi

echo "→ Scanning $TARGET for iCloud duplicates..."

restored=0
removed=0
already=0

# Files with extension dupes: "name 2.ext" → "name.ext"
while IFS= read -r -d '' dupe; do
  canonical="${dupe/ 2./.}"
  if [[ ! -e "$canonical" ]]; then
    cp "$dupe" "$canonical" 2>/dev/null && restored=$((restored+1)) || true
  else
    already=$((already+1))
  fi
  rm -f "$dupe" 2>/dev/null && removed=$((removed+1)) || true
done < <(find "$TARGET" -type f -name "* 2.*" -print0 2>/dev/null)

# Files with no extension: "name 2" → "name"
while IFS= read -r -d '' dupe; do
  canonical="${dupe% 2}"
  if [[ ! -e "$canonical" ]]; then
    cp "$dupe" "$canonical" 2>/dev/null && restored=$((restored+1)) || true
  else
    already=$((already+1))
  fi
  rm -f "$dupe" 2>/dev/null && removed=$((removed+1)) || true
done < <(find "$TARGET" -type f -name "* 2" -print0 2>/dev/null)

remaining_ext=$(find "$TARGET" -type f -name "* 2.*" 2>/dev/null | wc -l | tr -d ' ')
remaining_noext=$(find "$TARGET" -type f -name "* 2" 2>/dev/null | wc -l | tr -d ' ')

echo
echo "✓ Repair pass complete"
echo "  Canonical files restored:  $restored"
echo "  Canonical already present: $already"
echo "  Dupes deleted:             $removed"
echo "  Dupes remaining:           $((remaining_ext + remaining_noext))"
echo
if [[ "$((remaining_ext + remaining_noext))" -gt 0 ]]; then
  echo "⚠ Some dupes couldn't be deleted (permissions/iCloud lock)."
  echo "  Try: sudo $0 $TARGET"
  echo "  Or move this repo OUT of iCloud Drive permanently."
fi
