#!/bin/bash
# Block looks page: removes screenshots that are no longer used from a branch preview and from
# Document Authoring: each path is un-previewed on the branch first (the preview would keep
# serving it otherwise), then its DA document deleted. Two at a time; every result is logged,
# paths already done are skipped (resumable). They were never published, so nothing goes live.
# usage: bash tools/looks/remove-shots.sh <list of DA paths, looks-shots/…> <branch> <log file>
LIST=${1:?list of DA paths}
REF=${2:?branch}
LOG=${3:?log file}
ORG=strykerenterprise
SITE=stryker-com
touch "$LOG"

one() {
  local path=$1 pv da
  if grep -qxF "ok $path" "$LOG"; then return; fi
  pv=$(curl -s -o /dev/null -w '%{http_code}' --max-time 120 -X DELETE \
    "https://admin.hlx.page/preview/$ORG/$SITE/$REF/$path")
  if [ "$pv" != 204 ] && [ "$pv" != 200 ] && [ "$pv" != 404 ]; then echo "fail unpreview $pv $path" >> "$LOG"; return; fi
  da=$(curl -s -o /dev/null -w '%{http_code}' --max-time 120 -X DELETE \
    "https://admin.da.live/source/$ORG/$SITE/$path")
  if [ "$da" != 204 ] && [ "$da" != 200 ] && [ "$da" != 404 ]; then echo "fail delete $da $path" >> "$LOG"; return; fi
  echo "ok $path" >> "$LOG"
}
export -f one
export REF LOG ORG SITE
xargs -P 2 -I{} bash -c 'one "$@"' _ {} < "$LIST"
echo "done: $(grep -c '^ok ' "$LOG") ok, $(grep -c '^fail ' "$LOG") failed lines"
