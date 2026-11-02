#!/bin/bash
# compares the .plain.html outputs of two import runs: diff-runs.sh <run dir A> <run dir B>
# (files of A missing in B count as missing); prints the differing paths and a summary
A=$1/content
B=$2/content
same=0
diff=0
missing=0
while read -r f; do
  rel=${f#"$A/"}
  if [ ! -f "$B/$rel" ]; then missing=$((missing + 1)); echo "MISSING $rel"
  elif cmp -s "$f" "$B/$rel"; then same=$((same + 1))
  else diff=$((diff + 1)); echo "DIFF $rel"; fi
done < <(find "$A" -name "*.plain.html" | sort)
echo "same $same, different $diff, missing $missing"
