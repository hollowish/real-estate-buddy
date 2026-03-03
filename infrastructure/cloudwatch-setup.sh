#!/bin/bash
# Create CloudWatch dashboard + log groups + alarms for Real Estate Buddy
# Safe to re-run — uses --force for dashboard, ignores already-exists errors.
set -e

export AWS_PROFILE=class
REGION="us-west-2"
ACCOUNT_ID="902917582511"
API_ID="8p2oc737d9"

echo "=== Creating CloudWatch log groups ==="

for LOG_GROUP in \
  "/aws/lambda/reb-ai-scoring" \
  "/aws/lambda/reb-auth-handler" \
  "/aws/lambda/reb-listings-handler" \
  "/aws/api-gateway/reb-api"; do
  aws logs create-log-group \
    --log-group-name "$LOG_GROUP" \
    --region "$REGION" 2>&1 | grep -v "ResourceAlreadyExistsException" || true
  aws logs put-retention-policy \
    --log-group-name "$LOG_GROUP" \
    --retention-in-days 30 \
    --region "$REGION" 2>&1 | grep -v "error" || true
  echo "  $LOG_GROUP — 30-day retention"
done

echo ""
echo "=== Creating CloudWatch alarms ==="

# 5XX errors alarm
aws cloudwatch put-metric-alarm \
  --alarm-name "reb-api-5xx-errors" \
  --alarm-description "API Gateway 5XX errors exceeded threshold" \
  --metric-name "5XXError" \
  --namespace "AWS/ApiGateway" \
  --statistic Sum \
  --period 60 \
  --evaluation-periods 2 \
  --threshold 10 \
  --comparison-operator GreaterThanThreshold \
  --dimensions "Name=ApiName,Value=reb-api" "Name=Stage,Value=prod" \
  --treat-missing-data notBreaching \
  --region "$REGION"
echo "  Alarm: reb-api-5xx-errors (threshold: 10/min)"

# 4XX errors alarm (auth attacks)
aws cloudwatch put-metric-alarm \
  --alarm-name "reb-api-4xx-errors" \
  --alarm-description "API Gateway 4XX errors elevated — possible auth attacks" \
  --metric-name "4XXError" \
  --namespace "AWS/ApiGateway" \
  --statistic Sum \
  --period 60 \
  --evaluation-periods 2 \
  --threshold 50 \
  --comparison-operator GreaterThanThreshold \
  --dimensions "Name=ApiName,Value=reb-api" "Name=Stage,Value=prod" \
  --treat-missing-data notBreaching \
  --region "$REGION"
echo "  Alarm: reb-api-4xx-errors (threshold: 50/min)"

# Lambda error alarms
for FUNC in reb-ai-scoring reb-auth-handler reb-listings-handler; do
  aws cloudwatch put-metric-alarm \
    --alarm-name "reb-lambda-errors-${FUNC}" \
    --alarm-description "Lambda errors in ${FUNC}" \
    --metric-name "Errors" \
    --namespace "AWS/Lambda" \
    --statistic Sum \
    --period 60 \
    --evaluation-periods 2 \
    --threshold 5 \
    --comparison-operator GreaterThanThreshold \
    --dimensions "Name=FunctionName,Value=${FUNC}" \
    --treat-missing-data notBreaching \
    --region "$REGION"
  echo "  Alarm: reb-lambda-errors-${FUNC} (threshold: 5/min)"
done

echo ""
echo "=== Creating CloudWatch dashboard ==="

cat > /tmp/dashboard.json << EOF
{
  "widgets": [
    {
      "type": "text",
      "x": 0, "y": 0, "width": 24, "height": 1,
      "properties": {
        "markdown": "# Real Estate Buddy — Operations Dashboard"
      }
    },
    {
      "type": "metric",
      "x": 0, "y": 1, "width": 8, "height": 6,
      "properties": {
        "title": "API Gateway — Requests",
        "metrics": [
          ["AWS/ApiGateway", "Count", "ApiName", "reb-api", "Stage", "prod"],
          ["AWS/ApiGateway", "5XXError", "ApiName", "reb-api", "Stage", "prod"],
          ["AWS/ApiGateway", "4XXError", "ApiName", "reb-api", "Stage", "prod"]
        ],
        "period": 60,
        "stat": "Sum",
        "region": "${REGION}",
        "view": "timeSeries"
      }
    },
    {
      "type": "metric",
      "x": 8, "y": 1, "width": 8, "height": 6,
      "properties": {
        "title": "API Gateway — Latency (ms)",
        "metrics": [
          ["AWS/ApiGateway", "Latency", "ApiName", "reb-api", "Stage", "prod", {"stat": "p99", "label": "p99"}],
          ["AWS/ApiGateway", "Latency", "ApiName", "reb-api", "Stage", "prod", {"stat": "p50", "label": "p50"}]
        ],
        "period": 60,
        "region": "${REGION}",
        "view": "timeSeries"
      }
    },
    {
      "type": "metric",
      "x": 16, "y": 1, "width": 8, "height": 6,
      "properties": {
        "title": "Lambda — Invocations",
        "metrics": [
          ["AWS/Lambda", "Invocations", "FunctionName", "reb-ai-scoring", {"label": "AI Scoring"}],
          ["AWS/Lambda", "Invocations", "FunctionName", "reb-auth-handler", {"label": "Auth"}],
          ["AWS/Lambda", "Invocations", "FunctionName", "reb-listings-handler", {"label": "Listings"}]
        ],
        "period": 60,
        "stat": "Sum",
        "region": "${REGION}",
        "view": "timeSeries"
      }
    },
    {
      "type": "metric",
      "x": 0, "y": 7, "width": 8, "height": 6,
      "properties": {
        "title": "Lambda — Errors",
        "metrics": [
          ["AWS/Lambda", "Errors", "FunctionName", "reb-ai-scoring", {"label": "AI Scoring"}],
          ["AWS/Lambda", "Errors", "FunctionName", "reb-auth-handler", {"label": "Auth"}],
          ["AWS/Lambda", "Errors", "FunctionName", "reb-listings-handler", {"label": "Listings"}]
        ],
        "period": 60,
        "stat": "Sum",
        "region": "${REGION}",
        "view": "timeSeries"
      }
    },
    {
      "type": "metric",
      "x": 8, "y": 7, "width": 8, "height": 6,
      "properties": {
        "title": "Lambda — Duration (ms)",
        "metrics": [
          ["AWS/Lambda", "Duration", "FunctionName", "reb-ai-scoring", {"stat": "p99", "label": "AI p99"}],
          ["AWS/Lambda", "Duration", "FunctionName", "reb-auth-handler", {"stat": "p99", "label": "Auth p99"}],
          ["AWS/Lambda", "Duration", "FunctionName", "reb-listings-handler", {"stat": "p99", "label": "Listings p99"}]
        ],
        "period": 60,
        "region": "${REGION}",
        "view": "timeSeries"
      }
    },
    {
      "type": "alarm",
      "x": 16, "y": 7, "width": 8, "height": 6,
      "properties": {
        "title": "Active Alarms",
        "alarms": [
          "arn:aws:cloudwatch:${REGION}:${ACCOUNT_ID}:alarm:reb-api-5xx-errors",
          "arn:aws:cloudwatch:${REGION}:${ACCOUNT_ID}:alarm:reb-api-4xx-errors",
          "arn:aws:cloudwatch:${REGION}:${ACCOUNT_ID}:alarm:reb-lambda-errors-reb-ai-scoring",
          "arn:aws:cloudwatch:${REGION}:${ACCOUNT_ID}:alarm:reb-lambda-errors-reb-auth-handler",
          "arn:aws:cloudwatch:${REGION}:${ACCOUNT_ID}:alarm:reb-lambda-errors-reb-listings-handler"
        ]
      }
    }
  ]
}
EOF

aws cloudwatch put-dashboard \
  --dashboard-name "RealEstateBuddy" \
  --dashboard-body file:///tmp/dashboard.json \
  --region "$REGION"

echo ""
echo "=== Done ==="
echo "Dashboard URL:"
echo "  https://${REGION}.console.aws.amazon.com/cloudwatch/home?region=${REGION}#dashboards:name=RealEstateBuddy"
