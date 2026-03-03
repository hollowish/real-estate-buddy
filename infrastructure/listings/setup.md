# Student B — Listings Infrastructure Setup

## Resources

| Resource | Name |
|----------|------|
| DynamoDB Table | `reb-listings` |
| S3 Bucket | `reb-photos-{ACCOUNT_ID}` |
| IAM Role | `reb-listings-lambda-role` |

## Prerequisites

AWS CLI configured with appropriate credentials and region set to `us-west-2`.

Get your Account ID (you'll need it throughout):
```bash
ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
echo $ACCOUNT_ID
```

---

## B.1 — DynamoDB Table: `reb-listings`

### Create the table

```bash
aws dynamodb create-table \
  --table-name reb-listings \
  --attribute-definitions \
    AttributeName=listingId,AttributeType=S \
    AttributeName=userId,AttributeType=S \
  --key-schema \
    AttributeName=listingId,KeyType=HASH \
  --global-secondary-indexes '[
    {
      "IndexName": "userId-index",
      "KeySchema": [{"AttributeName": "userId", "KeyType": "HASH"}],
      "Projection": {"ProjectionType": "ALL"}
    }
  ]' \
  --billing-mode PAY_PER_REQUEST \
  --sse-specification Enabled=true,SSEType=AES256 \
  --region us-west-2
```

### Verify

```bash
aws dynamodb describe-table \
  --table-name reb-listings \
  --region us-west-2 \
  --query 'Table.{Status:TableStatus,SSE:SSEDescription.Status,GSIs:GlobalSecondaryIndexes[*].IndexName}'
```

Expected output: `TableStatus: ACTIVE`, `SSE: ENABLED`, GSI `userId-index` listed.

---

## B.2 — S3 Bucket: `reb-photos-{ACCOUNT_ID}`

### Step 1: Create the bucket

```bash
aws s3api create-bucket \
  --bucket reb-photos-$ACCOUNT_ID \
  --region us-west-2 \
  --create-bucket-configuration LocationConstraint=us-west-2
```

### Step 2: Block all public access

```bash
aws s3api put-public-access-block \
  --bucket reb-photos-$ACCOUNT_ID \
  --public-access-block-configuration \
    BlockPublicAcls=true,IgnorePublicAcls=true,BlockPublicPolicy=true,RestrictPublicBuckets=true
```

### Step 3: Enable SSE-S3 encryption

```bash
aws s3api put-bucket-encryption \
  --bucket reb-photos-$ACCOUNT_ID \
  --server-side-encryption-configuration '{
    "Rules": [{
      "ApplyServerSideEncryptionByDefault": {
        "SSEAlgorithm": "AES256"
      },
      "BucketKeyEnabled": true
    }]
  }'
```

### Step 4: Configure CORS

```bash
aws s3api put-bucket-cors \
  --bucket reb-photos-$ACCOUNT_ID \
  --cors-configuration '{
    "CORSRules": [{
      "AllowedHeaders": ["*"],
      "AllowedMethods": ["PUT", "GET"],
      "AllowedOrigins": [
        "http://localhost:5173",
        "https://{CLOUDFRONT_DOMAIN}"
      ],
      "ExposeHeaders": ["ETag"],
      "MaxAgeSeconds": 3600
    }]
  }'
```

> **Note:** Replace `{CLOUDFRONT_DOMAIN}` with the actual CloudFront domain once Student D sets it up. Re-run this command at that point.

### Verify

```bash
aws s3api get-bucket-encryption --bucket reb-photos-$ACCOUNT_ID
aws s3api get-public-access-block --bucket reb-photos-$ACCOUNT_ID
```

Expected: encryption `AES256`, all four public access blocks `true`.

---

## B.5 — IAM Role: `reb-listings-lambda-role`

### Step 1: Create the role with a Lambda trust policy

```bash
aws iam create-role \
  --role-name reb-listings-lambda-role \
  --assume-role-policy-document '{
    "Version": "2012-10-17",
    "Statement": [{
      "Effect": "Allow",
      "Principal": {"Service": "lambda.amazonaws.com"},
      "Action": "sts:AssumeRole"
    }]
  }'
```

### Step 2: Create the permissions policy from iam-policy.json

Substitute your Account ID into the policy file, then create the policy:

```bash
sed "s/{ACCOUNT_ID}/$ACCOUNT_ID/g" infrastructure/listings/iam-policy.json > /tmp/listings-policy.json

aws iam create-policy \
  --policy-name reb-listings-lambda-policy \
  --policy-document file:///tmp/listings-policy.json
```

### Step 3: Attach the policy to the role

```bash
aws iam attach-role-policy \
  --role-name reb-listings-lambda-role \
  --policy-arn arn:aws:iam::$ACCOUNT_ID:policy/reb-listings-lambda-policy
```

### Verify

```bash
aws iam list-attached-role-policies --role-name reb-listings-lambda-role
```

Expected: `reb-listings-lambda-policy` listed.

---

## Resource Summary

Fill in the ARNs after creation and share with the team (Student D needs the role ARN to configure the Lambda):

| Resource | Name | ARN |
|----------|------|-----|
| DynamoDB Table | `reb-listings` | `arn:aws:dynamodb:us-west-2:{ACCOUNT_ID}:table/reb-listings` |
| DynamoDB GSI | `userId-index` | `arn:aws:dynamodb:us-west-2:{ACCOUNT_ID}:table/reb-listings/index/userId-index` |
| S3 Bucket | `reb-photos-{ACCOUNT_ID}` | `arn:aws:s3:::reb-photos-{ACCOUNT_ID}` |
| IAM Role | `reb-listings-lambda-role` | `arn:aws:iam::{ACCOUNT_ID}:role/reb-listings-lambda-role` |
