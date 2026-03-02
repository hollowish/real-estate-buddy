# ─────────────────────────────────────────────
# API Gateway — REST API
# ─────────────────────────────────────────────

resource "aws_api_gateway_rest_api" "reb" {
  name        = "real-estate-buddy-api"
  description = "Real Estate Buddy REST API"

  endpoint_configuration {
    types = ["REGIONAL"]
  }

  tags = var.tags
}

# ─────────────────────────────────────────────
# Cognito Authorizer
# ─────────────────────────────────────────────

resource "aws_api_gateway_authorizer" "cognito" {
  name            = "reb-cognito-authorizer"
  rest_api_id     = aws_api_gateway_rest_api.reb.id
  type            = "COGNITO_USER_POOLS"
  identity_source = "method.request.header.Authorization"

  provider_arns = [
    "arn:aws:cognito-idp:${var.aws_region}:${data.aws_caller_identity.current.account_id}:userpool/${var.cognito_user_pool_id}"
  ]
}

# Get current AWS account ID
data "aws_caller_identity" "current" {}

# ─────────────────────────────────────────────
# /api resource (base path)
# ─────────────────────────────────────────────

resource "aws_api_gateway_resource" "api" {
  rest_api_id = aws_api_gateway_rest_api.reb.id
  parent_id   = aws_api_gateway_rest_api.reb.root_resource_id
  path_part   = "api"
}

# ─────────────────────────────────────────────
# /api/auth — Student A
# ─────────────────────────────────────────────

resource "aws_api_gateway_resource" "auth" {
  rest_api_id = aws_api_gateway_rest_api.reb.id
  parent_id   = aws_api_gateway_resource.api.id
  path_part   = "auth"
}

resource "aws_api_gateway_resource" "auth_proxy" {
  rest_api_id = aws_api_gateway_rest_api.reb.id
  parent_id   = aws_api_gateway_resource.auth.id
  path_part   = "{proxy+}"
}

resource "aws_api_gateway_method" "auth_proxy" {
  rest_api_id   = aws_api_gateway_rest_api.reb.id
  resource_id   = aws_api_gateway_resource.auth_proxy.id
  http_method   = "ANY"
  authorization = "COGNITO_USER_POOLS"
  authorizer_id = aws_api_gateway_authorizer.cognito.id
}

# Placeholder integration — Student A will replace with their Lambda ARN
resource "aws_api_gateway_integration" "auth_proxy" {
  rest_api_id             = aws_api_gateway_rest_api.reb.id
  resource_id             = aws_api_gateway_resource.auth_proxy.id
  http_method             = aws_api_gateway_method.auth_proxy.http_method
  type                    = "MOCK"
  request_templates = {
    "application/json" = "{\"statusCode\": 200}"
  }
}

# ─────────────────────────────────────────────
# /api/listings — Student B
# ─────────────────────────────────────────────

resource "aws_api_gateway_resource" "listings" {
  rest_api_id = aws_api_gateway_rest_api.reb.id
  parent_id   = aws_api_gateway_resource.api.id
  path_part   = "listings"
}

resource "aws_api_gateway_resource" "listings_proxy" {
  rest_api_id = aws_api_gateway_rest_api.reb.id
  parent_id   = aws_api_gateway_resource.listings.id
  path_part   = "{proxy+}"
}

resource "aws_api_gateway_method" "listings_proxy" {
  rest_api_id   = aws_api_gateway_rest_api.reb.id
  resource_id   = aws_api_gateway_resource.listings_proxy.id
  http_method   = "ANY"
  authorization = "COGNITO_USER_POOLS"
  authorizer_id = aws_api_gateway_authorizer.cognito.id
}

# Placeholder integration — Student B will replace with their Lambda ARN
resource "aws_api_gateway_integration" "listings_proxy" {
  rest_api_id             = aws_api_gateway_rest_api.reb.id
  resource_id             = aws_api_gateway_resource.listings_proxy.id
  http_method             = aws_api_gateway_method.listings_proxy.http_method
  type                    = "MOCK"
  request_templates = {
    "application/json" = "{\"statusCode\": 200}"
  }
}

# ─────────────────────────────────────────────
# /api/ai — Student C
# ─────────────────────────────────────────────

resource "aws_api_gateway_resource" "ai" {
  rest_api_id = aws_api_gateway_rest_api.reb.id
  parent_id   = aws_api_gateway_resource.api.id
  path_part   = "ai"
}

resource "aws_api_gateway_resource" "ai_proxy" {
  rest_api_id = aws_api_gateway_rest_api.reb.id
  parent_id   = aws_api_gateway_resource.ai.id
  path_part   = "{proxy+}"
}

resource "aws_api_gateway_method" "ai_proxy" {
  rest_api_id   = aws_api_gateway_rest_api.reb.id
  resource_id   = aws_api_gateway_resource.ai_proxy.id
  http_method   = "ANY"
  authorization = "COGNITO_USER_POOLS"
  authorizer_id = aws_api_gateway_authorizer.cognito.id
}

# Placeholder integration — Student C will replace with their Lambda ARN
resource "aws_api_gateway_integration" "ai_proxy" {
  rest_api_id             = aws_api_gateway_rest_api.reb.id
  resource_id             = aws_api_gateway_resource.ai_proxy.id
  http_method             = aws_api_gateway_method.ai_proxy.http_method
  type                    = "MOCK"
  request_templates = {
    "application/json" = "{\"statusCode\": 200}"
  }
}

# ─────────────────────────────────────────────
# Deployment & Stage
# ─────────────────────────────────────────────

resource "aws_api_gateway_deployment" "reb" {
  rest_api_id = aws_api_gateway_rest_api.reb.id

  # Force redeployment when any method or integration changes
  triggers = {
    redeployment = sha1(jsonencode([
      aws_api_gateway_resource.auth_proxy,
      aws_api_gateway_resource.listings_proxy,
      aws_api_gateway_resource.ai_proxy,
      aws_api_gateway_method.auth_proxy,
      aws_api_gateway_method.listings_proxy,
      aws_api_gateway_method.ai_proxy,
      aws_api_gateway_integration.auth_proxy,
      aws_api_gateway_integration.listings_proxy,
      aws_api_gateway_integration.ai_proxy,
    ]))
  }

  lifecycle {
    create_before_destroy = true
  }

  depends_on = [
    aws_api_gateway_integration.auth_proxy,
    aws_api_gateway_integration.listings_proxy,
    aws_api_gateway_integration.ai_proxy,
  ]
}

resource "aws_api_gateway_stage" "prod" {
  deployment_id = aws_api_gateway_deployment.reb.id
  rest_api_id   = aws_api_gateway_rest_api.reb.id
  stage_name    = "prod"

  access_log_destination_arn = aws_cloudwatch_log_group.api_gateway.arn

  default_route_settings {
    # no throttling settings here — use method settings below
  }

  tags = var.tags

  depends_on = [aws_cloudwatch_log_group.api_gateway]
}

# ─────────────────────────────────────────────
# Rate Limiting — 1000 req/min per architecture doc
# ─────────────────────────────────────────────

resource "aws_api_gateway_method_settings" "all" {
  rest_api_id = aws_api_gateway_rest_api.reb.id
  stage_name  = aws_api_gateway_stage.prod.stage_name
  method_path = "*/*"

  settings {
    throttling_rate_limit  = 1000
    throttling_burst_limit = 500
    logging_level          = "INFO"
    data_trace_enabled     = false
    metrics_enabled        = true
  }
}

# ─────────────────────────────────────────────
# CORS — Allow frontend CloudFront domain
# ─────────────────────────────────────────────

resource "aws_api_gateway_gateway_response" "cors" {
  rest_api_id   = aws_api_gateway_rest_api.reb.id
  response_type = "DEFAULT_4XX"

  response_parameters = {
    "gatewayresponse.header.Access-Control-Allow-Origin"  = "'https://${var.cloudfront_domain}'"
    "gatewayresponse.header.Access-Control-Allow-Headers" = "'Content-Type,Authorization'"
    "gatewayresponse.header.Access-Control-Allow-Methods" = "'GET,POST,PUT,DELETE,OPTIONS'"
  }
}
