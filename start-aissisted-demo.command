#!/usr/bin/env bash
# start-aissisted-demo.command — boot the FULL local demo:
#   • apps/api (Fastify) on :4000   — auth, biomarkers, integrations, jeffrey
#   • apps/web (Next.js)  on :3000   — sign-in / dashboard / labs / chat
#
# Runs both in the same Terminal window. Closing the window or Ctrl+C brings
# both down cleanly via the cleanup trap. Auto-opens /login when ready.

set -e

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$DIR"
clear

GREEN=$'\033[0;32m'; RED=$'\033[0;31m'; BLUE=$'\033[0;34m'
YELLOW=$'\033[0;33m'; BOLD=$'\033[1m'; DIM=$'\033[2m'; RESET=$'\033[0m'

cat <<EOF
${BLUE}${BOLD}
   AISSISTED · Full Demo Stack
   API  on :4000  (Fastify · auth · biomarkers · integrations · Jeffrey)
   Web  on :3000  (Next.js · sign-in · dashboard · labs · chat)
${RESET}

EOF

if ! command -v pnpm >/dev/null 2>&1; then
  echo "${RED}✗ pnpm not installed. brew install pnpm${RESET}"
  read -n 1 -s -p "Press any key..."
  exit 1
fi

# ─── 1. Kill stale processes on every relevant port ─────────────────────
for PORT in 3000 3001 4000; do
  if command -v lsof >/dev/null 2>&1; then
    PIDS=$(lsof -ti tcp:$PORT 2>/dev/null || true)
    if [[ -n "$PIDS" ]]; then
      echo "${YELLOW}→ Killing stale process on :$PORT (pid $PIDS)${RESET}"
      kill -9 $PIDS 2>/dev/null || true
      sleep 0.5
    fi
  fi
done

# ─── 2. Pre-flight checks ───────────────────────────────────────────────
if [[ ! -f apps/api/.env && ! -f .env ]]; then
  echo "${YELLOW}⚠ No apps/api/.env found.${RESET}"
  echo "${DIM}  Auth + Jeffrey will work in default-secret dev mode but you${RESET}"
  echo "${DIM}  won't have OpenAI integration. To enable Jeffrey voice, drop${RESET}"
  echo "${DIM}  OPENAI_API_KEY=sk-... into apps/api/.env and restart.${RESET}"
  echo
fi

# Make sure deps are installed (idempotent — fast if already done)
echo "${BLUE}→ Verifying dependencies...${RESET}"
pnpm install --no-frozen-lockfile > /tmp/aissisted-install.log 2>&1 || {
  echo "${RED}✗ pnpm install failed. See /tmp/aissisted-install.log${RESET}"
  tail -20 /tmp/aissisted-install.log
  read -n 1 -s -p "Press any key..."
  exit 1
}
echo "${GREEN}✓ deps ok${RESET}"

# ─── 3. Lock the DB to one canonical path so every process hits the same file
# Without this, `pnpm --filter @aissisted/db db:migrate` would create
# packages/db/data/aissisted.db (relative to its own CWD) while apps/api
# starts at apps/api/data/aissisted.db — two different files, no shared schema.
export DATABASE_URL="file:${DIR}/apps/api/data/aissisted.db"
echo "${BLUE}→ DB path:${RESET} $DATABASE_URL"

# Wipe an empty/zero-byte DB so migrations can lay down the schema cleanly.
DB_FILE="${DIR}/apps/api/data/aissisted.db"
mkdir -p "$(dirname "$DB_FILE")"
if [[ -f "$DB_FILE" && ! -s "$DB_FILE" ]]; then
  echo "${YELLOW}  Empty DB found — removing so migrate recreates with schema${RESET}"
  rm -f "$DB_FILE"
fi

# ─── 4. Run migrations / schema push ────────────────────────────────────
echo "${BLUE}→ Applying schema (drizzle-kit push for SQLite)...${RESET}"
# `db:push` is the canonical SQLite path — it applies schema directly from
# packages/db/src/schema.ts without needing the journal/migrate path. This
# matches the comment at the top of packages/db/src/migrate.ts.
pnpm --filter @aissisted/db db:push 2>&1 | tail -10 || {
  echo "${YELLOW}  db:push reported nothing to do, trying db:migrate instead${RESET}"
  pnpm --filter @aissisted/db db:migrate 2>&1 | tail -10
}

# Verify the users table actually exists
if command -v sqlite3 >/dev/null 2>&1; then
  TABLE_COUNT=$(sqlite3 "$DB_FILE" "SELECT COUNT(*) FROM sqlite_master WHERE type='table';" 2>/dev/null || echo "0")
  echo "${BLUE}  → ${TABLE_COUNT} tables in DB${RESET}"
  if [[ "$TABLE_COUNT" -lt "5" ]]; then
    echo "${RED}  ✗ schema looks incomplete${RESET}"
  else
    echo "${GREEN}  ✓ schema applied${RESET}"
  fi
fi

# ─── 4. Sweep iCloud Drive duplicate files that pollute .next/ ──────────
echo "${BLUE}→ Sweeping iCloud Drive duplicates in apps/web/...${RESET}"
SWEPT=$(find apps/web/app apps/web/components apps/web/lib -type f \( -name "* 2.ts" -o -name "* 2.tsx" -o -name "* 3.ts" -o -name "* 3.tsx" -o -name "*.d 2.ts" -o -name "*.d 3.ts" \) 2>/dev/null | wc -l | tr -d ' ')
if [[ "$SWEPT" != "0" ]]; then
  find apps/web/app apps/web/components apps/web/lib -type f \( -name "* 2.ts" -o -name "* 2.tsx" -o -name "* 3.ts" -o -name "* 3.tsx" -o -name "*.d 2.ts" -o -name "*.d 3.ts" \) -delete 2>/dev/null || true
  echo "${YELLOW}  ✓ swept $SWEPT files${RESET}"
fi

# Nuke .next/ to avoid stale-manifest ENOENT errors
rm -rf apps/web/.next 2>/dev/null || true
rm -f apps/web/tsconfig.tsbuildinfo 2>/dev/null || true

# ─── 5. Start apps/api in the background ────────────────────────────────
echo
echo "${BLUE}→ Starting apps/api on :4000...${RESET}"
mkdir -p .preview-logs
(cd apps/api && pnpm dev > "$DIR/.preview-logs/api.log" 2>&1) &
API_PID=$!

# Wait for API to be reachable
echo -n "${DIM}  Waiting for API to bind...${RESET} "
for i in 1 2 3 4 5 6 7 8 9 10 11 12 13 14 15; do
  if curl -sf http://localhost:4000/health >/dev/null 2>&1; then
    echo "${GREEN}✓${RESET}"
    break
  fi
  sleep 0.5
  echo -n "."
done
if ! curl -sf http://localhost:4000/health >/dev/null 2>&1; then
  echo
  echo "${RED}✗ API did not come up in time. Tail of api.log:${RESET}"
  tail -20 .preview-logs/api.log
  echo "${DIM}Continuing anyway — Next.js will show 'fetch failed' until API is up.${RESET}"
fi

# Cleanup trap — kills both servers when this Terminal closes
cleanup() {
  echo
  echo "${YELLOW}→ Shutting down...${RESET}"
  kill $API_PID 2>/dev/null || true
  if [[ -n "$WEB_PID" ]]; then kill $WEB_PID 2>/dev/null || true; fi
}
trap cleanup EXIT INT TERM

# ─── 6. Auto-open browser to /login a few seconds after web starts ──────
(sleep 8 && open "http://localhost:3000/login") &

# ─── 7. Start apps/web in foreground (so the Terminal shows web logs) ──
echo
echo "${BOLD}═════════════════════════════════════════════════════════════════════${RESET}"
echo "${BOLD}  Demo URLs:${RESET}"
echo "    ${BLUE}http://localhost:3000/login${RESET}      ← sign in"
echo "    ${BLUE}http://localhost:3000/register${RESET}   ← create account"
echo "    ${BLUE}http://localhost:3000/dashboard${RESET}  ← post-login (after seed)"
echo "    ${BLUE}http://localhost:3000/jeffrey-system${RESET}   ← R3F neural viz"
echo "    ${BLUE}http://localhost:4000/health${RESET}     ← API health probe"
echo "${BOLD}═════════════════════════════════════════════════════════════════════${RESET}"
echo
echo "${DIM}If you haven't seeded the pilot cohort yet, run${RESET}"
echo "${DIM}seed-pilot-cohort.command in another window. Then sign in as:${RESET}"
echo "${DIM}  ron.gibori+pilot01@aissisted.test  /  demo1234${RESET}"
echo

cd apps/web
WEB_CMD_PID=$$
exec pnpm next dev -p 3000
