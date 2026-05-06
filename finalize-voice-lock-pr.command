#!/usr/bin/env bash
# finalize-voice-lock-pr.command — open the PR for voice-lock-v1.1 and
# return to the original branch. Recovers from the heredoc bug in
# extract-voice-lock-pr.command.

set -e

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$DIR"
clear

GREEN=$'\033[0;32m'; RED=$'\033[0;31m'; BLUE=$'\033[0;34m'
YELLOW=$'\033[0;33m'; BOLD=$'\033[1m'; DIM=$'\033[2m'; RESET=$'\033[0m'

if [[ "$DIR" != "/Users/rongibori/Documents/GitHub/aissisted" ]]; then
  echo "${RED}Wrong clone. Bailing.${RESET}"
  read -n 1 -s
  exit 1
fi

CURRENT=$(git rev-parse --abbrev-ref HEAD)
echo "${BOLD}${BLUE}Current branch:${RESET} $CURRENT"
echo

# Write PR body to a temp file (no heredoc-in-script trouble)
BODY_FILE=$(mktemp)
cat > "$BODY_FILE" <<'PRBODY'
Cedar voice + British RP, with two pacing knobs dialed up after A/B against ballad and Ron's explicit ratification.

## Changes

Mirrored across apps/landing/server.mjs and apps/landing/api/jeffrey-realtime-token.ts.

| Knob | v1 | v1.1 | Effect |
|------|----|------|--------|
| silence_duration_ms | 800 | 1000 | Jeffrey waits ~200ms longer before responding |
| Voice block — Calm. Conversational. | unchanged | Calm. Unhurried. Conversational. | Adds 'unhurried' anchor |
| Voice block — Pace line | unchanged | + Soften your volume a touch. Pause a beat between sentences. Let pauses breathe. | Pushes toward gentler, more spaced delivery |

## Unchanged

- voice ID: cedar (still locked)
- temperature: 0.6 (already at floor)
- British RP enforcement
- Persona, orchestrator, safety, eval coverage

## Ratification

Ron sign-off live on journalism-expressed-array-mysterious.trycloudflare.com at 7:16 PM PT, 2026-05-03.

## Spec

docs/specs/JEFFREY_VOICE_LOCK.md bumped to v1.1 with section 7 changelog.

## Helpers

- jeffrey-voice-deploy.command — cedar default launcher
- jeffrey-voice-ballad.command — A/B override (lock untouched)
- commit-voice-lock.command, extract-voice-lock-pr.command, finalize-voice-lock-pr.command — focused commit + PR helpers used to land this PR

## Scope

Surgical. 7 files, all directly in the voice-lock domain.
PRBODY

echo "${BLUE}Opening PR via gh CLI...${RESET}"

if ! command -v gh >/dev/null 2>&1; then
  echo "${YELLOW}gh CLI not installed. Opening web URL instead:${RESET}"
  URL="https://github.com/rongibori/aissisted/compare/main...voice-lock-v1.1?expand=1"
  open "$URL"
else
  EXISTING=$(gh pr list --head voice-lock-v1.1 --json url --jq '.[0].url' 2>/dev/null || echo "")
  if [[ -n "$EXISTING" ]]; then
    echo "${BOLD}${GREEN}PR already exists:${RESET} $EXISTING"
    open "$EXISTING"
  else
    PR_URL=$(gh pr create \
      --base main \
      --head voice-lock-v1.1 \
      --title "Lock in Jeffrey Voice v1.1 — calm dial-up" \
      --body-file "$BODY_FILE")
    echo "${GREEN}${BOLD}PR opened:${RESET} $PR_URL"
    open "$PR_URL"
  fi
fi

rm -f "$BODY_FILE"

# Switch back to the previous branch if we're stuck on voice-lock-v1.1
if [[ "$CURRENT" == "voice-lock-v1.1" ]]; then
  echo
  echo "${BLUE}Switching back to claude/implement-onboarding-cover-uqkFR...${RESET}"
  git checkout claude/implement-onboarding-cover-uqkFR 2>&1 | tail -3 || true
  # Pop any stash that might have been left behind
  if git stash list | grep -q "auto-stash before voice-lock"; then
    echo "${BLUE}Restoring stashed work...${RESET}"
    git stash pop 2>&1 | tail -3 || true
  fi
fi

echo
echo "${GREEN}${BOLD}Done.${RESET}"
echo
read -n 1 -s -p "Press any key to close..."
