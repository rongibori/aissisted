#!/usr/bin/env bash
# preview-all.command — double-clickable launcher: web + site + api in parallel.
DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$DIR"
clear
./preview.sh all
echo
echo "Press any key to close this window..."
read -n 1 -s
