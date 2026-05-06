#!/usr/bin/env bash
# fix-stale-next-and-restart.command — nuke the corrupted .next/ build cache,
# kill any stale dev servers, then restart Next.js cleanly on :3000.
#
# Symptom this fixes: ENOENT no such file or directory, open
#   '/.../apps/web/.next/server/app/login/page.js' (or any other route)
#
# Cause: .next/ got into an inconsistent state — usually after iCloud sync
# duplicates files mid-build, or the dev server got killed between the
# manifest write and the chunk write. Cleanest recovery is full nuke.

set -e

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$DIR"
clear

GREEN=$'\033[0;32m'; RED=$'\033[0;31m'; BLUE=$'\033[0;34m'
YELLOW=$'\033[0;33m'; BOLD=$'\033[1m'; DIM=$'\033[2m'; RESET=$'\033[0m'

cat <<EOF
${BLUE}${BOLD}
   AISSISTED · Next.js Recovery
   1. Kill stale processes on :3000 / :3001
   2. Nuke apps/web/.next  (regenerated on next dev)
   3. Restart pnpm next dev on :3000
${RESET}

EOF

# ─── 1. Kill stale processes ──────────────────────────────────────────────
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

# ─── 2. Nuke .next/ (also clean tsconfig.tsbuildinfo) ─────────────────────
echo "${BLUE}→ Nuking apps/web/.next/ ...${RESET}"
rm -rf apps/web/.next
rm -f apps/web/tsconfig.tsbuildinfo
echo "${GREEN}  ✓ cleared${RESET}"

# Also clean any iCloud-Drive duplicate files that may have re-spawned in source
# directories. These pollute the type include and break tsc.
echo "${BLUE}→ Sweeping iCloud Drive duplicate files...${RESET}"
SWEPT=$(find apps/web/app apps/web/components apps/web/lib -type f \( -name "* 2.ts" -o -name "* 2.tsx" -o -name "* 3.ts" -o -name "* 3.tsx" -o -name "*.d 2.ts" -o -name "*.d 3.ts" \) 2>/dev/null | wc -l | tr -d ' ')
if [[ "$SWEPT" != "0" ]]; then
  find apps/web/app apps/web/components apps/web/lib -type f \( -name "* 2.ts" -o -name "* 2.tsx" -o -name "* 3.ts" -o -name "* 3.tsx" -o -name "*.d 2.ts" -o -name "*.d 3.ts" \) -delete 2>/dev/null || true
  echo "${YELLOW}  ✓ swept $SWEPT iCloud duplicate files${RESET}"
else
  echo "${DIM}  (none found)${RESET}"
fi

# ─── 3. Restart dev server ────────────────────────────────────────────────
if ! command -v pnpm >/dev/null 2>&1; then
  echo "${RED}✗ pnpm not installed. brew install pnpm${RESET}"
  read -n 1 -s -p "Press any key..."
  exit 1
fi

echo
echo "${BOLD}═════════════════════════════════════════════════════════════════════${RESET}"
echo "${BOLD}  Server is starting at:${RESET}"
echo "${BOLD}    ${BLUE}http://localhost:3000/login${RESET}"
echo "${BOLD}═════════════════════════════════════════════════════════════════════${RESET}"
echo
echo "${DIM}First compile takes 15-30s while .next/ rebuilds. Be patient.${RESET}"
echo

# Auto-open after the dev server has had time to bind + first-compile
(sleep 8 && open "http://localhost:3000/login") &

cd apps/web
exec pnpm next dev -p 3000
