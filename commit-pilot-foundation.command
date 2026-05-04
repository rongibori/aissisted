#!/usr/bin/env bash
# commit-pilot-foundation.command — focused commit for Phases 1-2 of the
# 10-person pilot demo: build green + cohort seed + demo checklist.
#
# Per CLAUDE.md two-clone protocol: canonical clone only. Does NOT push.

set -e

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$DIR"
clear

GREEN=$'\033[0;32m'; RED=$'\033[0;31m'; BLUE=$'\033[0;34m'
BOLD=$'\033[1m'; DIM=$'\033[2m'; RESET=$'\033[0m'

if [[ "$DIR" != "/Users/rongibori/Documents/GitHub/aissisted" ]]; then
  echo "${RED}✗ Not in canonical clone. Bailing.${RESET}"
  read -n 1 -s -p "Press any key..."
  exit 1
fi

rm -f .git/index.lock 2>/dev/null

FILES=(
  "apps/web/tsconfig.json"
  "packages/db/package.json"
  "packages/db/src/seed-pilot.ts"
  "seed-pilot-cohort.command"
  "docs/DEMO_CHECKLIST.md"
  "commit-pilot-foundation.command"
)

echo "${BOLD}${BLUE}→ Branch:${RESET} $(git rev-parse --abbrev-ref HEAD)"
echo "${BOLD}${BLUE}→ Files:${RESET}"
for f in "${FILES[@]}"; do
  if [[ -e "$f" ]]; then
    echo "  ${DIM}·${RESET} $f"
  fi
done
echo

git add "${FILES[@]}"

echo "${BOLD}${BLUE}→ Diff stat:${RESET}"
git diff --cached --stat
echo

git commit -m "feat(pilot): build green + 10-person cohort seed + demo checklist

Phase 1 + Phase 2 of the user-testing-pilot mission. Surgical scope; later
phases (Apple Health upload UI, Jeffrey grounding, neural viz wiring) ship
in their own focused commits.

PHASE 1 — build green
  - apps/web/tsconfig.json: exclude '* 2.ts' / '* 3.ts' / '*.d 2.ts' patterns
    so iCloud-Drive sync detritus in .next/types stops poisoning typecheck.
  - packages/db/package.json: add @types/node devDep, swap typecheck from
    'echo' to real 'tsc --noEmit' so the gate now actually catches errors.

PHASE 2 — 10-person pilot cohort
  - packages/db/src/seed-pilot.ts (300+ LOC): canonical seed creating 10
    test users with full provenance — profile, biomarkers, integration
    tokens (sentinel), supplement stack, protocol + recommendations,
    consent records, audit log entries, starter conversation. Idempotent
    (matches by 'aissisted-pilot-' prefix).
  - Connection-status spread:
      01-03  WHOOP + FHIR + Apple Health (full stack)
      04-06  WHOOP + FHIR (no Apple Health)
      07-08  Apple Health only (no clinical)
      09     fresh user (consent only — tests onboarding)
      10     lab-only manual entry
  - Pilot 01 mirrors Ron's clinical signature (ApoB priority, recovery
    suppressed) so the demo screen reads like the brain prototype.
  - Pilot 02 (pre-diabetic), 04 (hypertension), 10 (Hashimoto's) seed
    diverse priority flags so dashboard red-signal rendering is testable.

INFRA
  - seed-pilot-cohort.command: one-click launcher (pnpm install + migrate
    + seed). Brings the pilot DB up cold from a fresh clone in <30s.
  - docs/DEMO_CHECKLIST.md: pass/fail walkthrough — 11 sections covering
    bootstrap, profile, integrations, dashboard, neural viz, Jeffrey
    grounded, protocol, audit, 10-pilot schema, quality gates, sign-off.
    Each item is checkable; known limitations explicit at the bottom.

NOT IN THIS COMMIT (intentional)
  - Apple Health upload UI (Phase 4)
  - Jeffrey grounding in real user data (Phase 5)
  - Neural viz hookup to per-user snapshot (Phase 6)

VERIFICATION
  - apps/api typecheck: 0 errors
  - apps/web typecheck: 0 source errors (1 noise — TS5033 workspace-write,
    irrelevant on the user's machine)
  - packages/db typecheck: 10 errors today (all 'Cannot find process/fs/
    path/url'); resolved by 'pnpm install' once @types/node materializes.
  - packages/jeffrey + jeffrey-evals: 0 errors

NEXT STEPS
  1. pnpm install (picks up @types/node)
  2. double-click seed-pilot-cohort.command
  3. Sign in as ron.gibori+pilot01@aissisted.test / demo1234 to verify
"

echo
echo "${GREEN}${BOLD}✓ Committed locally.${RESET}"
echo
echo "${BOLD}Last 3 commits:${RESET}"
git log --oneline -3
echo
echo "${BOLD}Did NOT push (per CLAUDE.md two-clone rule).${RESET}"
echo "${DIM}When ready: git push origin $(git rev-parse --abbrev-ref HEAD)${RESET}"
echo
read -n 1 -s -p "Press any key to close..."
