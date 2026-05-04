#!/usr/bin/env bash
# seed-pilot-cohort.command — install deps + run the 10-person pilot seed.
# Result: a SQLite DB with 10 fully-provisioned users for the user-testing pilot.

set -e

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$DIR"
clear

GREEN=$'\033[0;32m'; RED=$'\033[0;31m'; BLUE=$'\033[0;34m'
YELLOW=$'\033[0;33m'; BOLD=$'\033[1m'; DIM=$'\033[2m'; RESET=$'\033[0m'

cat <<EOF
${BLUE}${BOLD}
   AISSISTED · Pilot Cohort Seed
   Creates 10 test profiles with full provenance (profile,
   biomarkers, integrations, protocol, stack, conversation, audit log).
${RESET}

EOF

if ! command -v pnpm >/dev/null 2>&1; then
  echo "${RED}✗ pnpm not installed. brew install pnpm${RESET}"
  read -n 1 -s -p "Press any key..."
  exit 1
fi

# ─── 1. Install (picks up the new @types/node dep) ────────────────────────
echo "${BLUE}→ Installing dependencies (pulls @types/node into packages/db)…${RESET}"
pnpm install --filter @aissisted/db... --no-frozen-lockfile

# ─── 2. Run any pending migrations so the DB has all 13 tables ───────────
echo
echo "${BLUE}→ Running migrations…${RESET}"
pnpm --filter @aissisted/db db:migrate || {
  echo "${YELLOW}  Migration step skipped or already up to date.${RESET}"
}

# ─── 3. Seed the cohort ──────────────────────────────────────────────────
echo
echo "${BLUE}→ Seeding pilot cohort…${RESET}"
pnpm --filter @aissisted/db seed:pilot

# ─── 4. Done ──────────────────────────────────────────────────────────────
echo
echo "${GREEN}${BOLD}✓ Pilot cohort ready.${RESET}"
echo
echo "${BOLD}Login any pilot user:${RESET}"
echo "  email:    {firstname.lastname}+pilotNN@aissisted.test  (NN = 01..10)"
echo "  password: ${BOLD}demo1234${RESET}"
echo
echo "${BOLD}Cohort spread:${RESET}"
echo "  ${DIM}01-03  full stack (WHOOP + FHIR + Apple Health)${RESET}"
echo "  ${DIM}04-06  WHOOP + FHIR${RESET}"
echo "  ${DIM}07-08  Apple Health only${RESET}"
echo "  ${DIM}09     fresh user, consent only${RESET}"
echo "  ${DIM}10     lab-only manual entry${RESET}"
echo
echo "${BOLD}DB file:${RESET}"
echo "  apps/api/data/aissisted.db   (override via DATABASE_URL env var)"
echo
read -n 1 -s -p "Press any key to close..."
