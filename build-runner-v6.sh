#!/bin/bash
cd /Users/rongibori/Documents/GitHub/aissisted
rm -f /tmp/v6-build.log /tmp/v6-build.done
nohup bash -c '
  cd /Users/rongibori/Documents/GitHub/aissisted
  /usr/local/bin/pnpm -C apps/site build > /tmp/v6-build.log 2>&1
  echo "exit=$?" > /tmp/v6-build.done
' > /dev/null 2>&1 &
disown
echo started
