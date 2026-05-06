#!/usr/bin/env bash
# paste-key-and-deploy.command
#
# Copy your new OpenAI key to clipboard (Cmd+C), then double-click this file.
# It will:
#   1. Read the key from clipboard
#   2. Update apps/api/.env with the new key (replacing the existing line)
#   3. Kill any running :8787 server
#   4. Re-launch jeffrey-voice-deploy.command (new tunnel URL → live voice)
#
# Safe: never echoes the full key, only validates the prefix.
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
${RESET}${DIM}            Paste OpenAI key from clipboard + redeploy${RESET}

EOF

# ─── 1. Read clipboard ──────────────────────────────────────────────────────
RAW=$(pbpaste 2>/dev/null | tr -d '\n' | tr -d '\r')

if [[ -z "$RAW" ]]; then
  echo "${RED}✗ Clipboard is empty.${RESET}"
  echo "  Copy your OpenAI key (Cmd+C) first, then re-run this."
  echo
  echo "Press any key to close..."
  read -n 1 -s
  exit 1
fi

# Be forgiving with what's on the clipboard:
#  - Strip leading "export OPENAI_API_KEY=" (env-style paste)
#  - Strip leading "OPENAI_API_KEY="
#  - Strip surrounding quotes
#  - Pull out the first sk- token if there's surrounding text
NEW_KEY="$RAW"
NEW_KEY="${NEW_KEY#export }"
NEW_KEY="${NEW_KEY#OPENAI_API_KEY=}"
NEW_KEY="${NEW_KEY#\"}"; NEW_KEY="${NEW_KEY%\"}"
NEW_KEY="${NEW_KEY#\'}"; NEW_KEY="${NEW_KEY%\'}"

# If still doesn't start with sk-, try to extract a sk-... substring
if [[ ! "$NEW_KEY" =~ ^sk- ]]; then
  EXTRACTED=$(printf '%s' "$RAW" | grep -oE 'sk-(proj-)?[A-Za-z0-9_-]+' | head -1 || true)
  if [[ -n "$EXTRACTED" ]]; then
    NEW_KEY="$EXTRACTED"
  fi
fi

# Validate
if [[ ! "$NEW_KEY" =~ ^sk- ]]; then
  echo "${RED}✗ Clipboard doesn't contain an OpenAI key.${RESET}"
  echo "  Expected something starting with 'sk-' or 'sk-proj-'"
  echo "  Got:      ${RAW:0:30}... (${#RAW} chars)"
  echo
  echo "  Copy a real key from https://platform.openai.com/api-keys"
  echo "  Press any key to close..."
  read -n 1 -s
  exit 1
fi

echo "${GREEN}✓ Key on clipboard${RESET} (${#NEW_KEY} chars, prefix ${NEW_KEY:0:8}…)"

# ─── 2. Update apps/api/.env ────────────────────────────────────────────────
ENV_FILE="apps/api/.env"
mkdir -p "$(dirname "$ENV_FILE")"
touch "$ENV_FILE"

if grep -qE '^OPENAI_API_KEY=' "$ENV_FILE"; then
  # Replace existing line. macOS sed needs '' after -i
  # Escape & for sed safety
  ESCAPED_KEY=$(printf '%s\n' "$NEW_KEY" | sed 's/[\&/]/\\&/g')
  sed -i '' "s/^OPENAI_API_KEY=.*$/OPENAI_API_KEY=${ESCAPED_KEY}/" "$ENV_FILE"
  echo "${GREEN}✓ Updated OPENAI_API_KEY in ${ENV_FILE}${RESET}"
else
  echo "OPENAI_API_KEY=${NEW_KEY}" >> "$ENV_FILE"
  echo "${GREEN}✓ Added OPENAI_API_KEY to ${ENV_FILE}${RESET}"
fi

# Sanity verify the line was written correctly
if ! grep -qE "^OPENAI_API_KEY=${NEW_KEY:0:8}" "$ENV_FILE"; then
  echo "${RED}✗ Sanity check failed — key prefix doesn't match in ${ENV_FILE}${RESET}"
  echo "  Open the file and check it manually."
  echo "Press any key to close..."
  read -n 1 -s
  exit 1
fi

# ─── 3. Kill the old server (if running) ────────────────────────────────────
if command -v lsof >/dev/null 2>&1; then
  pids=$(lsof -ti tcp:8787 2>/dev/null || true)
  if [[ -n "$pids" ]]; then
    echo "${YELLOW}→ Killing stale :8787 server ($pids)${RESET}"
    kill -9 $pids 2>/dev/null || true
    sleep 1
  fi
fi

# ─── 4. Re-launch jeffrey-voice-deploy ──────────────────────────────────────
echo
echo "${BLUE}→ Launching jeffrey-voice-deploy.command (new tunnel URL incoming)${RESET}"
echo
exec ./jeffrey-voice-deploy.command
