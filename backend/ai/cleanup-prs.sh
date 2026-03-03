#!/bin/bash
set -e
cd /home/hollowish/projects/real-estate-buddy

echo "=== Creating new directories ==="
mkdir -p frontend/src/auth
mkdir -p infrastructure/terraform

echo "=== Moving Student A frontend files → frontend/src/auth/ ==="
git mv frontend/AuthContext.jsx     frontend/src/auth/AuthContext.jsx
git mv frontend/LoginPage.jsx       frontend/src/auth/LoginPage.jsx
git mv frontend/ProtectedRoute.jsx  frontend/src/auth/ProtectedRoute.jsx
git mv frontend/SignupPage.jsx      frontend/src/auth/SignupPage.jsx
git mv frontend/aws-config.js       frontend/src/auth/aws-config.template.js

echo "=== Fixing import paths in moved JSX files ==="
sed -i "s|from '../context/AuthContext'|from './AuthContext'|g" frontend/src/auth/LoginPage.jsx
sed -i "s|from '../context/AuthContext'|from './AuthContext'|g" frontend/src/auth/ProtectedRoute.jsx

echo "=== Moving Student A Lambda files → backend/auth/ ==="
git mv frontend/lambda-reb-auth-handler.mjs  backend/auth/handler.mjs
git mv frontend/iam-lambda-policy.json        backend/auth/iam-lambda-policy.json

echo "=== Moving Terraform files → infrastructure/terraform/ ==="
git mv api_gateway.tf                infrastructure/terraform/api_gateway.tf
git mv frontend/cloudwatch.tf        infrastructure/terraform/cloudwatch.tf
git mv frontend/outputs.tf           infrastructure/terraform/outputs.tf
git mv "frontend/secrets (1).tf"     infrastructure/terraform/secrets.tf
git mv frontend/terraform.tfvars     infrastructure/terraform/terraform.tfvars.example

echo "=== Deleting files that don't belong ==="
git rm frontend/assignment-guide.html

echo "=== Creating infrastructure/terraform/.gitignore ==="
cat > infrastructure/terraform/.gitignore << 'EOF'
# Never commit Terraform state or real variable values
*.tfstate
*.tfstate.backup
.terraform/
.terraform.lock.hcl
terraform.tfvars
EOF
git add infrastructure/terraform/.gitignore

echo "=== Staging all changes ==="
git add -A

echo "=== Git status ==="
git status

echo "=== Done — ready to commit ==="
