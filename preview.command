#!/usr/bin/env bash
# preview.command — double-clickable wrapper for Finder.
# Opens Terminal, runs the launcher, keeps the window open after exit.
DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$DIR"
clear
./preview.sh
echo
echo "Press any key to close this window..."
read -n 1 -s
