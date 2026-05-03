#!/usr/bin/env bash
# jeffrey-voice-deploy.command — full Jeffrey voice prototype, public URL.
#
# Stack:
#   1. Loads OPENAI_API_KEY from apps/api/.env
#   2. Runs apps/landing/server.mjs   (static + /api/jeffrey-realtime-token)
#   3. Opens cloudflared quick tunnel → public URL
#
# Result: a public URL where Jeffrey's voice modal actually talks back via
# OpenAI Realtime API (browser ↔ OpenAI WebRTC, server only mints tokens).
#
# Closes everything cleanly on Ctrl+C or when the Terminal window closes.
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
${RESET}${DIM}              Jeffrey Voice — full deploy${RESET}

EOF

# ─── 1. Load OPENAI_API_KEY from apps/api/.env (or current env) ─────────────
if [[ -z "$OPENAI_API_KEY" && -f apps/api/.env ]]; then
  echo "${BLUE}→ Sourcing OPENAI_API_KEY from apps/api/.env${RESET}"
  # Just OPENAI_API_KEY — don't blanket-source the whole file
  OPENAI_API_KEY=$(grep -E '^OPENAI_API_KEY=' apps/api/.env | head -1 | sed -E 's/^[^=]+=//; s/^"//; s/"$//')
  export OPENAI_API_KEY
fi

if [[ -z "$OPENAI_API_KEY" ]]; then
  echo "${RED}✗ OPENAI_API_KEY not set and not found in apps/api/.env${RESET}"
  echo "  Set it: export OPENAI_API_KEY=sk-... and re-run."
  echo "Press any key to close..."
  read -n 1 -s
  exit 1
fi
echo "${GREEN}✓ OpenAI API key loaded (${#OPENAI_API_KEY} chars)${RESET}"

# Optional: model + voice overrides
# Voice options — Realtime API IDs (CONFIRMED MALE only for Jeffrey):
#   verse  — warm, expressive male. Closest to ChatGPT "Arbor" character. [DEFAULT]
#   echo   — calm, neutral male. Closer to "Cove".
#   ash    — deeper male. Closer to "Ember".
#   ballad — softer male, slightly emotive.
#   cedar  — male, similar register to verse.
# FEMALE voices (do NOT use for Jeffrey): marin, coral, shimmer, sage, alloy.
# System prompt enforces the General American accent + style regardless of voice ID.
export OPENAI_REALTIME_MODEL="${OPENAI_REALTIME_MODEL:-gpt-4o-realtime-preview-2024-12-17}"
export OPENAI_REALTIME_VOICE="${OPENAI_REALTIME_VOICE:-cedar}"
echo "${DIM}  Model: $OPENAI_REALTIME_MODEL · Voice: $OPENAI_REALTIME_VOICE${RESET}"

# ─── 2. Sync prototype HTML into landing folder ─────────────────────────────
if ! cmp -s aissisted-app.html apps/landing/preview.html; then
  cp aissisted-app.html apps/landing/preview.html
  echo "${BLUE}→ Synced aissisted-app.html → apps/landing/preview.html${RESET}"
fi

# ─── 3. Kill anything on :8787 ──────────────────────────────────────────────
PORT=8787
if command -v lsof >/dev/null 2>&1; then
  pids=$(lsof -ti tcp:$PORT 2>/dev/null || true)
  if [[ -n "$pids" ]]; then
    echo "${YELLOW}→ Killing stale :$PORT process ($pids)${RESET}"
    kill -9 $pids 2>/dev/null || true
    sleep 1
  fi
fi

# ─── 4. Start Node server in background ─────────────────────────────────────
echo "${BLUE}→ Starting Node server on :$PORT (static + /api/jeffrey-realtime-token)${RESET}"
PORT=$PORT node apps/landing/server.mjs &
SERVER_PID=$!
sleep 1

# Cleanup on exit
cleanup() {
  echo
  echo "${YELLOW}→ Shutting down...${RESET}"
  kill $SERVER_PID 2>/dev/null || true
  if [[ -n "$TUNNEL_PID" ]]; then kill $TUNNEL_PID 2>/dev/null || true; fi
}
trap cleanup EXIT INT TERM

# Sanity check the server actually came up
if ! curl -sf "http://localhost:$PORT/api/health" >/dev/null; then
  echo "${RED}✗ Server didn't start cleanly. Check the log above.${RESET}"
  echo "Press any key to close..."
  read -n 1 -s
  exit 1
fi
echo "${GREEN}✓ Server live at http://localhost:$PORT/preview${RESET}"

# ─── 5. Open cloudflared tunnel ─────────────────────────────────────────────
echo "${BLUE}→ Opening public tunnel via cloudflared (download on first run, ~5MB)${RESET}"
echo
echo "${BOLD}═════════════════════════════════════════════════════════════════════${RESET}"
echo "${BOLD}  When the URL appears below, append /preview to test the prototype:${RESET}"
echo "${BOLD}    https://<random-name>.trycloudflare.com/preview${RESET}"
echo "${BOLD}═════════════════════════════════════════════════════════════════════${RESET}"
echo

# cloudflared runs in foreground so its log is visible
npx --yes cloudflared@latest tunnel --url http://localhost:$PORT
