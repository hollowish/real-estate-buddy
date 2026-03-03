#!/bin/bash
set -e
cd /home/hollowish/projects/real-estate-buddy/backend/auth

echo "=== Zipping handler.mjs ==="
python3 -c "
import zipfile
with zipfile.ZipFile('/tmp/auth.zip', 'w', zipfile.ZIP_DEFLATED) as z:
    z.write('handler.mjs')
print('Created /tmp/auth.zip')
"

echo "=== Deploying to reb-auth-handler ==="
export AWS_PROFILE=class
aws lambda update-function-code \
  --function-name reb-auth-handler \
  --zip-file fileb:///tmp/auth.zip \
  --region us-west-2 \
  --query 'CodeSize' \
  --output text

echo "=== Waiting for update to complete ==="
aws lambda wait function-updated \
  --function-name reb-auth-handler \
  --region us-west-2

echo "=== Done ==="
