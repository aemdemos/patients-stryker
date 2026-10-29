#!/bin/bash
# all pilots: batch re-import, then the comparison with live (results in out/, git-ignored)
#   run-all.sh [--refresh-live] [suffix]
# Run it in the background: nohup bash run-all.sh --refresh-live 3 > /dev/null 2>&1 &
T=/backups/aemdemos/patients-stryker/repo/.migration/plans/pilot-tools
REFRESH=""
if [ "$1" = "--refresh-live" ]; then REFRESH="--refresh-live"; shift; fi
SUFFIX=${1:-latest}
bash $T/pilot-batch.sh product-detail $T/pd-pilots.txt long-page-detail $T/lpd-pilots.txt \
  tier2-landing-page $T/t2-pilots.txt news-detail $T/nd-pilots.txt > $T/out/batch-$SUFFIX.log 2>&1
cd $T || exit 1
node compare.mjs out/pdlpd-$SUFFIX.json pd-pilots.txt lpd-pilots.txt $REFRESH > out/cmp-pdlpd-$SUFFIX.txt 2>&1
node compare.mjs out/t2nd-$SUFFIX.json t2-pilots.txt nd-pilots.txt $REFRESH > out/cmp-t2nd-$SUFFIX.txt 2>&1
echo done > out/done-$SUFFIX
