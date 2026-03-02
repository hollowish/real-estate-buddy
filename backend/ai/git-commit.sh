#!/bin/bash
cd /home/hollowish/projects/real-estate-buddy
git add backend/ai/handler.js
git commit -m "Fix: revert Bedrock model to claude-3-haiku-20240307-v1:0

claude-3-5-haiku requires AWS Marketplace subscription not yet set up.
claude-3-haiku is confirmed working in this account.

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>"
git push origin main
