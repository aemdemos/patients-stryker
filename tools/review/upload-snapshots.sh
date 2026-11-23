#!/bin/bash
# Review tool: the snapshot tiles (capture-snapshots.mjs) to Document Authoring under
# /<folder>/<page>/<width>/<n>.jpg and previewed on a branch (never published). The folder is the
# review's (config.js snapshots.preview): review-snapshots-main for the migrated pages,
# review-snapshots (the default) for the standard pages.
# Four at a time; every tile's result is logged, tiles already done are skipped (resumable).
# usage: bash tools/review/upload-snapshots.sh <snapshots dir> <branch> <log file> [folder]
SNAP=${1:?snapshots dir}
REF=${2:?branch}
LOG=${3:?log file}
FOLDER=${4:-review-snapshots}
ORG=strykerenterprise
SITE=stryker-com
touch "$LOG"

one() {
  local file=$1 rel path up pv
  rel=${file#"$SNAP"/}
  path="$FOLDER/$rel"
  if grep -qxF "ok $path" "$LOG"; then return; fi
  up=$(curl -s -o /dev/null -w '%{http_code}' --max-time 120 -X POST -F "data=@$file;type=image/jpeg" \
    "https://admin.da.live/source/$ORG/$SITE/$path")
  if [ "$up" != 200 ] && [ "$up" != 201 ]; then echo "fail upload $up $path" >> "$LOG"; return; fi
  pv=$(curl -s -o /dev/null -w '%{http_code}' --max-time 120 -X POST \
    "https://admin.hlx.page/preview/$ORG/$SITE/$REF/$path")
  if [ "$pv" != 200 ]; then echo "fail preview $pv $path" >> "$LOG"; return; fi
  echo "ok $path" >> "$LOG"
}
export -f one
export SNAP REF LOG ORG SITE FOLDER
find "$SNAP/us" -name '*.jpg' | sort | xargs -P 4 -I{} bash -c 'one "$@"' _ {}
echo "done: $(grep -c '^ok ' "$LOG") ok, $(grep -c '^fail ' "$LOG") failed lines"
