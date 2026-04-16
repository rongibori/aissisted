#!/usr/bin/env bash
# aissisted-compare-ideabooth.sh
# READ-ONLY. Compares IdeaBoothDigital/aissisted (remote) against canonical (rongibori/aissisted).
# Output tells us whether IdeaBoothDigital has commits or files we need to salvage before deleting.
# Nothing is modified. The clone lives in /tmp and can be deleted anytime.

set -u

CANONICAL="${AISSISTED_HOME:-$HOME/Documents/GitHub/aissisted}"
TMP="/tmp/ideabooth-aissisted-compare-$(date +%s)"

bold() { printf "\033[1m%s\033[0m\n" "$1"; }
warn() { printf "\033[33m%s\033[0m\n" "$1"; }
ok()   { printf "\033[32m%s\033[0m\n" "$1"; }
err()  { printf "\033[31m%s\033[0m\n" "$1"; }

echo
bold "=== Cloning IdeaBoothDigital/aissisted (via SSH) to $TMP ==="
# Using SSH because canonical already auths via SSH; HTTPS prompts for password
# and private repos return 404 anonymously.
if ! git clone --quiet git@github.com:IdeaBoothDigital/aissisted.git "$TMP" 2>&1; then
  err "CLONE FAILED."
  err "Possible reasons:"
  err "  1) Repo was already DELETED on GitHub -> great, nothing to compare, exit this script."
  err "  2) Your SSH key doesn't have access to IdeaBoothDigital org -> add your key to that org."
  err "  3) Network / GitHub down -> retry in a minute."
  exit 1
fi
ok "cloned"
echo

bold "=== Canonical sanity check ==="
if [ ! -d "$CANONICAL/.git" ]; then
  err "Canonical not found at $CANONICAL. Set AISSISTED_HOME or cd there first."
  exit 1
fi
echo "  canonical: $CANONICAL"
echo

bold "=== Side-by-side metadata ==="
printf "%-35s %-10s %-10s %s\n" "repo" "commits" "branches" "head-subject"
for repo in "$TMP" "$CANONICAL"; do
  label=$(cd "$repo" && git remote get-url origin 2>/dev/null | sed 's|.*github.com[:/]||; s|\.git$||')
  commits=$(cd "$repo" && git log --oneline 2>/dev/null | wc -l | tr -d ' ')
  branches=$(cd "$repo" && git branch -a 2>/dev/null | wc -l | tr -d ' ')
  head=$(cd "$repo" && git log --format='%s' -1 2>/dev/null | cut -c1-55)
  printf "%-35s %-10s %-10s %s\n" "$label" "$commits" "$branches" "$head"
done
echo

bold "=== Commits ONLY in IdeaBoothDigital (compared by subject) ==="
# Hashes differ across disconnected repos; subject is the reliable comparator.
( cd "$TMP"       && git log --format='%s' ) | sort -u > /tmp/_ib_subjects
( cd "$CANONICAL" && git log --format='%s' ) | sort -u > /tmp/_cn_subjects
unique_ib=$(comm -23 /tmp/_ib_subjects /tmp/_cn_subjects)
if [ -z "$unique_ib" ]; then
  ok "  (none — every IdeaBoothDigital commit subject is also in canonical)"
else
  warn "  These commit SUBJECTS exist in IdeaBoothDigital but NOT in canonical:"
  echo "$unique_ib" | sed 's/^/    - /'
fi
echo

bold "=== Commits ONLY in canonical ==="
unique_cn=$(comm -13 /tmp/_ib_subjects /tmp/_cn_subjects)
if [ -z "$unique_cn" ]; then
  warn "  (none — canonical has no work beyond IdeaBoothDigital)"
else
  total=$(echo "$unique_cn" | wc -l | tr -d ' ')
  ok "  canonical is ahead by $total commit subject(s). Sample:"
  echo "$unique_cn" | head -10 | sed 's/^/    - /'
  [ "$total" -gt 10 ] && echo "    ... ($((total - 10)) more)"
fi
echo

bold "=== Files that exist in ONE tree but not the other ==="
diff -rq --exclude=.git --exclude=node_modules --exclude=dist --exclude=.next --exclude='.turbo' \
  "$TMP" "$CANONICAL" 2>/dev/null | grep -E '^Only in' | head -40
echo

bold "=== Files that exist in BOTH but differ ==="
diff -rq --exclude=.git --exclude=node_modules --exclude=dist --exclude=.next --exclude='.turbo' \
  "$TMP" "$CANONICAL" 2>/dev/null | grep -E '^Files.*differ$' | head -40
echo

bold "=== Recommendation ==="
ib_only=$(echo "$unique_ib" | grep -vc '^$' || true)
cn_only=$(echo "$unique_cn" | grep -vc '^$' || true)
if [ "$ib_only" = "0" ]; then
  ok "IdeaBoothDigital has NO unique commits. Safe to DELETE the repo after confirming file diff is noise."
else
  warn "IdeaBoothDigital has $ib_only unique commit subject(s). REVIEW before deleting."
  echo "  If any of those commit subjects describe real work, we cherry-pick them into canonical."
  echo "  If they're duplicates of canonical's early scaffolding with different wording, it's safe to delete."
fi
echo
echo "Clone saved for your review at: $TMP"
echo "Delete when done:  rm -rf \"$TMP\""
echo
