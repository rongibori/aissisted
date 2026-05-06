#!/usr/bin/env bash
# jeffrey-ai-system-preview.command — install new deps + start the Next.js dev
# server so you can view the Jeffrey AI System scaffold at:
#   http://localhost:3000/jeffrey-system
#
# v2: kills stragglers on :3000/:3001 before starting so Next.js always binds
# to :3000 cleanly, and passes -p 3000 explicitly so port assignment is
# deterministic.

set -e

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$DIR"
clear

GREEN=$'\033[0;32m'; RED=$'\033[0;31m'; BLUE=$'\033[0;34m'
YELLOW=$'\033[0;33m'; BOLD=$'\033[1m'; DIM=$'\033[2m'; RESET=$'\033[0m'

cat <<EOF
${BLUE}${BOLD}
   AISSISTED · Jeffrey AI System
   Preview launcher — installs R3F + Three.js + Framer Motion,
   then starts the Next.js dev server.
${RESET}

EOF

# ─── 0. Kill stale processes on :3000 / :3001 ───────────────────────────────
# Past sessions left dev servers running on these ports. Without cleaning them
# Next.js falls back to :3001/:3002 and the launcher's auto-open URL stops
# matching what's actually running.
for PORT in 3000 3001; do
  if command -v lsof >/dev/null 2>&1; then
    PIDS=$(lsof -ti tcp:$PORT 2>/dev/null || true)
    if [[ -n "$PIDS" ]]; then
      echo "${YELLOW}→ Killing stale process on :$PORT (pid $PIDS)${RESET}"
      kill -9 $PIDS 2>/dev/null || true
      sleep 0.5
    fi
  fi
done

# ─── 1. Install new deps via pnpm at repo root ─────────────────────────────
echo "${BLUE}→ Installing dependencies (R3F, Three.js, drei, framer-motion)...${RESET}"
echo "${DIM}   This pulls only what's needed; existing packages are reused.${RESET}"
echo

if ! command -v pnpm >/dev/null 2>&1; then
  echo "${RED}✗ pnpm not installed. Install via: brew install pnpm${RESET}"
  read -n 1 -s -p "Press any key..."
  exit 1
fi

pnpm install --filter @aissisted/web... --no-frozen-lockfile

# ─── 2. Start dev server ───────────────────────────────────────────────────
echo
echo "${GREEN}✓ Dependencies installed.${RESET}"
echo
echo "${BOLD}═════════════════════════════════════════════════════════════════════${RESET}"
echo "${BOLD}  When the server is up, open:${RESET}"
echo "${BOLD}    ${BLUE}http://localhost:3000/jeffrey-system${RESET}"
echo "${BOLD}═════════════════════════════════════════════════════════════════════${RESET}"
echo

# Auto-open the URL ~5s after starting (gives Next time to bind the port)
(sleep 5 && open "http://localhost:3000/jeffrey-system") &

cd apps/web
exec pnpm next dev -p 3000
