#!/bin/bash
# full template import into the local preview drafts, resumable:
#   full-import.sh <importer> <page list> <run name> [chunk size]
# e.g. full-import.sh product-detail out/pd-all.txt pd-full 50
# - output (the raw import, as it would go to DA) in out/<run name>/content, kept across
#   restarts (out/ is git-ignored); re-running the same command resumes: pages and XFs already
#   saved are reused (no --force)
# - the XFs of all pages first, then the pages, in chunks; after every chunk the result is
#   copied to the preview: pages under content/drafts/reimport, fragments under
#   content/us/en/fragments (fragment links get the local /content prefix there)
# - progress in out/<run name>/progress.log; coverage and link check at the end
S=/home/node/.excat-marketplaces/excat-marketplace/excat/skills/excat-content-import/scripts
R=/backups/aemdemos/patients-stryker/repo
T=$R/.migration/plans/pilot-tools
IMPORTER=import-$1
LIST=$2
OUT=$T/out/$3
CHUNK=${4:-50}
LOG=$OUT/progress.log
mkdir -p "$OUT/chunks"
FR='us/en/fragments/'

log() { echo "$(date '+%H:%M:%S') $*" >> "$LOG"; }

copy_preview() {
  if [ -d "$OUT/content/$FR" ]; then
    find "$OUT/content/$FR" -name "*.plain.html" | while read -r f; do
      rel=${f#"$OUT/content/"}
      mkdir -p "$R/content/$(dirname "$rel")"
      cp "$f" "$R/content/$rel"
    done
  fi
  cut -f2 "$OUT/pages.tsv" | while read -r EDS; do
    PAGE=${EDS#/}
    [ -f "$OUT/content/$PAGE.plain.html" ] || continue
    mkdir -p "$R/content/drafts/reimport/$(dirname "$PAGE")"
    sed "s#\"/$FR#\"/content/$FR#g; s#>/$FR#>/content/$FR#g" "$OUT/content/$PAGE.plain.html" > "$R/content/drafts/reimport/$PAGE.plain.html"
  done
}

run_chunks() { # <bundle> <url list> <label>
  split -l "$CHUNK" -d -a 3 "$2" "$OUT/chunks/$3-"
  for c in "$OUT/chunks/$3-"*; do
    log "$3 $(basename "$c"): $(wc -l < "$c") urls"
    (cd "$OUT" && WORKSPACE_PATH=$OUT node $S/run-bulk-import.js --import-script "$1" --urls "$c" 2>&1 \
      | grep -E "Completed|Failures: [1-9]|✗" | cut -c1-200 >> "$LOG")
    copy_preview
  done
}

log "start $IMPORTER $LIST (chunks of $CHUNK)"
node $T/batch-urls.mjs "$OUT" "$LIST" >> "$LOG" 2>&1
bash $S/aem-import-bundle.sh --importjs $R/tools/importer/import-xf-fragments.js >/dev/null 2>&1 || log "bundle import-xf-fragments failed"
bash $S/aem-import-bundle.sh --importjs $R/tools/importer/$IMPORTER.js >/dev/null 2>&1 || log "bundle $IMPORTER failed"
rm -f "$OUT/chunks/"*
[ -s "$OUT/xf-urls.txt" ] && run_chunks $R/tools/importer/import-xf-fragments.bundle.js "$OUT/xf-urls.txt" xf
run_chunks $R/tools/importer/$IMPORTER.bundle.js "$OUT/urls.txt" pages
cd $R || exit 1
node tools/importer/migration-index/check-coverage.js "$OUT/content" 2>&1 | grep -vE "Warning|Reparsing|trace-warnings|To eliminate|author-only" > "$OUT/coverage.txt"
log "coverage: $(grep -c '^ok' "$OUT/coverage.txt") ok, $(grep -vc '^ok' "$OUT/coverage.txt") other lines"
log "links: $(grep -roE 'href="(https://www\.stryker\.com)?/[^"]*(\.html|/index)([?#][^"]*)?"' "$OUT/content" --include=*.plain.html | wc -l) .html / /index links"
log "imported pages: $(cut -f2 "$OUT/pages.tsv" | while read -r e; do [ -f "$OUT/content${e}.plain.html" ] && echo x; done | wc -l) of $(wc -l < "$OUT/pages.tsv")"
log done
touch "$OUT/done"
