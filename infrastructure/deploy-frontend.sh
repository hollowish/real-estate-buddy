#!/bin/bash
# Builds the React app and deploys to S3 + invalidates CloudFront cache.
# Run from the repo root.
set -e
export AWS_PROFILE=class
BUCKET="reb-frontend-902917582511"
DIST_ID="E2DTZE7SXRJQ4F"
REPO_ROOT="/home/hollowish/projects/real-estate-buddy"

echo "=== Step 1: Build React app ==="
export PATH="/home/hollowish/.local/share/fnm/node-versions/v22.22.0/installation/bin:/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin"
cd "$REPO_ROOT/frontend"
npm run build
echo "  Build complete: frontend/dist/"

echo ""
echo "=== Step 2: Sync to S3 ==="
cd "$REPO_ROOT"
aws s3 sync frontend/dist/ "s3://$BUCKET/" \
  --delete \
  --cache-control "public, max-age=31536000, immutable" \
  --exclude "*.html"

# HTML files: no-cache so users always get the latest app shell
aws s3 sync frontend/dist/ "s3://$BUCKET/" \
  --delete \
  --cache-control "no-cache" \
  --include "*.html" \
  --exclude "*"

echo "  S3 sync complete."

echo ""
echo "=== Step 3: Invalidate CloudFront cache ==="
INVALIDATION_ID=$(aws cloudfront create-invalidation \
  --distribution-id "$DIST_ID" \
  --paths "/*" \
  --query 'Invalidation.Id' \
  --output text)
echo "  Invalidation ID: $INVALIDATION_ID"
echo "  (Takes ~30s to propagate)"

echo ""
echo "=== Done ==="
echo "  Live at: https://dmvpgocbfurdm.cloudfront.net"
