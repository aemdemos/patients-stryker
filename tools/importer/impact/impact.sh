#!/bin/bash
# The import impact check (the import blast radius): imports every template's sample with the
# corp rule library, offline from the page cache, and compares it with the template's accepted
# baseline (baselines/<template>/). Run it before and after a change to the library; the report
# says per template which documents changed and how. --accept makes the new imports the
# baselines (after the owners of the changed templates have reviewed them).
# usage: impact.sh [template …] [--accept]    (no template: all of templates.json)
# report: $IMPACT_OUT/report.txt (default /tmp/import-impact/<time>/)
set -u
H=$(cd "$(dirname "$0")" && pwd)
ACCEPT=
TEMPLATES=()
for a in "$@"; do
  if [ "$a" = --accept ]; then ACCEPT=1; else TEMPLATES+=("$a"); fi
done
[ ${#TEMPLATES[@]} -gt 0 ] || mapfile -t TEMPLATES < <(node -e "console.log(Object.keys(require('$H/templates.json')).join('\n'))")
OUT=${IMPACT_OUT:-/tmp/import-impact/$(date +%Y%m%d-%H%M%S)}
mkdir -p "$OUT"
REPORT=$OUT/report.txt
: > "$REPORT"
for t in "${TEMPLATES[@]}"; do
  echo "== $t" | tee -a "$REPORT"
  bash "$H/import-sample.sh" "$t" "$OUT/$t" >/dev/null 2>&1
  grep -E "❌" "$OUT/$t/import.log" | sed 's/^/  failed: /' | cut -c1-200 >> "$REPORT"
  if [ -d "$H/baselines/$t" ]; then
    python3 -I "$H/compare.py" "$H/baselines/$t" "$OUT/$t/content" >> "$REPORT"
  else
    echo "  no baseline yet ($(find "$OUT/$t/content" -name '*.plain.html' | wc -l) documents imported)" >> "$REPORT"
  fi
  grep -E "^(documents|  no baseline)" "$REPORT" | tail -1
  if [ -n "$ACCEPT" ]; then
    mkdir -p "$H/baselines/$t"
    find "$H/baselines/$t" -name '*.plain.html' -delete
    cp -r "$OUT/$t/content/." "$H/baselines/$t/"
    find "$H/baselines/$t" -type d -empty -delete
    echo "  accepted as the baseline" | tee -a "$REPORT"
  fi
done
echo "report: $REPORT"
