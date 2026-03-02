# ─────────────────────────────────────────────
# CloudWatch Log Groups
# ─────────────────────────────────────────────

# API Gateway logs
resource "aws_cloudwatch_log_group" "api_gateway" {
  name              = "/aws/api-gateway/real-estate-buddy"
  retention_in_days = 30
  tags              = var.tags
}

# ─────────────────────────────────────────────
# API Gateway CloudWatch Role
# Required for API Gateway to write logs
# ─────────────────────────────────────────────

resource "aws_iam_role" "api_gateway_cloudwatch" {
  name = "reb-api-gateway-cloudwatch-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action    = "sts:AssumeRole"
      Effect    = "Allow"
      Principal = {
        Service = "apigateway.amazonaws.com"
      }
    }]
  })

  tags = var.tags
}

resource "aws_iam_role_policy_attachment" "api_gateway_cloudwatch" {
  role       = aws_iam_role.api_gateway_cloudwatch.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonAPIGatewayPushToCloudWatchLogs"
}

resource "aws_api_gateway_account" "main" {
  cloudwatch_role_arn = aws_iam_role.api_gateway_cloudwatch.arn
}

# ─────────────────────────────────────────────
# CloudWatch Alarms
# ─────────────────────────────────────────────

# Alert if 5XX errors spike
resource "aws_cloudwatch_metric_alarm" "api_5xx_errors" {
  alarm_name          = "reb-api-5xx-errors"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "5XXError"
  namespace           = "AWS/ApiGateway"
  period              = 60
  statistic           = "Sum"
  threshold           = 10
  alarm_description   = "API Gateway 5XX errors exceeded threshold"

  dimensions = {
    ApiName = aws_api_gateway_rest_api.reb.name
    Stage   = aws_api_gateway_stage.prod.stage_name
  }

  tags = var.tags
}

# Alert if 4XX errors spike (possible auth attacks)
resource "aws_cloudwatch_metric_alarm" "api_4xx_errors" {
  alarm_name          = "reb-api-4xx-errors"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "4XXError"
  namespace           = "AWS/ApiGateway"
  period              = 60
  statistic           = "Sum"
  threshold           = 50
  alarm_description   = "API Gateway 4XX errors exceeded threshold — possible auth attacks"

  dimensions = {
    ApiName = aws_api_gateway_rest_api.reb.name
    Stage   = aws_api_gateway_stage.prod.stage_name
  }

  tags = var.tags
}
