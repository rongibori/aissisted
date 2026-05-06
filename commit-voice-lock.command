#!/usr/bin/env bash
# commit-voice-lock.command — focused commit of the Jeffrey Voice Lock v1.1.
# Run from the canonical clone only. Does NOT push (per CLAUDE.md two-clone rule).

set -e

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$DIR"
clear

GREEN=$'\033[0;32m'; RED=$'\033[0;31m'; BLUE=$'\033[0;34m'
BOLD=$'\033[1m'; DIM=$'\033[2m'; RESET=$'\033[0m'

# Sanity: canonical clone only
if [[ "$DIR" != "/Users/rongibori/Documents/GitHub/aissisted" ]]; then
  echo "${RED}✗ Not in canonical clone. Bailing.${RESET}"
  echo "  Expected: /Users/rongibori/Documents/GitHub/aissisted"
  echo "  Got:      $DIR"
  read -n 1 -s -p "Press any key..."
  exit 1
fi

# Clean any stale lock
rm -f .git/index.lock 2>/dev/null

echo "${BOLD}${BLUE}→ Branch:${RESET} $(git rev-parse --abbrev-ref HEAD)"
echo "${BOLD}${BLUE}→ Files in this commit (voice lock only):${RESET}"

FILES=(
  "apps/landing/server.mjs"
  "apps/landing/api/jeffrey-realtime-token.ts"
  "apps/landing/preview.html"
  "apps/landing/package.json"
  "docs/specs/JEFFREY_VOICE_LOCK.md"
  "jeffrey-voice-deploy.command"
  "jeffrey-voice-ballad.command"
)

for f in "${FILES[@]}"; do
  if [[ -e "$f" ]]; then
    echo "  ${DIM}·${RESET} $f"
  fi
done

echo
git add "${FILES[@]}" 2>&1

echo
echo "${BOLD}${BLUE}→ Diff stat:${RESET}"
git diff --cached --stat

echo
echo "${BOLD}${BLUE}→ Committing...${RESET}"

git commit -m "Lock in Jeffrey Voice v1.1 — calm dial-up

Cedar voice + British RP, with two pacing knobs dialed up after
A/B against ballad and Ron's explicit ratification.

Changes (mirrored across server.mjs + jeffrey-realtime-token.ts):
- silence_duration_ms: 800 → 1000 (Jeffrey waits ~200ms longer)
- Voice block: 'Calm. Conversational.' → 'Calm. Unhurried. Conversational.'
- Voice block: Pace line adds 'Soften your volume a touch. Pause a beat
  between sentences. Let pauses breathe.'

Unchanged: voice ID (cedar), temperature (0.6, already at floor),
RP enforcement, persona, orchestrator, safety, eval coverage.

Ratified live by Ron at 7:16 PM PT on
journalism-expressed-array-mysterious.trycloudflare.com.

Spec: docs/specs/JEFFREY_VOICE_LOCK.md (now v1.1, §7 changelog)
Helpers: jeffrey-voice-deploy.command (cedar default),
         jeffrey-voice-ballad.command (A/B override, lock untouched)
"

echo
echo "${GREEN}${BOLD}✓ Committed locally.${RESET}"
echo
echo "${BOLD}Last 3 commits:${RESET}"
git log --oneline -3

echo
echo "${BOLD}This script intentionally does NOT push (per CLAUDE.md).${RESET}"
echo "${DIM}When ready, push with:  git push origin $(git rev-parse --abbrev-ref HEAD)${RESET}"
echo
read -n 1 -s -p "Press any key to close..."
