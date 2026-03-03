#!/bin/bash
export AWS_PROFILE=class
for ROLE in reb-auth-lambda-role reb-listings-lambda-role reb-ai-lambda-role; do
  echo "=== $ROLE ==="
  POLICY_NAME=$(aws iam list-role-policies --role-name "$ROLE" \
    --query "PolicyNames[0]" --output text)
  aws iam get-role-policy --role-name "$ROLE" --policy-name "$POLICY_NAME" \
    --query "PolicyDocument" --output json
  echo ""
done
