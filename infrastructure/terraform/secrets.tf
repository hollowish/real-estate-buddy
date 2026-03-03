# ─────────────────────────────────────────────
# Secrets Manager
# Stores any third-party API keys (Walk Score, Google Maps, FEMA etc.)
# ─────────────────────────────────────────────

resource "aws_secretsmanager_secret" "third_party_keys" {
  name                    = "reb/third-party-api-keys"
  description             = "Third-party API keys for Real Estate Buddy"
  recovery_window_in_days = 7

  tags = var.tags
}

# Placeholder secret values — update these manually in AWS console
# or via CLI: aws secretsmanager put-secret-value --secret-id reb/third-party-api-keys --secret-string '{"walk_score_api_key":"your-key-here"}'
resource "aws_secretsmanager_secret_version" "third_party_keys" {
  secret_id = aws_secretsmanager_secret.third_party_keys.id

  secret_string = jsonencode({
    walk_score_api_key  = "placeholder-replace-me"
    google_maps_api_key = "placeholder-replace-me"
    fema_api_key        = "placeholder-replace-me"
  })

  lifecycle {
    # Prevent Terraform from overwriting manually updated secrets
    ignore_changes = [secret_string]
  }
}
