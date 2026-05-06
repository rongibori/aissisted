#!/usr/bin/env bash
# extract-voice-lock-pr.command — extract the voice lock commit (3a8e123)
# onto its own branch off origin/main, push it, open a clean PR.
#
# Why: the previous push landed on claude/implement-onboarding-cover-uqkFR,
# which is already attached to draft PR #64 targeting design-system-v0.1.
# That bundles voice-lock with unrelated onboarding work. This isolates it.

set -e

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$DIR"
clear

GREEN=$'\033[0;32m'; RED=$'\033[0;31m'; BLUE=$'\033[0;34m'
YELLOW=$'\033[0;33m'; BOLD=$'\033[1m'; DIM=$'\033[2m'; RESET=$'\033[0m'

# ─── Sanity ────────────────────────────────────────────────────────────────
if [[ "$DIR" != "/Users/rongibori/Documents/GitHub/aissisted" ]]; then
  echo "${RED}✗ Not in canonical clone. Bailing.${RESET}"
  read -n 1 -s -p "Press any key..."
  exit 1
fi

# Locate the voice lock commit by message pattern (more robust than hardcoded SHA)
VOICE_LOCK_SHA=$(git log --all --pretty=%H --grep="Lock in Jeffrey Voice v1.1" -n 1)
if [[ -z "$VOICE_LOCK_SHA" ]]; then
  echo "${RED}✗ Could not find the voice lock commit. Bailing.${RESET}"
  read -n 1 -s -p "Press any key..."
  exit 1
fi
SHORT_SHA=${VOICE_LOCK_SHA:0:7}

echo "${BOLD}${BLUE}→ Voice lock commit found:${RESET} $SHORT_SHA"
echo "${DIM}  $(git log -1 --pretty=%s $VOICE_LOCK_SHA)${RESET}"
echo

# ─── Stash any in-progress dirty state so checkout is clean ────────────────
STASHED=0
if [[ -n "$(git status --porcelain)" ]]; then
  echo "${YELLOW}→ Stashing uncommitted work to keep tree clean...${RESET}"
  git stash push -u -m "auto-stash before voice-lock PR extraction" >/dev/null
  STASHED=1
fi

# ─── Fetch latest origin/main ───────────────────────────────────────────────
echo "${BLUE}→ Fetching origin/main...${RESET}"
git fetch origin main

# ─── Create the dedicated branch off origin/main ───────────────────────────
NEW_BRANCH="voice-lock-v1.1"

# If branch exists locally, delete it (we want a fresh one)
if git show-ref --verify --quiet "refs/heads/$NEW_BRANCH"; then
  echo "${YELLOW}→ Deleting stale local $NEW_BRANCH${RESET}"
  ORIG_BRANCH=$(git rev-parse --abbrev-ref HEAD)
  if [[ "$ORIG_BRANCH" == "$NEW_BRANCH" ]]; then
    git checkout -q origin/main
  fi
  git branch -D "$NEW_BRANCH" >/dev/null
fi

ORIG_BRANCH=$(git rev-parse --abbrev-ref HEAD)
echo "${BOLD}${BLUE}→ Returning here when done:${RESET} $ORIG_BRANCH"

echo "${BLUE}→ Creating $NEW_BRANCH from origin/main...${RESET}"
git checkout -b "$NEW_BRANCH" origin/main

# ─── Cherry-pick the voice lock commit ─────────────────────────────────────
echo "${BLUE}→ Cherry-picking $SHORT_SHA...${RESET}"
if git cherry-pick "$VOICE_LOCK_SHA"; then
  echo "${GREEN}✓ Cherry-pick clean.${RESET}"
else
  echo "${RED}✗ Cherry-pick had conflicts. Aborting.${RESET}"
  git cherry-pick --abort 2>/dev/null || true
  git checkout -q "$ORIG_BRANCH"
  if [[ "$STASHED" == "1" ]]; then git stash pop >/dev/null; fi
  read -n 1 -s -p "Press any key..."
  exit 1
fi

# ─── Push the new branch ───────────────────────────────────────────────────
echo "${BLUE}→ Pushing $NEW_BRANCH to origin...${RESET}"
git push -u origin "$NEW_BRANCH"
echo "${GREEN}✓ Pushed.${RESET}"
echo

# ─── Open PR via gh CLI ────────────────────────────────────────────────────
PR_BODY=$(cat <<'EOF'
Cedar voice + British RP, with two pacing knobs dialed up after A/B against ballad and Ron's explicit ratification.

## Changes

Mirrored across `apps/landing/server.mjs` + `apps/landing/api/jeffrey-realtime-token.ts`:

| Knob | v1 | v1.1 | Effect |
|---|---|---|---|
| `silence_duration_ms` | `800` | `1000` | Jeffrey waits ~200ms longer before responding |
| Voice block — `Calm. Conversational.` | unchanged | `Calm. Unhurried. Conversational.` | Adds 'unhurried' anchor |
| Voice block — Pace line | unchanged | + `Soften your volume a touch. Pause a beat between sentences. Let pauses breathe.` | Pushes toward gentler, more spaced delivery |

## Unchanged

- `voice: cedar` (still locked)
- `temperature: 0.6` (already at floor)
- British RP enforcement
- Persona, orchestrator, safety, eval coverage

## Ratification

Ron sign-off live on `journalism-expressed-array-mysterious.trycloudflare.com` at 7:16 PM PT, 2026-05-03.

## Spec

`docs/specs/JEFFREY_VOICE_LOCK.md` bumped to v1.1 with §7 changelog.

## Helpers

- `jeffrey-voice-deploy.command` — cedar default launcher
- `jeffrey-voice-ballad.command` — A/B override (lock untouched, env-var only)
- `commit-voice-lock.command` — focused-commit helper
- `extract-voice-lock-pr.command` — what created this PR

## Scope

Surgical. 7 files, all directly in the voice-lock domain. No persona, orchestrator, safety, eval, or design-system changes ride along.
EOF
)

if command -v gh >/dev/null 2>&1; then
  echo "${BLUE}→ Opening PR via gh CLI...${RESET}"
  PR_URL=$(gh pr create \
    --base main \
    --head "$NEW_BRANCH" \
    --title "Lock in Jeffrey Voice v1.1 — calm dial-up" \
    --body "$PR_BODY")
  echo "${GREEN}${BOLD}✓ PR opened:${RESET} $PR_URL"
  open "$PR_URL"
else
  COMPARE_URL="https://github.com/rongibori/aissisted/compare/main...$NEW_BRANCH?expand=1"
  echo "${YELLOW}→ gh CLI not installed. Open this URL manually:${RESET}"
  echo "  $COMPARE_URL"
  open "$COMPARE_URL"
fi

# ─── Return to original branch and restore stash ───────────────────────────
echo
echo "${BLUE}→ Returning to $ORIG_BRANCH...${RESET}"
git checkout -q "$ORIG_BRANCH"
if [[ "$STASHED" == "1" ]]; then
  echo "${BLUE}→ Restoring stashed work...${RESET}"
  git stash pop >/dev/null
fi

echo
echo "${GREEN}${BOLD}Done.${RESET}"
echo
read -n 1 -s -p "Press any key to close..."
