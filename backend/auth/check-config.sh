#!/bin/bash
export AWS_PROFILE=class
aws lambda get-function-configuration \
  --function-name reb-auth-handler \
  --region us-west-2 \
  --output json | python3 -c "
import json, sys
c = json.load(sys.stdin)
print('Runtime:', c['Runtime'])
print('Handler:', c['Handler'])
print('State:  ', c['State'])
"
