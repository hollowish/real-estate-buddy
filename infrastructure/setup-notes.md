# AWS Infrastructure Setup Notes

## AWS Account

**Account name:** `class-sandbox`
**Account ID:** `902917582511`
**Region:** `us-west-2`

Craig (@hollowish) owns the AWS account and executes all infrastructure changes on behalf of the team. Teammates specify what they need; Craig creates it in AWS.

---

## CLI Setup

Craig uses AWS Organizations with two accounts. **Always confirm you are in the right one before running any `reb-*` commands:**

```bash
export AWS_PROFILE=class
aws sts get-caller-identity   # must show Account: "902917582511"
```

AWS config (`~/.aws/config`):

```ini
[default]
region = us-west-2
output = json

[profile class]
role_arn = arn:aws:iam::902917582511:role/OrganizationAccountAccessRole
source_profile = default
region = us-west-2
```

> **Warning:** The `default` profile points to Craig's personal resume-site account (`370686332271`).
> Never run project commands without `--profile class` or `export AWS_PROFILE=class`.

---

## Resource Naming

All resources use the `class-sandbox` account ID (`902917582511`):

- S3 photos bucket: `reb-photos-902917582511`
- S3 frontend bucket: `reb-frontend-902917582511`
- All other resources follow the `reb-*` naming convention

---

## AWS Services to Create (in order)

1. **Cognito User Pool** — Craig creates; Enayatullah (Student A) configures
2. **DynamoDB Tables** — Craig creates both
   - `reb-users` — partition key: `userId` (String)
   - `reb-listings` — partition key: `listingId` (String), GSI: `userId-index`
3. **S3 Buckets** — Craig creates both
   - `reb-photos-902917582511` — photo uploads (Block Public Access ON, SSE-S3 enabled)
   - `reb-frontend-902917582511` — React SPA hosting
4. **IAM Execution Roles** — Craig creates all three
   - `reb-auth-lambda-role` — DynamoDB read/write on `reb-users` + CloudWatch Logs
   - `reb-listings-lambda-role` — DynamoDB read/write on `reb-listings` + S3 put/get on `reb-photos` + CloudWatch Logs
   - `reb-ai-lambda-role` — DynamoDB read on `reb-listings` + `reb-users`, DynamoDB write on `reb-listings`, Bedrock InvokeModel + CloudWatch Logs
5. **Lambda Functions** — Craig deploys each student's code as it merges to `main`
   - `reb-auth-handler` (Enayatullah's code)
   - `reb-listings-handler` (Rob's code)
   - `reb-ai-scoring` (Craig's code)
6. **API Gateway** — Craig creates and maintains
   - REST API with Cognito authorizer
   - Routes: `/api/auth/*`, `/api/listings/*`, `/api/ai/*`
7. **CloudFront Distribution** — Craig creates
   - Origin: S3 frontend bucket
   - Behavior: `/api/*` → API Gateway
8. **Bedrock Model Access** — Craig requests in console
   - Claude model access in `us-west-2`
9. **CloudWatch** — Craig creates
   - Dashboard with Lambda metrics and API Gateway access logging

---

## Cost Management

- Use DynamoDB on-demand (`PAY_PER_REQUEST`) — no charges at low volume
- Lambda free tier: 1M requests/month
- S3 free tier: 5 GB storage
- CloudFront free tier: 1 TB transfer/month
- Bedrock: pay-per-token (keep test prompts short)
- **Set a billing alarm at $10 to avoid surprises**
