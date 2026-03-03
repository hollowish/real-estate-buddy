#!/bin/bash
# Smoke test: invoke the Lambda directly with a fake event.
# Expected result: 400 (missing listingId) or 401 (no userId in claims).
# This confirms the handler is running — not the stub.

export AWS_PROFILE=class

python3 << 'PYEOF'
import json

payload = {
    "httpMethod": "POST",
    "path": "/api/ai/score",
    "requestContext": {
        "authorizer": {
            "claims": {
                "sub": "test-user-smoke-check"
            }
        }
    },
    "body": "{}"   # no listingId — should return 400
}

with open('/tmp/test-invoke-payload.json', 'w') as f:
    json.dump(payload, f)
print("Payload written.")
PYEOF

sleep 3   # wait for Lambda update to finish

aws lambda invoke \
  --function-name reb-ai-scoring \
  --cli-binary-format raw-in-base64-out \
  --payload file:///tmp/test-invoke-payload.json \
  --region us-west-2 \
  /tmp/test-invoke-response.json 2>&1

echo "Lambda response:"
cat /tmp/test-invoke-response.json
