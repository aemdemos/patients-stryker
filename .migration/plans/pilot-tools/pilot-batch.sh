#!/bin/bash
# batch pilot import: pilot-batch.sh <importer> <list> [<importer> <list> …]
# One run per importer: bundles once, imports the XFs of all its pages once, then all pages in
# one browser session; coverage and link check once at the end; the result is copied to the
# preview (pages under content/drafts/reimport, fragments under content/us/en/fragments).
# Faster than pilot.sh per page (no rebundling, one browser per importer).
S=/home/node/.excat-marketplaces/excat-marketplace/excat/skills/excat-content-import/scripts
R=/backups/aemdemos/patients-stryker/repo
T=$R/.migration/plans/pilot-tools
OUT=/tmp/pilotPD
mkdir -p $OUT
bash $S/aem-import-bundle.sh --importjs $R/tools/importer/import-xf-fragments.js >/dev/null 2>&1 || echo "bundle import-xf-fragments failed"
: > $OUT/all-pages.tsv
while [ $# -ge 2 ]; do
  IMPORTER=import-$1
  LIST=$2
  shift 2
  RUN=$OUT/run-$(basename "$LIST" .txt)
  node $T/batch-urls.mjs "$RUN" "$LIST" || exit 1
  cat "$RUN/pages.tsv" >> $OUT/all-pages.tsv
  bash $S/aem-import-bundle.sh --importjs $R/tools/importer/$IMPORTER.js >/dev/null 2>&1 || echo "bundle $IMPORTER failed"
  (cd $OUT || exit 1
    if [ -s "$RUN/xf-urls.txt" ]; then
      WORKSPACE_PATH=$OUT node $S/run-bulk-import.js --import-script $R/tools/importer/import-xf-fragments.bundle.js \
        --urls "$RUN/xf-urls.txt" --force 2>&1 | grep -E "Completed|Failures: [1-9]|Unexpected" | cut -c1-200
    fi
    WORKSPACE_PATH=$OUT node $S/run-bulk-import.js --import-script $R/tools/importer/$IMPORTER.bundle.js \
      --urls "$RUN/urls.txt" --force 2>&1 | grep -E "Completed|Failures: [1-9]|Unexpected|✗|failed" | cut -c1-200)
done
cd $R || exit 1
echo "== coverage"
node tools/importer/migration-index/check-coverage.js $OUT/content 2>&1 | grep -vE "Warning|Reparsing|trace-warnings|To eliminate|author-only" > $OUT/coverage.txt
echo "$(grep -c '^ok' $OUT/coverage.txt) ok"; grep -v '^ok' $OUT/coverage.txt | head -10
echo "== links"
grep -roE 'href="(https://www\.stryker\.com)?/[^"]*(\.html|/index)([?#][^"]*)?"' $OUT/content --include=*.plain.html | head -5
FR='us/en/fragments/'
cut -f2 $OUT/all-pages.tsv | while read -r EDS; do
  PAGE=${EDS#/}
  [ -f "$OUT/content/$PAGE.plain.html" ] || { echo "not imported: $EDS"; continue; }
  mkdir -p "$R/content/drafts/reimport/$(dirname "$PAGE")"
  sed "s#\"/$FR#\"/content/$FR#g; s#>/$FR#>/content/$FR#g" "$OUT/content/$PAGE.plain.html" > "$R/content/drafts/reimport/$PAGE.plain.html"
done
if [ -d "$OUT/content/$FR" ]; then
  find "$OUT/content/$FR" -name "*.plain.html" | while read -r f; do
    rel=${f#"$OUT/content/"}
    mkdir -p "$R/content/$(dirname "$rel")"
    cp "$f" "$R/content/$rel"
  done
fi
echo "== preview copied: $(wc -l < $OUT/all-pages.tsv) pages"
