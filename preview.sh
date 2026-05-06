#!/usr/bin/env bash
# preview.sh — Aissisted local launcher
# Usage:
#   ./preview.sh                 # interactive menu
#   ./preview.sh web             # authenticated product (Next.js, :3000)
#   ./preview.sh site            # investor/marketing site (Next.js, :3001)
#   ./preview.sh landing         # consumer landing (static HTML, :8080)
#   ./preview.sh api             # Fastify backend (:4000)
#   ./preview.sh all             # web + site + api together (turbo)
#   ./preview.sh stop            # kill anything bound to the preview ports
#   ./preview.sh fix             # repair iCloud "* 2.*" dupes in node_modules

set -e

# Always run from the repo root, regardless of where this is invoked from.
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$ROOT"

# Logs — every launch writes here so crashes are debuggable after the fact.
LOG_DIR="$ROOT/.preview-logs"
mkdir -p "$LOG_DIR"

# ────────────────────────────────────────────────────────────────────────────
# Colors
# ────────────────────────────────────────────────────────────────────────────
RED=$'\033[0;31m'
GREEN=$'\033[0;32m'
YELLOW=$'\033[0;33m'
BLUE=$'\033[0;34m'
DIM=$'\033[2m'
BOLD=$'\033[1m'
RESET=$'\033[0m'

# ────────────────────────────────────────────────────────────────────────────
# App registry: name | port | description | command
# ────────────────────────────────────────────────────────────────────────────
WEB_PORT=3000
SITE_PORT=3001
API_PORT=4000
LANDING_PORT=8080

banner() {
  cat <<EOF
${RED}${BOLD}
   █████╗ ██╗███████╗███████╗██╗███████╗████████╗███████╗██████╗
  ██╔══██╗██║██╔════╝██╔════╝██║██╔════╝╚══██╔══╝██╔════╝██╔══██╗
  ███████║██║███████╗███████╗██║███████╗   ██║   █████╗  ██║  ██║
  ██╔══██║██║╚════██║╚════██║██║╚════██║   ██║   ██╔══╝  ██║  ██║
  ██║  ██║██║███████║███████║██║███████║   ██║   ███████╗██████╔╝
  ╚═╝  ╚═╝╚═╝╚══════╝╚══════╝╚═╝╚══════╝   ╚═╝   ╚══════╝╚═════╝
${RESET}${DIM}    Your Body. Understood.    —    Local Preview Launcher${RESET}

EOF
}

require_pnpm() {
  if ! command -v pnpm >/dev/null 2>&1; then
    echo "${RED}✗ pnpm not found.${RESET} Install: ${BOLD}npm i -g pnpm@10${RESET}"
    exit 1
  fi
}

ensure_install() {
  if [[ ! -d node_modules ]]; then
    echo "${YELLOW}→ node_modules missing. Running ${BOLD}pnpm install${RESET}${YELLOW} ...${RESET}"
    pnpm install
  fi
}

open_url() {
  local url="$1"
  if command -v open >/dev/null 2>&1; then
    open "$url" 2>/dev/null || true
  elif command -v xdg-open >/dev/null 2>&1; then
    xdg-open "$url" 2>/dev/null || true
  fi
}

# Kill anything bound to the given port (best-effort).
kill_port() {
  local port="$1"
  if command -v lsof >/dev/null 2>&1; then
    local pids
    pids=$(lsof -ti tcp:"$port" 2>/dev/null || true)
    if [[ -n "$pids" ]]; then
      echo "${DIM}  killing :$port → $pids${RESET}"
      kill -9 $pids 2>/dev/null || true
    fi
  fi
}

stop_all() {
  echo "${YELLOW}→ Stopping preview ports...${RESET}"
  for p in "$WEB_PORT" "$SITE_PORT" "$API_PORT" "$LANDING_PORT"; do
    kill_port "$p"
  done
  echo "${GREEN}✓ Done.${RESET}"
}

# Wait until a port is accepting connections, then open the browser.
wait_and_open() {
  local port="$1" url="$2" label="$3"
  (
    for _ in $(seq 1 60); do
      if (echo > /dev/tcp/127.0.0.1/"$port") >/dev/null 2>&1; then
        echo "${GREEN}✓ $label is up at $url${RESET}"
        open_url "$url"
        return 0
      fi
      sleep 1
    done
    echo "${YELLOW}⚠ $label didn't bind to :$port within 60s. Open $url manually.${RESET}"
  ) &
}

# ────────────────────────────────────────────────────────────────────────────
# Launchers
# ────────────────────────────────────────────────────────────────────────────
launch_web() {
  require_pnpm; ensure_install
  kill_port "$WEB_PORT"
  local log="$LOG_DIR/web.log"
  echo "${BLUE}→ Launching ${BOLD}web${RESET}${BLUE} on http://localhost:$WEB_PORT${RESET}  ${DIM}(log: $log)${RESET}"
  wait_and_open "$WEB_PORT" "http://localhost:$WEB_PORT" "web"
  exec pnpm --filter @aissisted/web dev 2>&1 | tee "$log"
}

launch_site() {
  require_pnpm; ensure_install
  kill_port "$SITE_PORT"
  local log="$LOG_DIR/site.log"
  echo "${BLUE}→ Launching ${BOLD}site${RESET}${BLUE} on http://localhost:$SITE_PORT${RESET}  ${DIM}(log: $log)${RESET}"
  wait_and_open "$SITE_PORT" "http://localhost:$SITE_PORT" "site"
  exec pnpm --filter @aissisted/site dev 2>&1 | tee "$log"
}

launch_api() {
  require_pnpm; ensure_install
  kill_port "$API_PORT"
  local log="$LOG_DIR/api.log"
  echo "${BLUE}→ Launching ${BOLD}api${RESET}${BLUE} on http://localhost:$API_PORT${RESET}  ${DIM}(log: $log)${RESET}"
  wait_and_open "$API_PORT" "http://localhost:$API_PORT/health" "api"
  exec pnpm --filter @aissisted/api dev 2>&1 | tee "$log"
}

launch_landing() {
  kill_port "$LANDING_PORT"
  echo "${BLUE}→ Launching ${BOLD}landing${RESET}${BLUE} on http://localhost:$LANDING_PORT${RESET}"
  wait_and_open "$LANDING_PORT" "http://localhost:$LANDING_PORT" "landing"
  if command -v python3 >/dev/null 2>&1; then
    exec python3 -m http.server "$LANDING_PORT" --directory apps/landing
  elif command -v npx >/dev/null 2>&1; then
    exec npx --yes http-server apps/landing -p "$LANDING_PORT" -c-1
  else
    echo "${RED}✗ Need python3 or npx to serve static landing.${RESET}"
    exit 1
  fi
}

launch_all() {
  require_pnpm; ensure_install
  kill_port "$WEB_PORT"; kill_port "$SITE_PORT"; kill_port "$API_PORT"
  local log="$LOG_DIR/all.log"
  echo "${BLUE}→ Launching ${BOLD}web + site + api${RESET}${BLUE} via turbo${RESET}  ${DIM}(log: $log)${RESET}"
  wait_and_open "$WEB_PORT"  "http://localhost:$WEB_PORT"        "web"
  wait_and_open "$SITE_PORT" "http://localhost:$SITE_PORT"       "site"
  wait_and_open "$API_PORT"  "http://localhost:$API_PORT/health" "api"
  exec pnpm dev --filter @aissisted/web --filter @aissisted/site --filter @aissisted/api 2>&1 | tee "$log"
}

# ────────────────────────────────────────────────────────────────────────────
# Menu
# ────────────────────────────────────────────────────────────────────────────
menu() {
  banner
  cat <<EOF
  ${BOLD}What do you want to preview?${RESET}

    ${BOLD}1${RESET})  web       ${DIM}— authenticated product   → :$WEB_PORT${RESET}
    ${BOLD}2${RESET})  site      ${DIM}— investor / marketing    → :$SITE_PORT${RESET}
    ${BOLD}3${RESET})  landing   ${DIM}— consumer landing (static) → :$LANDING_PORT${RESET}
    ${BOLD}4${RESET})  api       ${DIM}— Fastify backend         → :$API_PORT${RESET}
    ${BOLD}5${RESET})  all       ${DIM}— web + site + api in parallel${RESET}
    ${BOLD}s${RESET})  stop      ${DIM}— kill anything on preview ports${RESET}
    ${BOLD}f${RESET})  fix       ${DIM}— repair iCloud '* 2.*' dupes in node_modules${RESET}
    ${BOLD}q${RESET})  quit

EOF
  read -rp "  > " choice
  case "$choice" in
    1|web)     launch_web ;;
    2|site)    launch_site ;;
    3|landing) launch_landing ;;
    4|api)     launch_api ;;
    5|all)     launch_all ;;
    s|stop)    stop_all ;;
    f|fix)     "$ROOT/scripts/fix-icloud-dupes.sh" node_modules ;;
    q|quit|"") echo "${DIM}bye.${RESET}"; exit 0 ;;
    *)         echo "${RED}Unknown choice: $choice${RESET}"; exit 1 ;;
  esac
}

# ────────────────────────────────────────────────────────────────────────────
# Entrypoint
# ────────────────────────────────────────────────────────────────────────────
case "${1:-}" in
  ""|menu)   menu ;;
  web)       launch_web ;;
  site)      launch_site ;;
  landing)   launch_landing ;;
  api)       launch_api ;;
  all)       launch_all ;;
  stop|kill) stop_all ;;
  fix|repair)
    if [[ -x "$ROOT/scripts/fix-icloud-dupes.sh" ]]; then
      "$ROOT/scripts/fix-icloud-dupes.sh" node_modules
    else
      echo "${RED}✗ scripts/fix-icloud-dupes.sh not found or not executable${RESET}"
      exit 1
    fi
    ;;
  -h|--help|help)
    banner
    grep -E "^#( |$)" "$0" | sed 's/^# \{0,1\}//'
    ;;
  *)
    echo "${RED}Unknown command: $1${RESET}"
    echo "Try: ${BOLD}./preview.sh${RESET} (interactive) or ${BOLD}./preview.sh help${RESET}"
    exit 1
    ;;
esac
