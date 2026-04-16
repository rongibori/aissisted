#!/usr/bin/env bash
# aissisted-nightly-backup.sh
# Captures any uncommitted work in canonical to a safety-net branch on GitHub.
# Does NOTHING if the working tree is clean. Safe to run multiple times per day.
#
# Behavior when dirty:
#   1. Stash current working tree (tracked + untracked, respects .gitignore so
#      secrets like infra/aws/.bootstrap-output.env stay local).
#   2. Push that stash commit to origin as `safety-net/YYYY-MM-DD`.
#   3. Restore working tree — user's in-progress edits untouched.
#
# Recover WIP from a safety-net branch:
#   git fetch origin
#   git checkout safety-net/YYYY-MM-DD
#   # -> the commit on that branch contains your WIP

set -u

CANONICAL="${AISSISTED_HOME:-$HOME/Documents/GitHub/aissisted}"
LOG="$HOME/Library/Logs/aissisted-nightly-backup.log"
KILL_SWITCH="$HOME/.aissisted-no-backup"

ts()  { date +"%Y-%m-%dT%H:%M:%S%z"; }
log() { echo "[$(ts)] $*" >> "$LOG"; }

mkdir -p "$(dirname "$LOG")"
log "=== run started ==="

# --- Preconditions ---

if [ ! -d "$CANONICAL/.git" ]; then
  log "ABORT: canonical repo not found at $CANONICAL"
  exit 1
fi
cd "$CANONICAL"

if [ -f "$KILL_SWITCH" ]; then
  log "SKIP: kill switch present ($KILL_SWITCH)"
  exit 0
fi

# --- Early exit if nothing to back up ---

if [ -z "$(git status --porcelain)" ]; then
  log "clean working tree — nothing to back up"
  log "=== run finished (clean) ==="
  exit 0
fi

# --- Refuse during active merge/rebase/cherry-pick — stash would be unsafe ---

if [ -d .git/rebase-merge ] || [ -d .git/rebase-apply ] \
   || [ -f .git/MERGE_HEAD ] || [ -f .git/CHERRY_PICK_HEAD ]; then
  log "SKIP: repo is mid-rebase/merge/cherry-pick — not safe to stash"
  log "=== run finished (skipped) ==="
  exit 0
fi

# --- Do the snapshot ---

CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo "detached")
TODAY=$(date +%Y-%m-%d)
SAFETY_BRANCH="safety-net/$TODAY"
STASH_MSG="safety-net: auto-snapshot $(ts) from $CURRENT_BRANCH"

log "dirty working tree on branch '$CURRENT_BRANCH' — creating snapshot"

if ! git stash push -u -m "$STASH_MSG" >> "$LOG" 2>&1; then
  log "ERROR: git stash push failed — aborting, working tree untouched"
  log "=== run finished (error) ==="
  exit 1
fi

# Capture stash commit SHA before popping
STASH_SHA=$(git rev-parse 'stash@{0}' 2>/dev/null || echo "")
if [ -z "$STASH_SHA" ]; then
  log "ERROR: could not read stash SHA — attempting pop and exiting"
  git stash pop >> "$LOG" 2>&1 || true
  exit 1
fi

# Push the stash commit directly to a remote branch.
# --force-with-lease = safe overwrite: only succeeds if nobody else pushed to
# safety-net/<today> in the meantime.
if git push origin "$STASH_SHA:refs/heads/$SAFETY_BRANCH" --force-with-lease >> "$LOG" 2>&1; then
  log "pushed snapshot -> origin/$SAFETY_BRANCH ($STASH_SHA)"
else
  log "ERROR: push to origin/$SAFETY_BRANCH failed"
  log "       your WIP is still at stash@{0} — run 'git stash pop' after investigating"
  # We intentionally do NOT pop automatically if push failed, so user can
  # retry the push manually without re-stashing.
  log "=== run finished (push error) ==="
  exit 1
fi

# Restore working directory
if git stash pop >> "$LOG" 2>&1; then
  log "restored working directory"
else
  log "WARNING: git stash pop reported conflicts — WIP is at stash@{0}"
  log "         resolve with: cd $CANONICAL && git stash pop"
fi

log "=== run finished (backup pushed) ==="
exit 0
