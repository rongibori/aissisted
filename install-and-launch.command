#!/usr/bin/env bash
# install-and-launch.command — pnpm install then launch web preview.
# Use after package.json deps change. Doesn't nuke node_modules.
set -e

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$DIR"
clear

RED=$'\033[0;31m'; GREEN=$'\033[0;32m'; YELLOW=$'\033[0;33m'
BLUE=$'\033[0;34m'; BOLD=$'\033[1m'; DIM=$'\033[2m'; RESET=$'\033[0m'

cat <<EOF
${RED}${BOLD}
   █████╗ ██╗███████╗███████╗██╗███████╗████████╗███████╗██████╗
  ██╔══██╗██║██╔════╝██╔════╝██║██╔════╝╚══██╔══╝██╔════╝██╔══██╗
  ███████║██║███████╗███████╗██║███████╗   ██║   █████╗  ██║  ██║
  ██╔══██║██║╚════██║╚════██║██║╚════██║   ██║   ██╔══╝  ██║  ██║
  ██║  ██║██║███████║███████║██║███████║   ██║   ███████╗██████╔╝
  ╚═╝  ╚═╝╚═╝╚══════╝╚══════╝╚═╝╚══════╝   ╚═╝   ╚══════╝╚═════╝
${RESET}${DIM}        Install new deps + relaunch web preview${RESET}

EOF

if ! command -v pnpm >/dev/null 2>&1; then
  echo "${RED}✗ pnpm not found.${RESET} Install: ${BOLD}npm i -g pnpm@10${RESET}"
  echo "Press any key to close..."; read -n 1 -s; exit 1
fi

# Kill anything on :3000 (the previous dev server is still running with stale deps)
if command -v lsof >/dev/null 2>&1; then
  pids=$(lsof -ti tcp:3000 2>/dev/null || true)
  if [[ -n "$pids" ]]; then
    echo "${YELLOW}→ Killing stale :3000 process ($pids)${RESET}"
    kill -9 $pids 2>/dev/null || true
    sleep 1
  fi
fi

echo "${BLUE}→ Running pnpm install (picks up new deps)...${RESET}"
pnpm install
echo "${GREEN}✓ Install complete${RESET}"
echo
echo "${BLUE}→ Launching web preview...${RESET}"
exec ./preview.sh web
