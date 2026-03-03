#!/bin/bash
# Phase 3 security hardening audit
set -e
export AWS_PROFILE=class
REGION="us-west-2"
API_ID="8p2oc737d9"

echo "=== 1. Encryption at rest ==="
echo -n "  DynamoDB reb-users SSE:    "
aws dynamodb describe-table --table-name reb-users --region $REGION \
  --query "Table.SSEDescription.Status" --output text
echo -n "  DynamoDB reb-listings SSE: "
aws dynamodb describe-table --table-name reb-listings --region $REGION \
  --query "Table.SSEDescription.Status" --output text
echo -n "  S3 reb-photos encryption:  "
aws s3api get-bucket-encryption --bucket reb-photos-902917582511 --region $REGION \
  --query "ServerSideEncryptionConfiguration.Rules[0].ApplyServerSideEncryptionByDefault.SSEAlgorithm" --output text
echo -n "  S3 reb-frontend encryption:"
aws s3api get-bucket-encryption --bucket reb-frontend-902917582511 --region $REGION \
  --query "ServerSideEncryptionConfiguration.Rules[0].ApplyServerSideEncryptionByDefault.SSEAlgorithm" --output text

echo ""
echo "=== 2. S3 public access block ==="
echo "  reb-photos:"
aws s3api get-public-access-block --bucket reb-photos-902917582511 --region $REGION \
  --query "PublicAccessBlockConfiguration" --output json | sed 's/^/    /'

echo ""
echo "=== 3. CloudFront HTTPS redirect ==="
aws cloudfront get-distribution-config --id E2DTZE7SXRJQ4F \
  --query "DistributionConfig.DefaultCacheBehavior.ViewerProtocolPolicy" --output text

echo ""
echo "=== 4. API Gateway routes + authorizers ==="
# Get all resources and their methods
RESOURCES=$(aws apigateway get-resources --rest-api-id $API_ID --region $REGION \
  --query "items[*].{id:id,path:path}" --output json)
echo "$RESOURCES" | python3 -c "
import sys, json, subprocess, os
resources = json.load(sys.stdin)
env = {**os.environ, 'AWS_PROFILE': 'class'}
for r in resources:
    path = r['path']
    rid = r['id']
    try:
        methods_raw = subprocess.check_output([
            'aws', 'apigateway', 'get-resource',
            '--rest-api-id', '8p2oc737d9',
            '--resource-id', rid,
            '--region', 'us-west-2',
            '--query', 'resourceMethods',
            '--output', 'json'
        ], env=env, stderr=subprocess.DEVNULL).decode()
        methods = json.loads(methods_raw)
        if methods:
            for method in methods.keys():
                # Get method details to check authorizer
                method_detail_raw = subprocess.check_output([
                    'aws', 'apigateway', 'get-method',
                    '--rest-api-id', '8p2oc737d9',
                    '--resource-id', rid,
                    '--http-method', method,
                    '--region', 'us-west-2',
                    '--query', '{auth:authorizationType,authorizerId:authorizerId}',
                    '--output', 'json'
                ], env=env, stderr=subprocess.DEVNULL).decode()
                detail = json.loads(method_detail_raw)
                auth = detail.get('auth', 'NONE')
                auth_id = detail.get('authorizerId', '')
                status = 'OK' if auth == 'COGNITO_USER_POOLS' else 'OPEN'
                print(f'  [{status}] {method:7} {path} ({auth}{\" \" + auth_id if auth_id else \"\"})')
        else:
            print(f'  [----] (no methods) {path}')
    except:
        print(f'  [ERR]  {path}')
"

echo ""
echo "=== 5. IAM Lambda role policies ==="
for ROLE in reb-auth-lambda-role reb-listings-lambda-role reb-ai-lambda-role; do
  echo "  $ROLE:"
  aws iam list-attached-role-policies --role-name $ROLE \
    --query "AttachedPolicies[*].PolicyName" --output text | sed 's/^/    /'
done

echo ""
echo "=== 6. Secrets in code (grep check) ==="
cd /home/hollowish/projects/real-estate-buddy
HITS=$(git grep -rn "AKIA\|aws_secret\|902917582511" -- \
  ':(exclude)*.sh' \
  ':(exclude)infrastructure/setup-notes.md' \
  ':(exclude)infrastructure/coordination.md' \
  ':(exclude)docs/*' \
  ':(exclude)*.md' \
  2>/dev/null | grep -v "\.example" | grep -v "git-blame" || true)
if [ -z "$HITS" ]; then
  echo "  No hardcoded keys or account IDs found in source files."
else
  echo "  FOUND:"
  echo "$HITS" | sed 's/^/  /'
fi
