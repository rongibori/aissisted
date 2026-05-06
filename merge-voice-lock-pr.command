#!/usr/bin/env bash
# merge-voice-lock-pr.command — squash-merge PR #65 (Voice Lock v1.1) into main.
# Then return the local clone to claude/implement-onboarding-cover-uqkFR.

set -e

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$DIR"
clear

GREEN=$'\033[0;32m'; RED=$'\033[0;31m'; BLUE=$'\033[0;34m'
YELLOW=$'\033[0;33m'; BOLD=$'\033[1m'; RESET=$'\033[0m'

if [[ "$DIR" != "/Users/rongibori/Documents/GitHub/aissisted" ]]; then
  echo "${RED}Wrong clone. Bailing.${RESET}"
  read -n 1 -s
  exit 1
fi

if ! command -v gh >/dev/null 2>&1; then
  echo "${RED}gh CLI required but not installed. Merge via web UI:${RESET}"
  echo "  https://github.com/rongibori/aissisted/pull/65"
  read -n 1 -s
  exit 1
fi

PR_NUMBER=65

echo "${BOLD}${BLUE}Pre-merge status for PR #$PR_NUMBER:${RESET}"
gh pr view $PR_NUMBER --json state,mergeable,mergeStateStatus,title --jq '"  \(.title)\n  state: \(.state)  ·  mergeable: \(.mergeable)  ·  status: \(.mergeStateStatus)"'
echo

echo "${BLUE}Squash-merging PR #$PR_NUMBER into main + deleting voice-lock-v1.1 branch...${RESET}"
gh pr merge $PR_NUMBER --squash --delete-branch --auto 2>&1

echo
echo "${GREEN}${BOLD}Merge command sent.${RESET}"
echo "${BLUE}If checks were still running, --auto will merge once they pass.${RESET}"
echo

# Update local main and return to original branch
echo "${BLUE}Pulling main + returning to claude/implement-onboarding-cover-uqkFR...${RESET}"
git fetch origin main 2>&1 | tail -2
CURRENT=$(git rev-parse --abbrev-ref HEAD)
if [[ "$CURRENT" == "voice-lock-v1.1" ]]; then
  git checkout claude/implement-onboarding-cover-uqkFR 2>&1 | tail -2
fi
# Delete the local voice-lock-v1.1 branch (remote already gone via --delete-branch)
git branch -D voice-lock-v1.1 2>/dev/null || true

# Restore any auto-stash
if git stash list | grep -q "auto-stash before voice-lock"; then
  echo "${BLUE}Restoring stashed work...${RESET}"
  git stash pop 2>&1 | tail -2 || true
fi

echo
echo "${BOLD}Final status:${RESET}"
gh pr view $PR_NUMBER --json state,mergedAt,mergeCommit --jq '"  state: \(.state)  ·  merged: \(.mergedAt // "pending")  ·  commit: \(.mergeCommit.oid // "—")"' 2>&1

echo
read -n 1 -s -p "Press any key to close..."
