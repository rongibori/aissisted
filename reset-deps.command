#!/usr/bin/env bash
# reset-deps.command — nuke node_modules and reinstall from scratch.
# Use this when iCloud Drive has corrupted node_modules with " 2" duplicates
# and 0-byte placeholders, or any time pnpm install seems wedged.
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
${RESET}${DIM}             Dependency Reset — clean reinstall${RESET}

EOF

if ! command -v pnpm >/dev/null 2>&1; then
  echo "${RED}✗ pnpm not found.${RESET} Install with: ${BOLD}npm i -g pnpm@10${RESET}"
  echo "Press any key to close..."
  read -n 1 -s
  exit 1
fi

echo "${YELLOW}⚠ Resetting dependencies in 3 seconds...${RESET}"
echo "  Will delete:"
echo "    • $DIR/node_modules"
echo "    • $DIR/apps/*/node_modules"
echo "    • $DIR/packages/*/node_modules"
echo "  Then run pnpm install (1–3 min, needs internet)."
echo "  ${DIM}Ctrl+C now to abort.${RESET}"
sleep 3

echo
echo "${BLUE}→ Removing node_modules trees...${RESET}"
rm -rf node_modules apps/*/node_modules packages/*/node_modules
echo "${GREEN}✓ Cleaned${RESET}"
echo
echo "${BLUE}→ Running pnpm install (this is the slow step)...${RESET}"
pnpm install
echo
echo "${GREEN}${BOLD}✓ Reinstall complete.${RESET}"
echo
echo "${YELLOW}LONG-TERM FIX:${RESET} this repo lives in iCloud Drive, which renames"
echo "files during sync conflicts and breaks node_modules. Move it out:"
echo "  ${BOLD}mkdir -p ~/Code && mv \"$DIR\" ~/Code/aissisted${RESET}"
echo
echo "Now you can double-click ${BOLD}preview-web.command${RESET} to launch the app."
echo
echo "Press any key to close..."
read -n 1 -s
