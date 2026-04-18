#!/usr/bin/env bash
# aissisted-audit.sh
# READ-ONLY. Scans the machine for every Aissisted repo copy, reports drift.
# Run this FIRST. It changes nothing.

# NOTE: intentionally NOT using set -e. find/git commands may return non-zero
# on minor issues (e.g. permission-denied dirs) and we don't want the audit
# to abort silently mid-report. We handle errors inline instead.
set -u

CANONICAL="$HOME/Documents/GitHub/aissisted"

CANDIDATES=(
  "$HOME/Desktop/aissisted"
  "$HOME/Downloads/Aissisted files"
  "$HOME/Documents/Claude/Projects/Aissisted"
)

bold() { printf "\033[1m%s\033[0m\n" "$1"; }
dim()  { printf "\033[2m%s\033[0m\n" "$1"; }
warn() { printf "\033[33m%s\033[0m\n" "$1"; }
ok()   { printf "\033[32m%s\033[0m\n" "$1"; }
err()  { printf "\033[31m%s\033[0m\n" "$1"; }

echo
bold "=== Aissisted repo audit ==="
echo "Canonical (source of truth): $CANONICAL"
echo

bold "1) Filesystem sweep for 'aissisted' folders under \$HOME (depth <=4)"
find "$HOME" -maxdepth 4 -type d -iname 'aissisted*' \
  -not -path '*/node_modules/*' \
  -not -path '*/.Trash/*' \
  -not -path '*/Library/Caches/*' \
  2>/dev/null | sort -u
echo

bold "2) Canonical repo status"
if [ ! -d "$CANONICAL/.git" ]; then
  err "MISSING: canonical is not a git repo at $CANONICAL"
  exit 1
fi
(
  cd "$CANONICAL"
  echo "  remote:    $(git remote get-url origin 2>/dev/null || echo 'NONE')"
  echo "  branch:    $(git rev-parse --abbrev-ref HEAD)"
  echo "  HEAD:      $(git log --oneline -1)"
  echo "  dirty:     $(git status --porcelain | wc -l | tr -d ' ') file(s)"
  echo "  stashes:   $(git stash list | wc -l | tr -d ' ')"
  echo "  unpushed:  $(git log --oneline @{u}.. 2>/dev/null | wc -l | tr -d ' ') commit(s)"
)
echo

bold "3) Candidate stale copies"
for path in "${CANDIDATES[@]}"; do
  [ -d "$path" ] || continue
  [ "$path" = "$CANONICAL" ] && continue

  echo
  warn "--- $path ---"
  if [ ! -d "$path/.git" ]; then
    dim "  (not a git repo — likely a ZIP extract or Cowork mirror)"
    du -sh "$path" 2>/dev/null | sed 's/^/  size: /'
    stat -f "  modified: %Sm" "$path" 2>/dev/null || true
    continue
  fi

  (
    cd "$path"
    echo "  remote:    $(git remote get-url origin 2>/dev/null || echo 'NONE')"
    echo "  branch:    $(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo 'detached')"
    echo "  HEAD:      $(git log --oneline -1 2>/dev/null || echo 'no commits')"

    dirty=$(git status --porcelain | wc -l | tr -d ' ')
    stashes=$(git stash list | wc -l | tr -d ' ')
    if [ "$dirty" -gt 0 ]; then
      err  "  dirty:     $dirty uncommitted file(s)  <-- REVIEW BEFORE ARCHIVING"
      git status --short | sed 's/^/    /'
    else
      ok   "  dirty:     0"
    fi
    if [ "$stashes" -gt 0 ]; then
      err  "  stashes:   $stashes  <-- REVIEW BEFORE ARCHIVING"
      git stash list | sed 's/^/    /'
    else
      ok   "  stashes:   0"
    fi

    local_only=$(git for-each-ref --format='%(refname:short) %(upstream)' refs/heads \
      | awk '$2=="" {print $1}')
    if [ -n "$local_only" ]; then
      err "  local-only branches (never pushed):"
      echo "$local_only" | sed 's/^/    /'
    else
      ok  "  local-only branches: none"
    fi
  )
done

echo
bold "=== Summary ==="
echo "If every candidate above shows: dirty=0, stashes=0, no local-only branches,"
echo "then consolidation is safe. Proceed with: aissisted-consolidate.sh"
