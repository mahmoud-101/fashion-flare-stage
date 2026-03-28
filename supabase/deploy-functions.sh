#!/usr/bin/env bash
set -euo pipefail

echo "=========================================="
echo "  Deploying Supabase Edge Functions"
echo "=========================================="

FUNCTIONS_DIR="$(dirname "$0")/functions"

# Functions that require JWT verification (authenticated users)
JWT_FUNCTIONS=(
  "generate-campaign-images"
  "generate-ad-creative"
  "upscale-image"
  "generate-campaign-plan"
  "generate-content"
  "analyze-competitor"
  "analyze-style"
  "score-ad"
  "caption-variations"
  "check-subscription"
)

# Functions that skip JWT verification (public webhooks)
NO_JWT_FUNCTIONS=(
  "paymob-webhook"
)

echo ""
echo "Deploying JWT-protected functions..."
echo "------------------------------------------"
for fn in "${JWT_FUNCTIONS[@]}"; do
  if [ -d "${FUNCTIONS_DIR}/${fn}" ]; then
    echo "  Deploying: ${fn}"
    supabase functions deploy "${fn}"
    echo "  Done: ${fn}"
  else
    echo "  SKIP (not found): ${fn}"
  fi
done

echo ""
echo "Deploying public webhook functions (--no-verify-jwt)..."
echo "------------------------------------------"
for fn in "${NO_JWT_FUNCTIONS[@]}"; do
  if [ -d "${FUNCTIONS_DIR}/${fn}" ]; then
    echo "  Deploying: ${fn}"
    supabase functions deploy "${fn}" --no-verify-jwt
    echo "  Done: ${fn}"
  else
    echo "  SKIP (not found): ${fn}"
  fi
done

echo ""
echo "=========================================="
echo "  All functions deployed successfully!"
echo "=========================================="
