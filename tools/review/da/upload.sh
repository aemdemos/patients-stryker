#!/bin/bash
# Uploads local pages to Document Authoring: content/<prefix><path>.plain.html wrapped as
# <body><header></header><main>…</main><footer></footer></body>, POSTed to the DA source API.
# The environment adds the credentials (Settings → LLM Permissions, the Adobe credentials option);
# never pass a token here. Resumable: paths already logged as 200/201 are skipped.
# ONLY when the user asks for an upload in their current message (see tools/review/RUNBOOK.md).
# usage: bash tools/review/da/upload.sh <org/site> <paths file (EDS paths, one per line)> <log file> [content prefix]
#   e.g. bash tools/review/da/upload.sh strykerenterprise/stryker-com /tmp/run-outputs/std-paths.txt /tmp/run-outputs/upload.log /std
R=$(cd "$(dirname "$0")/../../.." && pwd)
REPO=$1
LIST=$2
LOG=$3
PREFIX=${4:-}
TMP=$(mktemp)
touch "$LOG"
while read -r p; do
  [ -n "$p" ] || continue
  grep -qE "^(200|201) $PREFIX$p$" "$LOG" && continue
  src="$R/content$PREFIX$p.plain.html"
  if [ ! -f "$src" ]; then echo "nofile $PREFIX$p" >> "$LOG"; continue; fi
  { printf '<body><header></header><main>'; cat "$src"; printf '</main><footer></footer></body>'; } > "$TMP"
  code=$(curl -s -o /dev/null -w '%{http_code}' -X POST -F "data=@$TMP;type=text/html" \
    "https://admin.da.live/source/$REPO$PREFIX$p.html")
  echo "$code $PREFIX$p" >> "$LOG"
  case $code in 200|201) ;; 429) sleep 10 ;; *) sleep 1 ;; esac
done < "$LIST"
rm -f "$TMP"
echo "$(date +%T) done: $(grep -cE '^(200|201) ' "$LOG") ok, $(grep -vcE '^(200|201) ' "$LOG") other"
