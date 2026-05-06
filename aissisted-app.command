#!/usr/bin/env bash
# aissisted-app.command — opens the standalone HTML prototype in default browser.
# Self-contained: no server, no Next.js, no node_modules. Just HTML + Tailwind CDN.
DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
open "$DIR/aissisted-app.html"
