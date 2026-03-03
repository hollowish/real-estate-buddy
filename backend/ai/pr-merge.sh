#!/bin/bash
set -e
REPO="hollowish/real-estate-buddy"

for PR in 3 4 5 6 7 8; do
  echo "=== Merging PR #$PR ==="
  gh pr merge "$PR" --repo "$REPO" --merge --admin 2>&1
  echo ""
done

echo "All PRs merged."
