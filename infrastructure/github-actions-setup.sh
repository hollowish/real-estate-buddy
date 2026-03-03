#!/bin/bash
# Create IAM user + policy for GitHub Actions CI/CD
# Run once, then add the output keys to GitHub Secrets.
#
# After running, add these secrets to GitHub:
#   Settings → Secrets and variables → Actions → New repository secret
#
# Secrets to add:
#   AWS_ACCESS_KEY_ID          (from output below)
#   AWS_SECRET_ACCESS_KEY      (from output below)
#   AWS_REGION                 us-west-2
#   S3_BUCKET                  reb-frontend-902917582511
#   CLOUDFRONT_DISTRIBUTION_ID E2DTZE7SXRJQ4F
set -e

export AWS_PROFILE=class
ACCOUNT_ID="902917582511"
USER_NAME="reb-github-actions"
POLICY_NAME="reb-github-actions-policy"

echo "Creating IAM policy..."
cat > /tmp/gha-policy.json << 'EOF'
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "S3Frontend",
      "Effect": "Allow",
      "Action": ["s3:PutObject", "s3:GetObject", "s3:DeleteObject", "s3:ListBucket"],
      "Resource": [
        "arn:aws:s3:::reb-frontend-902917582511",
        "arn:aws:s3:::reb-frontend-902917582511/*"
      ]
    },
    {
      "Sid": "CloudFrontInvalidate",
      "Effect": "Allow",
      "Action": "cloudfront:CreateInvalidation",
      "Resource": "arn:aws:cloudfront::902917582511:distribution/E2DTZE7SXRJQ4F"
    },
    {
      "Sid": "LambdaDeploy",
      "Effect": "Allow",
      "Action": [
        "lambda:UpdateFunctionCode",
        "lambda:GetFunction",
        "lambda:GetFunctionConfiguration"
      ],
      "Resource": [
        "arn:aws:lambda:us-west-2:902917582511:function:reb-ai-scoring",
        "arn:aws:lambda:us-west-2:902917582511:function:reb-auth-handler",
        "arn:aws:lambda:us-west-2:902917582511:function:reb-listings-handler"
      ]
    }
  ]
}
EOF

POLICY_ARN=$(aws iam create-policy \
  --policy-name "$POLICY_NAME" \
  --policy-document file:///tmp/gha-policy.json \
  --query Policy.Arn \
  --output text 2>&1)

if echo "$POLICY_ARN" | grep -q "EntityAlreadyExists"; then
  echo "Policy already exists, getting ARN..."
  POLICY_ARN="arn:aws:iam::${ACCOUNT_ID}:policy/${POLICY_NAME}"
else
  echo "Policy created: $POLICY_ARN"
fi

echo "Creating IAM user $USER_NAME..."
aws iam create-user --user-name "$USER_NAME" 2>&1 | grep -v "EntityAlreadyExists" || true

echo "Attaching policy..."
aws iam attach-user-policy \
  --user-name "$USER_NAME" \
  --policy-arn "$POLICY_ARN"

echo "Generating access keys..."
KEYS=$(aws iam create-access-key --user-name "$USER_NAME" --output json)

ACCESS_KEY=$(echo "$KEYS" | python3 -c "import sys,json; k=json.load(sys.stdin)['AccessKey']; print(k['AccessKeyId'])")
SECRET_KEY=$(echo "$KEYS" | python3 -c "import sys,json; k=json.load(sys.stdin)['AccessKey']; print(k['SecretAccessKey'])")

echo ""
echo "============================================================"
echo "  Add these secrets to GitHub:"
echo "  github.com/hollowish/real-estate-buddy → Settings → Secrets and variables → Actions"
echo "============================================================"
echo ""
echo "  AWS_ACCESS_KEY_ID:          $ACCESS_KEY"
echo "  AWS_SECRET_ACCESS_KEY:      $SECRET_KEY"
echo "  AWS_REGION:                 us-west-2"
echo "  S3_BUCKET:                  reb-frontend-902917582511"
echo "  CLOUDFRONT_DISTRIBUTION_ID: E2DTZE7SXRJQ4F"
echo ""
echo "============================================================"
echo "  IMPORTANT: Save these keys now — the secret key is not shown again."
echo "============================================================"
