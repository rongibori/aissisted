#!/usr/bin/env bash
# push-voice-lock.command — push the voice lock commit + open a PR.
#
# Per CLAUDE.md: canonical clone only. This script bails if run elsewhere.
# Pushes the current branch to origin, then opens a PR via `gh` CLI if
# available. Falls back to printing the compare URL if gh isn't set up.

set -e

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$DIR"
clear

GREEN=$'\033[0;32m'; RED=$'\033[0;31m'; BLUE=$'\033[0;34m'
YELLOW=$'\033[0;33m'; BOLD=$'\033[1m'; DIM=$'\033[2m'; RESET=$'\033[0m'

# ─── Sanity: canonical clone ────────────────────────────────────────────────
if [[ "$DIR" != "/Users/rongibori/Documents/GitHub/aissisted" ]]; then
  echo "${RED}✗ Not in canonical clone. Bailing.${RESET}"
  echo "  Expected: /Users/rongibori/Documents/GitHub/aissisted"
  echo "  Got:      $DIR"
  read -n 1 -s -p "Press any key..."
  exit 1
fi

BRANCH=$(git rev-parse --abbrev-ref HEAD)
HEAD_SHA=$(git rev-parse --short HEAD)

echo "${BOLD}${BLUE}→ Branch:${RESET} $BRANCH"
echo "${BOLD}${BLUE}→ HEAD:${RESET}   $HEAD_SHA — $(git log -1 --pretty=%s)"
echo

# ─── 1. Fetch latest origin to know what's already pushed ──────────────────
echo "${BLUE}→ Fetching origin...${RESET}"
git fetch origin

# What this push will actually add to origin/$BRANCH
COMMITS_AHEAD=$(git log --oneline origin/$BRANCH..HEAD 2>/dev/null | wc -l | tr -d ' ' || echo "?")
if [[ "$COMMITS_AHEAD" == "0" ]]; then
  echo "${YELLOW}→ origin/$BRANCH is already at HEAD. Nothing to push.${RESET}"
else
  echo "${BOLD}→ Commits this push will publish:${RESET}"
  git log --oneline origin/$BRANCH..HEAD 2>/dev/null || git log --oneline -3
fi
echo

# ─── 2. Push ────────────────────────────────────────────────────────────────
if [[ "$COMMITS_AHEAD" != "0" ]]; then
  echo "${BLUE}→ Pushing $BRANCH to origin...${RESET}"
  git push origin "$BRANCH"
  echo "${GREEN}✓ Pushed.${RESET}"
  echo
fi

# ─── 3. Open PR via gh CLI if available ─────────────────────────────────────
if command -v gh >/dev/null 2>&1; then
  # Check if PR already exists for this branch
  EXISTING_PR=$(gh pr list --head "$BRANCH" --json url --jq '.[0].url' 2>/dev/null || echo "")
  if [[ -n "$EXISTING_PR" ]]; then
    echo "${BOLD}${GREEN}✓ PR already open:${RESET} $EXISTING_PR"
    open "$EXISTING_PR"
  else
    echo "${BLUE}→ Opening PR via gh CLI...${RESET}"
    PR_URL=$(gh pr create \
      --base main \
      --head "$BRANCH" \
      --title "Lock in Jeffrey Voice v1.1 — calm dial-up" \
      --body "Cedar voice + British RP, with two pacing knobs dialed up after A/B against ballad and Ron's explicit ratification.

## Changes

Mirrored across \`server.mjs\` + \`jeffrey-realtime-token.ts\`:

| Knob | v1 | v1.1 | Effect |
|---|---|---|---|
| \`silence_duration_ms\` | \`800\` | \`1000\` | Jeffrey waits ~200ms longer before responding |
| Voice block — \`Calm. Conversational.\` | unchanged | \`Calm. Unhurried. Conversational.\` | Adds 'unhurried' anchor |
| Voice block — Pace line | unchanged | + \`Soften your volume a touch. Pause a beat between sentences. Let pauses breathe.\` | Pushes toward gentler, more spaced delivery |

## Unchanged
- \`voice: cedar\` (still locked)
- \`temperature: 0.6\` (already at floor)
- British RP enforcement
- Persona, orchestrator, safety, eval coverage

## Ratification
Ron sign-off live on \`journalism-expressed-array-mysterious.trycloudflare.com\` at 7:16 PM PT, 2026-05-03.

## Spec
\`docs/specs/JEFFREY_VOICE_LOCK.md\` bumped to v1.1 with §7 changelog.

## Helpers
- \`jeffrey-voice-deploy.command\` — cedar default launcher
- \`jeffrey-voice-ballad.command\` — A/B override (lock untouched, env-var only)
- \`commit-voice-lock.command\` — focused-commit helper used to land this PR
" 2>&1)
    echo "$PR_URL"
    if [[ "$PR_URL" =~ https:// ]]; then
      URL=$(echo "$PR_URL" | grep -oE 'https://[^ ]+' | head -1)
      echo
      echo "${GREEN}${BOLD}✓ PR opened:${RESET} $URL"
      open "$URL"
    fi
  fi
else
  REPO_URL="https://github.com/rongibori/aissisted/compare/main...$BRANCH?expand=1"
  echo "${YELLOW}→ gh CLI not installed. Open this URL to create the PR manually:${RESET}"
  echo "  $REPO_URL"
  open "$REPO_URL"
fi

echo
read -n 1 -s -p "Press any key to close..."
