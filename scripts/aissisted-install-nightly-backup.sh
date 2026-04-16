#!/usr/bin/env bash
# aissisted-install-nightly-backup.sh
# Installs a macOS LaunchAgent that runs aissisted-nightly-backup.sh on schedule.
# Idempotent — running twice is safe; it unloads and reinstalls cleanly.
#
# Schedule: 02:00 (primary) and 10:00 (catch-up if laptop was asleep at 2am).
# Uninstall instructions are printed at the end of the install.

set -euo pipefail

CANONICAL="${AISSISTED_HOME:-$HOME/Documents/GitHub/aissisted}"
PLIST_LABEL="com.aissisted.nightly-backup"
PLIST_PATH="$HOME/Library/LaunchAgents/$PLIST_LABEL.plist"
SCRIPT_PATH="$CANONICAL/scripts/aissisted-nightly-backup.sh"
LOG="$HOME/Library/Logs/aissisted-nightly-backup.log"

bold() { printf "\033[1m%s\033[0m\n" "$1"; }
ok()   { printf "\033[32m%s\033[0m\n" "$1"; }
err()  { printf "\033[31m%s\033[0m\n" "$1"; }

# --- Preconditions ---

if [ ! -f "$SCRIPT_PATH" ]; then
  err "ABORT: backup script not found at $SCRIPT_PATH"
  err "       Run this installer from canonical, or ensure scripts/ exists."
  exit 1
fi

# Make sure the backup script is executable
chmod +x "$SCRIPT_PATH"

bold "=== Installing nightly backup LaunchAgent ==="
echo "  canonical:   $CANONICAL"
echo "  agent label: $PLIST_LABEL"
echo "  plist path:  $PLIST_PATH"
echo "  log file:    $LOG"
echo

mkdir -p "$HOME/Library/LaunchAgents"
mkdir -p "$(dirname "$LOG")"

# --- Unload any prior version (idempotency) ---

if launchctl list 2>/dev/null | grep -q "$PLIST_LABEL"; then
  launchctl unload "$PLIST_PATH" 2>/dev/null || true
  echo "  unloaded previous agent"
fi

# --- Write plist ---

cat > "$PLIST_PATH" <<PLIST
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>Label</key>
  <string>$PLIST_LABEL</string>

  <key>ProgramArguments</key>
  <array>
    <string>/bin/bash</string>
    <string>$SCRIPT_PATH</string>
  </array>

  <key>StartCalendarInterval</key>
  <array>
    <dict>
      <key>Hour</key><integer>2</integer>
      <key>Minute</key><integer>0</integer>
    </dict>
    <dict>
      <key>Hour</key><integer>10</integer>
      <key>Minute</key><integer>0</integer>
    </dict>
  </array>

  <key>EnvironmentVariables</key>
  <dict>
    <key>PATH</key>
    <string>/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin</string>
    <key>HOME</key>
    <string>$HOME</string>
    <key>AISSISTED_HOME</key>
    <string>$CANONICAL</string>
  </dict>

  <key>StandardOutPath</key>
  <string>$LOG</string>
  <key>StandardErrorPath</key>
  <string>$LOG</string>

  <key>RunAtLoad</key>
  <false/>
</dict>
</plist>
PLIST

chmod 644 "$PLIST_PATH"
launchctl load "$PLIST_PATH"
ok "  loaded $PLIST_LABEL"

echo
ok "=== Installed ==="
cat <<EOF

Next scheduled runs: 02:00 (primary) and 10:00 (catch-up) every day.
Any uncommitted work in canonical at that time will be pushed to branch
'safety-net/YYYY-MM-DD' on origin. Main and your working tree are never touched.

Log:    $LOG
Script: $SCRIPT_PATH

Test it right now (forces a run regardless of schedule):
  bash $SCRIPT_PATH && tail -20 $LOG

Temporarily disable without uninstalling:
  touch $HOME/.aissisted-no-backup
Re-enable:
  rm $HOME/.aissisted-no-backup

Verify agent is loaded:
  launchctl list | grep $PLIST_LABEL

Uninstall cleanly:
  launchctl unload $PLIST_PATH
  rm $PLIST_PATH

Recover WIP from a safety branch:
  cd $CANONICAL
  git fetch origin
  git checkout safety-net/YYYY-MM-DD
  # the single commit on that branch contains your WIP at snapshot time
EOF
