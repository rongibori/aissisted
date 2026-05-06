#!/usr/bin/env bash
# preview-site.command — double-clickable launcher for the investor site.
DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$DIR"
clear
./preview.sh site
echo
echo "Press any key to close this window..."
read -n 1 -s
