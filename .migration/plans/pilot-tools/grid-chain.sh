#!/bin/bash
# after the pd-titles run: the pilot regression with the grid layouts (run-all.sh 9), then the
# re-import of the product-detail XFs / pages the grid layouts change (out/pd-grid)
#   nohup bash grid-chain.sh > /dev/null 2>&1 &
S=/home/node/.excat-marketplaces/excat-marketplace/excat/skills/excat-content-import/scripts
R=/backups/aemdemos/patients-stryker/repo
T=$R/.migration/plans/pilot-tools
LOG=$T/out/grid-chain.log
log() { echo "$(date '+%H:%M:%S') $*" >> "$LOG"; }

while pgrep -f "full-import.sh product-detail .*pd-titles" > /dev/null; do sleep 60; done
log "pd-titles finished"
bash $T/run-all.sh 9
log "pilots done"
OUT=$T/out/pd-grid
mkdir -p "$OUT"
cp $T/out/pd-full/grid-xfs.txt "$OUT/xf-urls.txt"
cp $T/out/pd-full/grid-pages.txt "$OUT/urls.txt"
bash $S/aem-import-bundle.sh --importjs $R/tools/importer/import-xf-fragments.js > /dev/null 2>&1 || log "bundle xf failed"
bash $S/aem-import-bundle.sh --importjs $R/tools/importer/import-product-detail.js > /dev/null 2>&1 || log "bundle pd failed"
(cd "$OUT" && WORKSPACE_PATH=$OUT node $S/run-bulk-import.js --import-script $R/tools/importer/import-xf-fragments.bundle.js \
  --urls "$OUT/xf-urls.txt" 2>&1 | grep -E "Completed|Failures: [1-9]|✗" | cut -c1-200 >> "$LOG")
(cd "$OUT" && WORKSPACE_PATH=$OUT node $S/run-bulk-import.js --import-script $R/tools/importer/import-product-detail.bundle.js \
  --urls "$OUT/urls.txt" 2>&1 | grep -E "Completed|Failures: [1-9]|✗" | cut -c1-200 >> "$LOG")
log "pd-grid done"
