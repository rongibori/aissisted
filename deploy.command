#!/usr/bin/env bash
# deploy.command — one-click deploy of the functional design prototype.
#
# Two deploy targets, in order of preference:
#   1. Vercel (production)  — needs `vercel` CLI + prior `vercel login`
#   2. Local share          — opens a public tunnel via npx (cloudflared)
#
# Usage:
#   double-click → deploys to Vercel prod (or prompts to authenticate)
#   ./deploy.command preview        → preview URL (not aliased to prod)
#   ./deploy.command tunnel         → quick public tunnel for live demo
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
${RESET}${DIM}                  Functional Design Deploy${RESET}

EOF

MODE="${1:-prod}"

# Sanity: prototype exists in apps/landing
if [[ ! -f apps/landing/preview.html ]]; then
  echo "${YELLOW}→ Syncing aissisted-app.html → apps/landing/preview.html${RESET}"
  cp aissisted-app.html apps/landing/preview.html
fi

case "$MODE" in
  tunnel)
    echo "${BLUE}→ Quick tunnel (cloudflared) — public URL in 5s${RESET}"
    echo "${DIM}  Serves apps/landing/ on localhost:8787, then exposes via cloudflared.${RESET}"
    echo
    if ! command -v python3 >/dev/null 2>&1; then
      echo "${RED}✗ python3 needed for the local server.${RESET}"; exit 1
    fi
    # Start static server in background
    python3 -m http.server 8787 --directory apps/landing &
    SERVER_PID=$!
    trap "kill $SERVER_PID 2>/dev/null || true" EXIT
    sleep 1
    echo "${GREEN}✓ Local server up at http://localhost:8787/preview${RESET}"
    echo "${BLUE}→ Opening cloudflared tunnel (download on first run, ~5MB)...${RESET}"
    npx --yes cloudflared@latest tunnel --url http://localhost:8787
    ;;

  preview|prod)
    if ! command -v vercel >/dev/null 2>&1; then
      echo "${YELLOW}→ Vercel CLI not found. Installing globally...${RESET}"
      npm i -g vercel
    fi

    echo "${BLUE}→ Deploying apps/landing/ to Vercel${RESET}"
    cd apps/landing

    # If never logged in, this prompts in-terminal.
    # Already logged in? It just deploys.
    if [[ "$MODE" = "prod" ]]; then
      echo "${BLUE}  Mode: PRODUCTION (--prod)${RESET}"
      vercel --prod --yes
    else
      echo "${BLUE}  Mode: PREVIEW${RESET}"
      vercel --yes
    fi

    cat <<INFO

${GREEN}${BOLD}✓ Deploy command sent.${RESET}

  • Production URL: ${BOLD}https://aissisted.me/preview${RESET}
  • Static prototype: served from apps/landing/preview.html
  • Vercel auto-builds on push to main if the project is linked

If this was your first ever vercel login, the URL above might not be linked yet —
copy the deployment URL Vercel just printed and alias it to aissisted.me from
${DIM}https://vercel.com/<your-team>/<project>/settings/domains${RESET}

INFO
    ;;

  *)
    echo "${RED}Unknown mode: $MODE${RESET}"
    echo "Usage: ./deploy.command [prod|preview|tunnel]"
    exit 1
    ;;
esac

echo
echo "Press any key to close..."
read -n 1 -s
