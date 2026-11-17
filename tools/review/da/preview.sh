#!/bin/bash
# Previews pages on a branch of the site (admin.hlx.page preview: never publishes). The
# environment adds the credentials. ONLY when the user asks for it in their current message.
# usage: bash tools/review/da/preview.sh <org/site> <branch> <paths file (EDS paths incl. prefix)> <log file>
#   e.g. bash tools/review/da/preview.sh strykerenterprise/stryker-com standardise-v3 /tmp/run-outputs/std-paths-prefixed.txt /tmp/run-outputs/preview.log
SITE=$1
REF=$2
LIST=$3
LOG=$4
: > "$LOG"
while read -r p; do
  [ -n "$p" ] || continue
  for try in 1 2 3; do
    c=$(curl -s -o /dev/null -w '%{http_code}' -X POST "https://admin.hlx.page/preview/$SITE/$REF$p")
    [ "$c" = 429 ] && { sleep 15; continue; }
    break
  done
  echo "$c $p" >> "$LOG"
done < "$LIST"
echo "$(date +%T) preview done: $(grep -c '^200 ' "$LOG") ok, $(grep -vc '^200 ' "$LOG") other"
