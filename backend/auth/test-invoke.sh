#!/bin/bash
set -e
export AWS_PROFILE=class

echo "=== Test 1: No auth header → expect 401 ==="
python3 -c "
import json
payload = {
    'httpMethod': 'GET',
    'path': '/api/auth/profile',
    'requestContext': {},
    'body': None
}
with open('/tmp/auth-test-nojwt.json', 'w') as f:
    json.dump(payload, f)
print('Payload written.')
"

aws lambda invoke \
  --function-name reb-auth-handler \
  --cli-binary-format raw-in-base64-out \
  --payload file:///tmp/auth-test-nojwt.json \
  --region us-west-2 \
  /tmp/auth-test-nojwt-response.json 2>&1
echo "Response:"
cat /tmp/auth-test-nojwt-response.json
echo ""

echo ""
echo "=== Test 2: GET with valid JWT claims → expect 404 (profile not found) or 200 ==="
python3 -c "
import json
payload = {
    'httpMethod': 'GET',
    'path': '/api/auth/profile',
    'requestContext': {
        'authorizer': {
            'claims': {
                'sub': 'test-user-auth-smoke'
            }
        }
    },
    'body': None
}
with open('/tmp/auth-test-get.json', 'w') as f:
    json.dump(payload, f)
print('Payload written.')
"

aws lambda invoke \
  --function-name reb-auth-handler \
  --cli-binary-format raw-in-base64-out \
  --payload file:///tmp/auth-test-get.json \
  --region us-west-2 \
  /tmp/auth-test-get-response.json 2>&1
echo "Response:"
cat /tmp/auth-test-get-response.json
echo ""
