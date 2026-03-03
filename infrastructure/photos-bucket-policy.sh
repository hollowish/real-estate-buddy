#!/bin/bash
# Lock the photos S3 bucket to listings Lambda role only
set -e

export AWS_PROFILE=class
BUCKET="reb-photos-902917582511"
ROLE_ARN="arn:aws:iam::902917582511:role/reb-listings-lambda-role"

cat > /tmp/photos-policy.json << 'EOF'
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "AllowListingsLambda",
      "Effect": "Allow",
      "Principal": {
        "AWS": "arn:aws:iam::902917582511:role/reb-listings-lambda-role"
      },
      "Action": [
        "s3:PutObject",
        "s3:GetObject",
        "s3:DeleteObject"
      ],
      "Resource": "arn:aws:s3:::reb-photos-902917582511/*"
    },
    {
      "Sid": "DenyPublicAccess",
      "Effect": "Deny",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::reb-photos-902917582511/*",
      "Condition": {
        "StringNotEquals": {
          "aws:PrincipalAccount": "902917582511"
        }
      }
    }
  ]
}
EOF

echo "Applying bucket policy to $BUCKET..."
aws s3api put-bucket-policy \
  --bucket "$BUCKET" \
  --policy file:///tmp/photos-policy.json \
  --region us-west-2

echo "Verifying..."
aws s3api get-bucket-policy \
  --bucket "$BUCKET" \
  --region us-west-2 \
  --query Policy \
  --output text | python3 -m json.tool

echo "Done."
