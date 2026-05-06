#!/usr/bin/env bash
# preview-web.command — double-clickable launcher for the web app only.
# Bypasses the menu and runs ./preview.sh web directly.
DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$DIR"
clear
./preview.sh web
echo
echo "Press any key to close this window..."
read -n 1 -s
