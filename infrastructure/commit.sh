#!/bin/bash
cd /home/hollowish/projects/real-estate-buddy
git add infrastructure/cloudfront-setup.sh
git add infrastructure/deploy-frontend.sh
git commit -m "Add CloudFront setup and frontend deploy scripts

- cloudfront-setup.sh: creates OAC + distribution + S3 bucket policy
  Distribution: E2DTZE7SXRJQ4F / dmvpgocbfurdm.cloudfront.net
- deploy-frontend.sh: npm build + S3 sync + CloudFront invalidation
  Separates cache-control for HTML vs static assets

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>"
git push origin main
