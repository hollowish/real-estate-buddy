# Testing Guide

How to test your code locally and against the live AWS environment.

---

## AWS Is Already Set Up

Craig has provisioned all infrastructure. You do **not** need an AWS account to test. The live endpoints are:

| Resource | Value |
|----------|-------|
| API base URL | `https://8p2oc737d9.execute-api.us-west-2.amazonaws.com/prod` |
| Cognito User Pool | `us-west-2_67E39NjQ1` |
| Cognito Client ID | `79lon5asqe452blgqk2nh0gl1s` |
| Region | `us-west-2` |

These values are already set as defaults in `frontend/src/config.js`.

---

## Step 1 — Run the Frontend Locally

```bash
# From the repo root:
cd frontend
npm install
npm run dev
# App runs at http://localhost:5173
```

The frontend will talk to the live API Gateway in AWS. No local backend needed.

---

## Step 2 — Test Your Lambda Locally (Before Deploying)

You can invoke your handler function directly in Node.js without deploying anything.

Create a test file next to your handler:

```js
// backend/auth/test-local.js  (example for Student A)
const { handler } = require('./handler');

const event = {
  httpMethod: 'GET',
  path: '/api/auth/profile',
  requestContext: {
    authorizer: {
      claims: {
        sub: 'test-user-123',   // simulates a logged-in user
        email: 'test@example.com',
      },
    },
  },
  body: null,
};

handler(event).then(response => {
  console.log('Status:', response.statusCode);
  console.log('Body:', JSON.parse(response.body));
});
```

Run it:

```bash
node backend/auth/test-local.js
```

> **Do not commit `test-local.js` files** — add `**/test-local.js` to `.gitignore` if you create them.

---

## Step 3 — Deploy Your Code

You write the code. Craig deploys it. When your feature branch is ready:

1. Push your branch and open a PR on GitHub
2. Craig reviews and merges to `main`
3. Craig re-deploys the Lambda from `main`

**If you need a quick deploy mid-development to test on AWS,** message Craig with your branch name and he will deploy the latest code from that branch.

---

## Step 4 — Test Against the Live API Gateway

Once your code is deployed, test it end-to-end from the command line.

### 4a — Unauthenticated request (should always return 401)

```bash
curl -s -o /dev/null -w "%{http_code}" \
  https://8p2oc737d9.execute-api.us-west-2.amazonaws.com/prod/api/auth/profile
# Expected: 401
```

This confirms the Cognito authorizer is working. Every route requires a valid JWT.

### 4b — Get a JWT token (after signup/login is implemented)

Once Student A's auth is working, log in through the app and grab the token from the browser:

- Open DevTools → Application → Local Storage (or wherever the token is stored)
- Copy the `idToken` value

Then use it in curl:

```bash
TOKEN="paste-your-id-token-here"

curl -s \
  -H "Authorization: Bearer $TOKEN" \
  https://8p2oc737d9.execute-api.us-west-2.amazonaws.com/prod/api/auth/profile
```

### 4c — Test your specific routes

**Student A — Auth:**

```bash
# Get profile
curl -s -H "Authorization: Bearer $TOKEN" \
  https://8p2oc737d9.execute-api.us-west-2.amazonaws.com/prod/api/auth/profile

# Create/update profile
curl -s -X PUT \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"displayName":"Test User","preferences":{"minBedrooms":3,"maxPrice":900000}}' \
  https://8p2oc737d9.execute-api.us-west-2.amazonaws.com/prod/api/auth/profile
```

**Student B — Listings:**

```bash
# Get all listings for current user
curl -s -H "Authorization: Bearer $TOKEN" \
  https://8p2oc737d9.execute-api.us-west-2.amazonaws.com/prod/api/listings

# Create a listing
curl -s -X POST \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"address":"123 Main St, Oakland, CA 94601","price":750000,"bedrooms":3,"bathrooms":2,"sqft":1400}' \
  https://8p2oc737d9.execute-api.us-west-2.amazonaws.com/prod/api/listings
```

**Student C — AI Scoring:**

```bash
# Score a listing (requires a real listingId from DynamoDB)
curl -s -X POST \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"listingId":"your-listing-id-here"}' \
  https://8p2oc737d9.execute-api.us-west-2.amazonaws.com/prod/api/ai/score
```

---

## Step 5 — Check CloudWatch Logs (if something breaks)

Craig has access to CloudWatch. If your Lambda returns an unexpected error, message Craig and ask him to check the logs for your function. He will look in:

- AWS Console → CloudWatch → Log groups → `/aws/lambda/reb-auth-handler` (or listings/ai)

Alternatively, if Craig has given you AWS read access, you can check yourself:

```bash
export AWS_PROFILE=class
aws logs tail /aws/lambda/reb-auth-handler --follow --region us-west-2
```

---

## Common Errors and Fixes

| Error | Likely Cause | Fix |
|-------|-------------|-----|
| `401 Unauthorized` on every request | JWT not in Authorization header, or expired | Include `Authorization: Bearer <token>`; refresh if expired |
| `403 Forbidden` | Lambda returned 403 (IDOR check failed) | You're requesting a resource that doesn't belong to your userId |
| `502 Bad Gateway` | Lambda crashed (unhandled exception) | Check CloudWatch logs; look for syntax errors or missing `require()` |
| `CORS error` in browser | Missing CORS headers in Lambda response | Make sure your handler returns `Access-Control-Allow-Origin: *` in all responses |
| Lambda returns stub message | Code not deployed yet | Open a PR and ask Craig to deploy |
| `Cannot read property of undefined` | DynamoDB returned no item | Add a null check; verify the item exists in the table |

---

## Current Lambda Status

All three functions are deployed as stubs and return `"not yet implemented"`. As each student completes their feature and Craig deploys it, this table will update.

| Lambda | Status |
|--------|--------|
| `reb-auth-handler` | Stub — awaiting Student A implementation |
| `reb-listings-handler` | Stub — awaiting Student B implementation |
| `reb-ai-scoring` | Stub — awaiting Student C implementation |
