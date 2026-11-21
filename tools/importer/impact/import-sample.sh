#!/bin/bash
# Imports one template's sample with the corp rule library (tools/importer/corp/), offline from
# the page cache (.migration/plans/pilot-tools/fast-import.mjs; a page not in the cache yet is
# recorded from the live site once): the pages' XFs (import-corp-fragments.js), the modals
# (import-corp-modal-fragments.js), then the pages (the template's import-<importer>.js).
# Nothing is copied to the local preview. Output: <out>/content/rs/…plain.html, <out>/import.log.
# usage: import-sample.sh <template> <out dir> [concurrency]   (templates: impact/templates.json)
#        SAMPLE=<page list> import-sample.sh …   another page list (AEM paths), e.g. all its pages
set -u
R=$(cd "$(dirname "$0")/../../.." && pwd)
S=${EXCAT_IMPORT_SCRIPTS:-$HOME/.excat-marketplaces/excat-marketplace/excat/skills/excat-content-import/scripts}
P=$R/.migration/plans/pilot-tools
I=$R/tools/importer
T=$1
OUT=$2
CONC=${3:-3}
IMPORTER=$(node -e "process.stdout.write(require('$I/impact/templates.json')['$T']?.importer || '')")
[ -n "$IMPORTER" ] || { echo "unknown template $T (impact/templates.json)"; exit 1; }
mkdir -p "$OUT"
LOG=$OUT/import.log
log() { echo "$(date '+%H:%M:%S') $*" >> "$LOG"; }
run() { # <bundle> <url list> <label>
  [ -s "$2" ] || return 0
  log "$3: $(wc -l < "$2") urls"
  node "$P/fast-import.mjs" --import-script "$1" --urls "$2" --out "$OUT" --concurrency "$CONC" 2>&1 \
    | grep -E "Completed|❌" | cut -c1-200 >> "$LOG"
}

log "start $T ($IMPORTER)"
node --no-warnings "$P/batch-urls.mjs" "$OUT" "${SAMPLE:-$I/impact/samples/$T.txt}" >> "$LOG" 2>&1
for js in import-corp-fragments import-corp-modal-fragments "$IMPORTER"; do
  bash "$S/aem-import-bundle.sh" --importjs "$I/$js.js" >/dev/null 2>&1 || log "bundle $js failed"
done
run "$I/import-corp-fragments.bundle.js" "$OUT/xf-urls.txt" xfs
run "$I/import-corp-modal-fragments.bundle.js" "$I/data/catalog/modal-urls.txt" modals
run "$I/$IMPORTER.bundle.js" "$OUT/urls.txt" pages
log "documents: $(find "$OUT/content" -name '*.plain.html' 2>/dev/null | wc -l)"
log done
