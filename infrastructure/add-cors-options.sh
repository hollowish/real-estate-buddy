#!/bin/bash
# Add CORS OPTIONS methods to API Gateway resources
# Run with: export AWS_PROFILE=class && bash infrastructure/add-cors-options.sh

set -e

API=8p2oc737d9
REGION=us-west-2
RIDS=(xv5vsn xhn4sh ylq8q7)
NAMES=("/api/listings" "/api/listings/{proxy+}" "/api/auth/{proxy+}")

CORS_ORIGIN="'*'"
CORS_METHODS="'GET,POST,PUT,DELETE,OPTIONS'"
CORS_HEADERS="'Content-Type,Authorization'"

for i in "${!RIDS[@]}"; do
  RID="${RIDS[$i]}"
  NAME="${NAMES[$i]}"
  echo "=== Adding OPTIONS to $NAME (id: $RID) ==="

  echo "  put-method..."
  aws apigateway put-method \
    --rest-api-id "$API" --resource-id "$RID" \
    --http-method OPTIONS --authorization-type NONE \
    --region "$REGION" --output text --query 'httpMethod'

  echo "  put-integration..."
  aws apigateway put-integration \
    --rest-api-id "$API" --resource-id "$RID" \
    --http-method OPTIONS --type MOCK \
    --request-templates '{"application/json":"{\"statusCode\":200}"}' \
    --region "$REGION" --output text --query 'type'

  echo "  put-method-response..."
  aws apigateway put-method-response \
    --rest-api-id "$API" --resource-id "$RID" \
    --http-method OPTIONS --status-code 200 \
    --response-parameters '{
      "method.response.header.Access-Control-Allow-Origin": false,
      "method.response.header.Access-Control-Allow-Methods": false,
      "method.response.header.Access-Control-Allow-Headers": false
    }' \
    --region "$REGION" --output text --query 'statusCode'

  echo "  put-integration-response..."
  aws apigateway put-integration-response \
    --rest-api-id "$API" --resource-id "$RID" \
    --http-method OPTIONS --status-code 200 \
    --response-parameters "{
      \"method.response.header.Access-Control-Allow-Origin\": \"$CORS_ORIGIN\",
      \"method.response.header.Access-Control-Allow-Methods\": \"$CORS_METHODS\",
      \"method.response.header.Access-Control-Allow-Headers\": \"$CORS_HEADERS\"
    }" \
    --region "$REGION" --output text --query 'statusCode'

  echo "  done."
  echo ""
done

echo "=== Updating UNAUTHORIZED/ACCESS_DENIED gateway responses ==="
for RTYPE in UNAUTHORIZED ACCESS_DENIED; do
  echo "  $RTYPE..."
  aws apigateway put-gateway-response \
    --rest-api-id "$API" --response-type "$RTYPE" \
    --region "$REGION" \
    --response-parameters "{
      \"gatewayresponse.header.Access-Control-Allow-Origin\": \"$CORS_ORIGIN\",
      \"gatewayresponse.header.Access-Control-Allow-Methods\": \"$CORS_METHODS\",
      \"gatewayresponse.header.Access-Control-Allow-Headers\": \"$CORS_HEADERS\"
    }" \
    --output text --query 'responseType'
done

echo ""
echo "=== Redeploying to prod ==="
aws apigateway create-deployment \
  --rest-api-id "$API" --stage-name prod \
  --description "Add CORS OPTIONS methods" \
  --region "$REGION" --output text --query 'id'

echo ""
echo "Done. Verifying OPTIONS preflight..."
sleep 3
curl -s -o /dev/null -w "HTTP %{http_code}\n" \
  -X OPTIONS "https://$API.execute-api.$REGION.amazonaws.com/prod/api/listings" \
  -H "Origin: https://dmvpgocbfurdm.cloudfront.net" \
  -H "Access-Control-Request-Method: POST" \
  -H "Access-Control-Request-Headers: Authorization,Content-Type"
