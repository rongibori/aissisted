#!/usr/bin/env bash
# jeffrey-voice-ballad.command — temporary A/B against ballad voice.
#
# Spins up the same Jeffrey voice deploy stack but overrides the locked
# cedar voice with ballad for this session only. The lock files are NOT
# touched — server.mjs still defaults to cedar; this just sets the env
# var that overrides at runtime.
#
# When you close this Terminal, the next launch of
# jeffrey-voice-deploy.command will go right back to cedar.

set -e

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$DIR"

export OPENAI_REALTIME_VOICE=ballad

echo "Voice override active for this session: OPENAI_REALTIME_VOICE=ballad"
echo "(Lock untouched. Cedar remains canonical.)"
echo

exec ./jeffrey-voice-deploy.command
