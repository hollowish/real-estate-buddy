#!/bin/bash
# End-to-end test: create a listing in DynamoDB, then invoke the Lambda to score it.

export AWS_PROFILE=class
TEST_USER="test-user-smoke-check"
LISTING_ID="test-listing-$(date +%s)"
REGION="us-west-2"

echo "=== Step 1: Insert test listing into DynamoDB ==="
python3 << PYEOF
import json, subprocess

item = {
    "listingId": {"S": "$LISTING_ID"},
    "userId": {"S": "$TEST_USER"},
    "address": {"S": "456 Oak Ave, Portland, OR 97201"},
    "price": {"N": "620000"},
    "bedrooms": {"N": "3"},
    "bathrooms": {"N": "2"},
    "sqft": {"N": "1600"},
    "notes": {"S": "Great natural light, updated kitchen, close to transit"}
}

with open('/tmp/test-listing-item.json', 'w') as f:
    json.dump(item, f)

result = subprocess.run(
    ['aws', 'dynamodb', 'put-item',
     '--table-name', 'reb-listings',
     '--item', 'file:///tmp/test-listing-item.json',
     '--region', '$REGION'],
    capture_output=True, text=True
)
if result.returncode != 0:
    print("ERROR:", result.stderr)
    exit(1)
print("Listing inserted: $LISTING_ID")
PYEOF

echo ""
echo "=== Step 2: Invoke Lambda to score the listing ==="
python3 << PYEOF
import json, subprocess, time

payload = {
    "httpMethod": "POST",
    "path": "/api/ai/score",
    "requestContext": {
        "authorizer": {
            "claims": {
                "sub": "$TEST_USER"
            }
        }
    },
    "body": json.dumps({"listingId": "$LISTING_ID"})
}

with open('/tmp/test-e2e-payload.json', 'w') as f:
    json.dump(payload, f)

time.sleep(2)

result = subprocess.run(
    ['aws', 'lambda', 'invoke',
     '--function-name', 'reb-ai-scoring',
     '--cli-binary-format', 'raw-in-base64-out',
     '--payload', 'file:///tmp/test-e2e-payload.json',
     '--region', '$REGION',
     '/tmp/test-e2e-response.json'],
    capture_output=True, text=True
)
if result.returncode != 0:
    print("Invoke error:", result.stderr)
    exit(1)

with open('/tmp/test-e2e-response.json') as f:
    raw = f.read()

print("Raw Lambda response:")
print(raw)

try:
    outer = json.loads(raw)
    body = json.loads(outer.get('body', '{}'))
    print("\n--- Parsed ---")
    print(f"Status: {outer.get('statusCode')}")
    if 'score' in body:
        print(f"Score: {body['score']}")
        print(f"Pros: {body.get('pros', [])}")
        print(f"Cons: {body.get('cons', [])}")
        print(f"Summary: {body.get('summary', '')}")
    else:
        print(f"Body: {body}")
except Exception as e:
    print("Parse error:", e)
PYEOF

echo ""
echo "=== Step 3: Confirm score was persisted in DynamoDB ==="
aws dynamodb get-item \
  --table-name reb-listings \
  --key "{\"listingId\": {\"S\": \"$LISTING_ID\"}}" \
  --projection-expression "listingId, aiScore, aiScoredAt" \
  --region $REGION

echo ""
echo "=== Cleanup: remove test listing ==="
aws dynamodb delete-item \
  --table-name reb-listings \
  --key "{\"listingId\": {\"S\": \"$LISTING_ID\"}}" \
  --region $REGION
echo "Test listing deleted."
