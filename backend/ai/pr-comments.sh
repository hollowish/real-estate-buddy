#!/bin/bash
set -e
REPO="hollowish/real-estate-buddy"

gh pr comment 7 --repo "$REPO" --body "Merging this — great work on the full auth flow (login, signup, TOTP, protected routes). Following up with a cleanup commit to move files from frontend/ into frontend/src/auth/ (all source code lives under src/), fix the import paths, and remove assignment-guide.html from the repo. Code logic is solid."

gh pr comment 3 --repo "$REPO" --body "Merging and reorganizing into infrastructure/terraform/ (Terraform does not belong in frontend/). Heads up: the API Gateway (reb-api) is already live from our manual setup — coordinate before running terraform apply to avoid creating a duplicate."

gh pr comment 4 --repo "$REPO" --body "Merging — moving outputs.tf to infrastructure/terraform/ in cleanup commit."

gh pr comment 5 --repo "$REPO" --body "Merging — moving to infrastructure/terraform/ and adding *.tfvars to .gitignore since tfvars files should not be committed (they can contain real account values). Note: bucket_name and cloudfront_domain values here look like they may be from a different account — will need to update with our actual values."

gh pr comment 6 --repo "$REPO" --body "Merging — moving to infrastructure/terraform/. Placeholder secrets are correct (no real values hardcoded)."

gh pr comment 8 --repo "$REPO" --body "Merging — moving to infrastructure/terraform/. CloudWatch alarms and the API Gateway logging role look great."

echo "All comments posted."
