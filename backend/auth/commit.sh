#!/bin/bash
cd /home/hollowish/projects/real-estate-buddy
git add backend/auth/handler.mjs
git add backend/auth/deploy.sh
git add backend/auth/test-invoke.sh
git add backend/auth/check-config.sh
git commit -m "Deploy Student A auth Lambda to reb-auth-handler

Fix event format for REST API v1:
- authorizer.claims.sub (was: authorizer.jwt.claims.sub)
- event.httpMethod (was: event.requestContext.http.method)

Smoke tested: 401 on no auth, 404 on missing profile.
DynamoDB read confirmed working via aws-sdk v3 bundled runtime.

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>"
git push origin main
