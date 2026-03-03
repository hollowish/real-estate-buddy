#!/bin/bash
export AWS_PROFILE=class

echo "=== Testing Bedrock claude-3-haiku invocation ==="

python3 << 'PYEOF'
import json, subprocess, sys

payload = {
    "anthropic_version": "bedrock-2023-05-31",
    "max_tokens": 64,
    "messages": [{"role": "user", "content": "Reply with only valid JSON: {\"ok\": true}"}]
}

with open('/tmp/bedrock-test-payload.json', 'w') as f:
    json.dump(payload, f)

print("Payload written. Invoking...")
result = subprocess.run(
    [
        'aws', 'bedrock-runtime', 'invoke-model',
        '--model-id', 'anthropic.claude-3-haiku-20240307-v1:0',
        '--content-type', 'application/json',
        '--accept', 'application/json',
        '--body', 'fileb:///tmp/bedrock-test-payload.json',
        '--region', 'us-west-2',
        '/tmp/bedrock-test-response.json'
    ],
    capture_output=True, text=True
)

if result.returncode != 0:
    print("ERROR:", result.stderr)
    sys.exit(1)

with open('/tmp/bedrock-test-response.json') as f:
    response = json.load(f)

text = response.get('content', [{}])[0].get('text', '')
print("Bedrock response text:", text)
PYEOF
