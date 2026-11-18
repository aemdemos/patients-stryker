#!/bin/bash
# Block looks page: the screenshots it uses (tools/looks/shots, git-ignored) to Document Authoring
# under /looks-shots/<type>/<page path>/<n>-<d|m>.jpg and previewed on a branch (never published),
# so the page works on the branch preview too. Four at a time; every file's result is logged,
# files already done are skipped (resumable).
# usage: bash tools/looks/upload-shots.sh <list of shot paths> <branch> <log file>
#   (the list: one "shots/<type>/<file>.jpg" per line, as in tools/looks/data/*.json)
LIST=${1:?list of shot paths}
REF=${2:?branch}
LOG=${3:?log file}
ORG=strykerenterprise
SITE=stryker-com
touch "$LOG"

one() {
  local shot=$1 rel path up pv
  rel=${shot#shots/}
  # (the page path's ~ and the block number's __ become folders, as the page's remoteShot() does)
  rel=${rel//\~//}
  rel=${rel//__//}
  path="looks-shots/$rel"
  if grep -qxF "ok $path" "$LOG"; then return; fi
  up=$(curl -s -o /dev/null -w '%{http_code}' --max-time 120 -X POST \
    -F "data=@tools/looks/$shot;type=image/jpeg" \
    "https://admin.da.live/source/$ORG/$SITE/$path")
  if [ "$up" != 200 ] && [ "$up" != 201 ]; then echo "fail upload $up $path" >> "$LOG"; return; fi
  pv=$(curl -s -o /dev/null -w '%{http_code}' --max-time 120 -X POST \
    "https://admin.hlx.page/preview/$ORG/$SITE/$REF/$path")
  if [ "$pv" != 200 ]; then echo "fail preview $pv $path" >> "$LOG"; return; fi
  echo "ok $path" >> "$LOG"
}
export -f one
export REF LOG ORG SITE
xargs -P 4 -I{} bash -c 'one "$@"' _ {} < "$LIST"
echo "done: $(grep -c '^ok ' "$LOG") ok, $(grep -c '^fail ' "$LOG") failed lines"
