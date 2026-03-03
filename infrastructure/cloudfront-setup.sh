#!/bin/bash
# Creates CloudFront OAC + distribution for the frontend S3 bucket.
# Run once. Records outputs to /tmp/cloudfront-output.json and prints them.
set -e
export AWS_PROFILE=class
BUCKET="reb-frontend-902917582511"
REGION="us-west-2"
ACCOUNT_ID="902917582511"

echo "=== Step 1: Create Origin Access Control ==="
OAC_OUTPUT=$(aws cloudfront create-origin-access-control \
  --origin-access-control-config '{
    "Name": "reb-frontend-oac",
    "Description": "OAC for reb-frontend S3 bucket",
    "OriginAccessControlOriginType": "s3",
    "SigningBehavior": "always",
    "SigningProtocol": "sigv4"
  }' \
  --output json)

OAC_ID=$(echo "$OAC_OUTPUT" | python3 -c "import json,sys; print(json.load(sys.stdin)['OriginAccessControl']['Id'])")
echo "  OAC ID: $OAC_ID"

echo ""
echo "=== Step 2: Create CloudFront Distribution ==="

# Managed cache policy IDs (AWS-provided, no need to create)
# CachingOptimized = 658327ea-f89d-4fab-a63d-7e88639e58f6
# CachingDisabled  = 4135ea2d-6df8-44a3-9df3-4b5a84be39ad

python3 << PYEOF
import json

config = {
    "CallerReference": "reb-frontend-2026",
    "Comment": "Real Estate Buddy frontend",
    "DefaultRootObject": "index.html",
    "Origins": {
        "Quantity": 1,
        "Items": [{
            "Id": "reb-frontend-s3",
            "DomainName": f"$BUCKET.s3.$REGION.amazonaws.com",
            "S3OriginConfig": {"OriginAccessIdentity": ""},
            "OriginAccessControlId": "$OAC_ID"
        }]
    },
    "DefaultCacheBehavior": {
        "TargetOriginId": "reb-frontend-s3",
        "ViewerProtocolPolicy": "redirect-to-https",
        "AllowedMethods": {"Quantity": 2, "Items": ["GET", "HEAD"]},
        "CachePolicyId": "658327ea-f89d-4fab-a63d-7e88639e58f6",
        "Compress": True
    },
    "CustomErrorResponses": {
        "Quantity": 2,
        "Items": [
            {
                "ErrorCode": 403,
                "ResponsePagePath": "/index.html",
                "ResponseCode": "200",
                "ErrorCachingMinTTL": 0
            },
            {
                "ErrorCode": 404,
                "ResponsePagePath": "/index.html",
                "ResponseCode": "200",
                "ErrorCachingMinTTL": 0
            }
        ]
    },
    "PriceClass": "PriceClass_100",
    "HttpVersion": "http2",
    "IsIPV6Enabled": True,
    "Enabled": True
}

with open("/tmp/cf-config.json", "w") as f:
    json.dump(config, f, indent=2)
print("Distribution config written to /tmp/cf-config.json")
PYEOF

DIST_OUTPUT=$(aws cloudfront create-distribution \
  --distribution-config file:///tmp/cf-config.json \
  --output json)

DIST_ID=$(echo "$DIST_OUTPUT" | python3 -c "import json,sys; d=json.load(sys.stdin); print(d['Distribution']['Id'])")
DIST_DOMAIN=$(echo "$DIST_OUTPUT" | python3 -c "import json,sys; d=json.load(sys.stdin); print(d['Distribution']['DomainName'])")
DIST_ARN=$(echo "$DIST_OUTPUT" | python3 -c "import json,sys; d=json.load(sys.stdin); print(d['Distribution']['ARN'])")

echo "  Distribution ID:  $DIST_ID"
echo "  Domain:           $DIST_DOMAIN"
echo "  ARN:              $DIST_ARN"

echo ""
echo "=== Step 3: Update S3 Bucket Policy ==="
python3 << PYEOF
import json

policy = {
    "Version": "2012-10-17",
    "Statement": [{
        "Sid": "AllowCloudFrontOAC",
        "Effect": "Allow",
        "Principal": {"Service": "cloudfront.amazonaws.com"},
        "Action": "s3:GetObject",
        "Resource": "arn:aws:s3:::$BUCKET/*",
        "Condition": {
            "StringEquals": {
                "AWS:SourceArn": "$DIST_ARN"
            }
        }
    }]
}

with open("/tmp/bucket-policy.json", "w") as f:
    json.dump(policy, f, indent=2)
print("Bucket policy written to /tmp/bucket-policy.json")
PYEOF

aws s3api put-bucket-policy \
  --bucket "$BUCKET" \
  --policy file:///tmp/bucket-policy.json
echo "  Bucket policy applied."

echo ""
echo "=== Step 4: Upload test page to verify serving ==="
echo "<html><body><h1>Real Estate Buddy — CloudFront working!</h1></body></html>" \
  > /tmp/test-index.html
aws s3 cp /tmp/test-index.html "s3://$BUCKET/index.html" \
  --content-type "text/html"
echo "  Test index.html uploaded."

echo ""
echo "=== Step 5: Save outputs ==="
python3 << PYEOF
import json
outputs = {
    "distributionId": "$DIST_ID",
    "domain": "$DIST_DOMAIN",
    "arn": "$DIST_ARN",
    "oacId": "$OAC_ID",
    "bucket": "$BUCKET"
}
with open("/tmp/cloudfront-output.json", "w") as f:
    json.dump(outputs, f, indent=2)
print(json.dumps(outputs, indent=2))
PYEOF

echo ""
echo "=== Done ==="
echo "Distribution is deploying — takes ~5 minutes to go live globally."
echo "Test URL: https://$DIST_DOMAIN"
echo "Check status: aws cloudfront get-distribution --id $DIST_ID --query 'Distribution.Status' --output text"
