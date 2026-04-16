#!/usr/bin/env bash
# aissisted-guardrails.sh
# Installs the rails that prevent repo sprawl from happening again.
# Idempotent — safe to run multiple times.

set -euo pipefail

CANONICAL="$HOME/Documents/GitHub/aissisted"

# Detect the user's actual login shell and write to the right rc file.
case "${SHELL:-}" in
  */zsh)  SHELL_RC="$HOME/.zshrc" ;;
  */bash) SHELL_RC="$HOME/.bash_profile" ;;
  *)      SHELL_RC="$HOME/.profile" ;;
esac
# Create the file if it doesn't exist — touching is harmless.
touch "$SHELL_RC"

bold() { printf "\033[1m%s\033[0m\n" "$1"; }

if [ ! -d "$CANONICAL/.git" ]; then
  echo "ABORT: canonical repo not found at $CANONICAL"
  exit 1
fi

bold "=== Installing Aissisted guardrails ==="

# --- 1. Shell helpers: one true way to get into the repo ---
MARKER="# >>> aissisted-guardrails >>>"
END_MARKER="# <<< aissisted-guardrails <<<"

if ! grep -q "$MARKER" "$SHELL_RC" 2>/dev/null; then
  cat >> "$SHELL_RC" <<EOF

$MARKER
export AISSISTED_HOME="$CANONICAL"
alias ais='cd "\$AISSISTED_HOME"'
# Refuse to build/deploy from anywhere that isn't canonical.
ais_guard() {
  local real
  real="\$(cd "\$AISSISTED_HOME" && pwd -P)"
  local here
  here="\$(pwd -P)"
  case "\$here" in
    "\$real"|"\$real"/*) return 0 ;;
    *) echo "REFUSED: not in canonical repo (\$AISSISTED_HOME). You are in \$here" >&2; return 1 ;;
  esac
}
# Optional strict wrappers — uncomment to block docker/pnpm outside canonical:
# docker() { ais_guard && command docker "\$@"; }
# pnpm()   { ais_guard && command pnpm   "\$@"; }
$END_MARKER
EOF
  echo "  added shell helpers to $SHELL_RC"
else
  echo "  shell helpers already present in $SHELL_RC"
fi

# --- 2. Canonical marker file — makes 'which repo am I in?' obvious ---
MARKER_FILE="$CANONICAL/.canonical"
if [ ! -f "$MARKER_FILE" ]; then
  cat > "$MARKER_FILE" <<EOF
This is the CANONICAL Aissisted repo.
All builds, deploys, and Claude/Cowork edits should happen here.
If you're looking at a copy elsewhere, stop and cd to:
  $CANONICAL
EOF
  echo "  wrote $MARKER_FILE"
fi

# --- 3. Cowork workspace repoint ---
# Cowork currently points at ~/Documents/Claude/Projects/Aissisted.
# We replace that directory with a symlink to canonical so Claude edits the real repo.
COWORK_DIR="$HOME/Documents/Claude/Projects/Aissisted"
if [ -L "$COWORK_DIR" ]; then
  echo "  Cowork dir already a symlink -> $(readlink "$COWORK_DIR")"
elif [ -d "$COWORK_DIR" ]; then
  BACKUP="$COWORK_DIR.backup-$(date +%Y%m%d-%H%M%S)"
  mv "$COWORK_DIR" "$BACKUP"
  ln -s "$CANONICAL" "$COWORK_DIR"
  echo "  backed up old Cowork dir -> $BACKUP"
  echo "  symlinked Cowork dir -> $CANONICAL"
  echo "  NOTE: reopen Cowork so it re-resolves the path."
else
  ln -s "$CANONICAL" "$COWORK_DIR"
  echo "  symlinked Cowork dir -> $CANONICAL"
fi

# --- 4. Git hook: warn on commit if pwd isn't canonical ---
HOOK="$CANONICAL/.git/hooks/pre-commit"
if [ ! -f "$HOOK" ] || ! grep -q "canonical-guard" "$HOOK"; then
  cat > "$HOOK" <<'HOOK_EOF'
#!/usr/bin/env bash
# canonical-guard
real="$(cd "$(git rev-parse --show-toplevel)" && pwd -P)"
expected="$HOME/Documents/GitHub/aissisted"
if [ "$real" != "$(cd "$expected" && pwd -P)" ]; then
  echo "WARNING: committing outside canonical repo ($expected)" >&2
  echo "You are in: $real" >&2
  read -p "Continue? [y/N] " ok < /dev/tty
  [[ "$ok" == "y" ]] || exit 1
fi
HOOK_EOF
  chmod +x "$HOOK"
  echo "  installed pre-commit guard"
fi

echo
bold "=== Guardrails installed ==="
cat <<EOF

Activate shell helpers now:
  source $SHELL_RC

From now on:
  ais            # jumps to canonical repo
  \$AISSISTED_HOME  # absolute path to canonical

To deploy safely, always run builds from:
  cd \$AISSISTED_HOME && docker build ...

If you ever find a folder called 'aissisted' that isn't a symlink to
\$AISSISTED_HOME — treat it as stale and archive it.
EOF
