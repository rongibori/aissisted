#!/usr/bin/env bash
# deploy-tunnel.command — instant public URL, no auth required.
# Spins up a local server + cloudflared tunnel. URL appears in ~30s.
DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$DIR"
clear
exec ./deploy.command tunnel
