# Project Coordination — Craig's Dual Role

Craig (@hollowish) carries three responsibilities on this project:

1. **Student C** — codes the AI Scoring Engine (`backend/ai/`, `frontend/src/components/ai/`)
2. **AWS account owner** — executes all infrastructure changes in the `class-sandbox` account on behalf of all teammates
3. **GitHub repo admin** — reviews and merges all pull requests into `main`

---

## GitHub Responsibilities

### PR Review Process

All teammates submit PRs to `main`. Craig is the sole reviewer and merger.

When a PR comes in:

- [ ] Read the diff — does it follow naming conventions (`reb-*`, correct folder)?
- [ ] Check for hardcoded secrets, credentials, or AWS account IDs in code
- [ ] Verify it doesn't break the shared data contracts (`/shared/schemas/`)
- [ ] Approve and merge — don't hold up teammates on style nitpicks
- [ ] After merge: deploy any new Lambda code to AWS (see AWS deployment section below)

### Branch Naming to Expect

```
feature/auth-login          (Enayatullah, Student A)
feature/auth-profile        (Enayatullah, Student A)
feature/listings-crud       (Rob, Student B)
feature/listings-photos     (Rob, Student B)
feature/ai-scoring          (Craig, Student C — his own work)
feature/infra-setup         (Carlton, Student D)
feature/frontend-shell      (Carlton, Student D)
```

---

## AWS Responsibilities

### Before Teammates Can Start Coding (Days 3–5)

These must exist before any Lambda can be tested. Craig sets them up first:

| Service | Task | When |
|---------|------|------|
| Cognito | Create `reb-user-pool` + app client (coordinate with Enayatullah on config) | Day 3 |
| DynamoDB | Create `reb-users` table (partition key: `userId`) | Day 3 |
| DynamoDB | Create `reb-listings` table (partition key: `listingId`, GSI: `userId-index`) | Day 3 |
| S3 | Create `reb-photos-[ACCOUNT_ID]` (Block Public Access ON, SSE-S3) | Day 3 |
| S3 | Create `reb-frontend-[ACCOUNT_ID]` (for React SPA) | Day 3 |
| IAM | Create `reb-auth-lambda-role` | Day 4 |
| IAM | Create `reb-listings-lambda-role` | Day 4 |
| IAM | Create `reb-ai-lambda-role` | Day 4 |
| Lambda | Deploy stub for `reb-auth-handler` | Day 4 |
| Lambda | Deploy stub for `reb-listings-handler` | Day 4 |
| Lambda | Deploy stub for `reb-ai-scoring` | Day 4 |
| API Gateway | Create REST API, Cognito authorizer, all `/api/*` route stubs | Day 5 |
| Bedrock | Request Claude model access | Day 3 (takes time to approve) |

> **Checkpoint CP-2 (Day 5):** API Gateway is live with at least one working Lambda endpoint.

### Ongoing — After Each Merged PR

When a teammate's feature PR merges to `main`, Craig deploys their Lambda code to AWS:

```bash
export AWS_PROFILE=class

# Zip and deploy — example for listings handler
cd backend/listings
zip -r function.zip handler.js
aws lambda update-function-code \
  --function-name reb-listings-handler \
  --zip-file fileb://function.zip
rm function.zip
```

Repeat for `reb-auth-handler` and `reb-ai-scoring` as their code merges.

### Phase 2 — Integration (Days 15–19)

| Task | What Craig does |
|------|----------------|
| Wire API Gateway routes | Confirm all `/api/*` routes point to the correct Lambda functions |
| Update `frontend/src/config.js` | Replace placeholders with real API Gateway URL, Cognito pool/client IDs |
| S3 bucket policies | Lock down `reb-photos` to listings Lambda role only; `reb-frontend` to CloudFront only |
| CloudFront | Create distribution pointing to `reb-frontend-[ACCOUNT_ID]`; wire `/api/*` to API Gateway |
| GitHub Actions secrets | Add `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_REGION`, `S3_BUCKET`, `CLOUDFRONT_DISTRIBUTION_ID` to repo Settings → Secrets |
| End-to-end deploy | Push to `main` → GitHub Action builds React → syncs to S3 → invalidates CloudFront |

### Phase 3 — Hardening (Days 20–25)

| Task | What Craig checks in AWS |
|------|------------------------|
| Encryption at rest | DynamoDB tables and S3 buckets have SSE enabled |
| S3 public access | `reb-photos` bucket has Block Public Access ON |
| API auth | Every `/api/*` route has the Cognito authorizer attached (no open endpoints) |
| IAM least privilege | Each Lambda role can only access what it needs — verify in IAM console |
| No secrets in code | Audit merged PRs; no hardcoded keys or account IDs |
| HTTPS enforced | CloudFront redirects HTTP → HTTPS |
| CloudWatch | Dashboard shows Lambda errors, API request counts, durations |

---

## Always Before Running AWS Commands

```bash
export AWS_PROFILE=class
aws sts get-caller-identity   # confirm Account: "[ACCOUNT_ID]"
```
