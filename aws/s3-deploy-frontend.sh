#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
# Deploy React build to S3 + invalidate CloudFront cache
# Required env vars: AWS_S3_BUCKET, AWS_CLOUDFRONT_DISTRIBUTION_ID
# ─────────────────────────────────────────────────────────────────────────────
set -euo pipefail

: "${AWS_S3_BUCKET:?Need AWS_S3_BUCKET}"
: "${AWS_CLOUDFRONT_DISTRIBUTION_ID:?Need AWS_CLOUDFRONT_DISTRIBUTION_ID}"

cd employee-payroll-frontend

echo "==> Building React app..."
npm ci --silent
REACT_APP_API_URL="https://${BACKEND_DOMAIN}/api" npm run build

echo "==> Syncing to S3..."
aws s3 sync build/ "s3://${AWS_S3_BUCKET}" \
    --delete \
    --cache-control "max-age=31536000,public,immutable" \
    --exclude "*.html"

# HTML files must not be cached so deployments take effect immediately
aws s3 cp build/index.html "s3://${AWS_S3_BUCKET}/index.html" \
    --cache-control "no-cache,no-store,must-revalidate" \
    --content-type "text/html"

echo "==> Invalidating CloudFront cache..."
aws cloudfront create-invalidation \
    --distribution-id "${AWS_CLOUDFRONT_DISTRIBUTION_ID}" \
    --paths "/*"

echo "==> Frontend deployed successfully"
