# Real Estate Buddy 🏠

**CIS 58 — Cloud Infrastructure Security Team Project**

A simplified AI-driven real estate scoring app built on AWS to learn cloud security concepts hands-on.

## Team

| Role | Element | Student | GitHub |
|------|---------|---------|--------|
| A | Auth & User Profile | Enayatullah Frozenda | @EnayatShah |
| B | Listings Manager | Rob Her | @diggitydawg510 |
| C | AI Scoring Engine | Craig Hollow | @hollowish |
| D | Frontend Shell & Infrastructure | Carlton Williams | @cdeshonwilliams |

> **Note:** Craig (@hollowish) also owns the AWS account (`class-sandbox`) and is the GitHub repo admin. He reviews and merges all PRs and executes all AWS infrastructure changes on behalf of the team. See [`infrastructure/coordination.md`](infrastructure/coordination.md) for details.

## Tech Stack

- **Frontend:** React (Vite) → S3 + CloudFront
- **API:** API Gateway + Lambda (Node.js)
- **Auth:** Cognito (MFA enabled)
- **Data:** DynamoDB
- **Storage:** S3
- **AI:** Bedrock (Claude)
- **Monitoring:** CloudWatch

## Getting Started

### Prerequisites
- Node.js 18+
- npm
- Git
- AWS CLI v2
- An AWS account with appropriate permissions

### Local Development

```bash
# Clone the repo
git clone https://github.com/hollowish/real-estate-buddy.git
cd real-estate-buddy

# Set up the frontend
cd frontend
npm install
npm run dev
# App runs at http://localhost:5173
```

### Project Structure

```
real-estate-buddy/
├── frontend/           # React SPA (Vite)
│   └── src/
│       ├── components/
│       │   ├── auth/       # Student A
│       │   ├── listings/   # Student B
│       │   ├── ai/         # Student C
│       │   └── shared/     # Student D
│       ├── utils/
│       └── config.js
├── backend/
│   ├── auth/           # Student A Lambda
│   ├── listings/       # Student B Lambda
│   ├── ai/             # Student C Lambda
│   └── shared/         # Shared utilities
├── infrastructure/     # AWS setup docs
├── shared/schemas/     # Data contracts (JSON)
└── docs/               # Project documentation
```

## Branch Strategy

- `main` — protected, deploy to AWS (PR required)
- `feature/*` — individual feature branches

## Docs

See the `/docs` folder for:
- Project Overview
- Workflow Guide
- Architecture Guide
- Implementation Plan
