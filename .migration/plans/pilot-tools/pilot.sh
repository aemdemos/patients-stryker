#!/bin/bash
# pilot helper for ONE page (kept outside /tmp, survives resets); for several pages use
# pilot-batch.sh (one bundle, one browser, coverage once) and compare.mjs (cached live):
#   pilot.sh <page path, EDS or AEM names, e.g. /us/en/x/products/y> [importer, default product-detail]
# bundles, imports the page's XFs and the page into /tmp/pilotPD, runs coverage + link check,
# copies the preview (page under content/drafts/reimport, fragments under content/us/en/fragments)
S=/home/node/.excat-marketplaces/excat-marketplace/excat/skills/excat-content-import/scripts
R=/backups/aemdemos/patients-stryker/repo
P=$1
IMPORTER=import-${2:-product-detail}
mkdir -p /tmp/pilotPD /tmp/playwright
EDS=$(node $R/.migration/plans/pilot-tools/urls.mjs "$P") || exit 1
for f in $IMPORTER import-xf-fragments; do
  bash $S/aem-import-bundle.sh --importjs $R/tools/importer/$f.js >/dev/null 2>&1 || echo "bundle $f failed"
done
cd /tmp/pilotPD || exit 1
if [ -s /tmp/pilotPD/xf-urls.txt ]; then
  WORKSPACE_PATH=/tmp/pilotPD node $S/run-bulk-import.js --import-script $R/tools/importer/import-xf-fragments.bundle.js \
    --urls /tmp/pilotPD/xf-urls.txt --force 2>&1 | grep -E "Saved|Failures|corp-page" | cut -c1-400
fi
WORKSPACE_PATH=/tmp/pilotPD node $S/run-bulk-import.js --import-script $R/tools/importer/$IMPORTER.bundle.js \
  --urls /tmp/pilotPD/urls.txt --force 2>&1 | grep -E "Saved|Failures|corp-page" | cut -c1-700
cd $R || exit 1
echo "== coverage"
node tools/importer/migration-index/check-coverage.js /tmp/pilotPD/content 2>&1 | grep -vE "Warning|Reparsing|trace-warnings|To eliminate|author-only"
echo "== links"
grep -roE 'href="(https://www\.stryker\.com)?/[^"]*(\.html|/index)([?#][^"]*)?"' /tmp/pilotPD/content --include=*.plain.html | head -5
OUT=/tmp/pilotPD/content
PAGE=${EDS#/}
FR='us/en/fragments/'
mkdir -p "$R/content/drafts/reimport/$(dirname "$PAGE")"
sed "s#\"/$FR#\"/content/$FR#g; s#>/$FR#>/content/$FR#g" "$OUT/$PAGE.plain.html" > "$R/content/drafts/reimport/$PAGE.plain.html"
if [ -d "$OUT/$FR" ]; then
  find "$OUT/$FR" -name "*.plain.html" | while read -r f; do
    rel=${f#"$OUT/"}
    mkdir -p "$R/content/$(dirname "$rel")"
    cp "$f" "$R/content/$rel"
  done
fi
echo "== preview copied: /content/drafts/reimport/$PAGE"
