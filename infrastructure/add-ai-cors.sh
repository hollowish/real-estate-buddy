#!/bin/bash
set -e
export AWS_PROFILE=class
API=8p2oc737d9
REGION=us-west-2
RID=jvruzj

echo "Adding OPTIONS to /api/ai/{proxy+} (id: $RID)..."

aws apigateway put-method \
  --rest-api-id "$API" --resource-id "$RID" \
  --http-method OPTIONS --authorization-type NONE \
  --region "$REGION" --output text --query 'httpMethod'

aws apigateway put-integration \
  --rest-api-id "$API" --resource-id "$RID" \
  --http-method OPTIONS --type MOCK \
  --request-templates '{"application/json":"{\"statusCode\":200}"}' \
  --region "$REGION" --output text --query 'type'

aws apigateway put-method-response \
  --rest-api-id "$API" --resource-id "$RID" \
  --http-method OPTIONS --status-code 200 \
  --response-parameters '{
    "method.response.header.Access-Control-Allow-Origin": false,
    "method.response.header.Access-Control-Allow-Methods": false,
    "method.response.header.Access-Control-Allow-Headers": false
  }' \
  --region "$REGION" --output text --query 'statusCode'

aws apigateway put-integration-response \
  --rest-api-id "$API" --resource-id "$RID" \
  --http-method OPTIONS --status-code 200 \
  --response-parameters '{
    "method.response.header.Access-Control-Allow-Origin": "'"'"'*'"'"'",
    "method.response.header.Access-Control-Allow-Methods": "'"'"'GET,POST,PUT,DELETE,OPTIONS'"'"'",
    "method.response.header.Access-Control-Allow-Headers": "'"'"'Content-Type,Authorization'"'"'"
  }' \
  --region "$REGION" --output text --query 'statusCode'

echo "Redeploying to prod..."
aws apigateway create-deployment \
  --rest-api-id "$API" --stage-name prod \
  --description "Add CORS OPTIONS to /api/ai" \
  --region "$REGION" --output text --query 'id'

echo "Verifying OPTIONS /api/ai/score..."
sleep 3
curl -s -o /dev/null -w "HTTP %{http_code}\n" \
  -X OPTIONS "https://${API}.execute-api.${REGION}.amazonaws.com/prod/api/ai/score" \
  -H "Origin: https://dmvpgocbfurdm.cloudfront.net" \
  -H "Access-Control-Request-Method: POST" \
  -H "Access-Control-Request-Headers: Authorization,Content-Type"
