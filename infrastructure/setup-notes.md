# AWS Infrastructure Setup Notes

## Student D is responsible for initial setup of these services.
## Other students will configure their own Lambda functions and tables.

### AWS Services to Create (in order)

1. **Cognito User Pool** (Student A, but D helps with IAM)
2. **DynamoDB Tables** (Students A + B)
   - `reb-users` — partition key: `userId` (String)
   - `reb-listings` — partition key: `listingId` (String), GSI: `userId-index`
3. **S3 Buckets** (Students B + D)
   - `reb-photos-{ACCOUNT_ID}` — photo uploads (Block Public Access ON)
   - `reb-frontend-{ACCOUNT_ID}` — React SPA hosting
4. **Lambda Functions** (Each student)
   - `reb-auth-handler`
   - `reb-listings-handler`
   - `reb-ai-scoring`
5. **IAM Execution Roles** (Student D creates, each student specifies permissions)
   - `reb-auth-lambda-role`
   - `reb-listings-lambda-role`
   - `reb-ai-lambda-role`
6. **API Gateway** (Student D)
   - REST API with Cognito authorizer
   - Routes for `/api/auth/*`, `/api/listings/*`, `/api/ai/*`
7. **CloudFront Distribution** (Student D)
   - Origin: S3 frontend bucket
   - Behavior: `/api/*` → API Gateway
8. **Bedrock Model Access** (Student C)
   - Request access to Claude model in Bedrock console
9. **CloudWatch** (Student D)
   - Dashboard with Lambda metrics
   - API Gateway access logging

### Region: us-west-2 (Oregon)

### Cost Management
- Use DynamoDB on-demand (PAY_PER_REQUEST) — no charges at low volume
- Lambda free tier: 1M requests/month
- S3 free tier: 5 GB storage
- CloudFront free tier: 1 TB transfer/month
- Bedrock: pay-per-token (keep test prompts short!)
- **Set a billing alarm at $10** to avoid surprises
