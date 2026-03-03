#!/bin/bash
# Full end-to-end test through real API Gateway with a real Cognito JWT.
# Uses only AWS CLI + Python stdlib — no boto3/pyotp needed.

set -e
export AWS_PROFILE=class
REGION="us-west-2"
USER_POOL_ID="us-west-2_67E39NjQ1"
CLIENT_ID="79lon5asqe452blgqk2nh0gl1s"
API_URL="https://8p2oc737d9.execute-api.us-west-2.amazonaws.com/prod"
TEST_EMAIL="reb-test-$(date +%s)@example.com"
TEST_PASSWORD="TestPass123!"

echo "=== Step 1: Create Cognito test user ==="
aws cognito-idp admin-create-user \
  --user-pool-id "$USER_POOL_ID" \
  --username "$TEST_EMAIL" \
  --temporary-password "TempPass123!" \
  --message-action SUPPRESS \
  --user-attributes Name=email,Value="$TEST_EMAIL" Name=email_verified,Value=true \
  --region "$REGION" \
  --query 'User.Username' --output text

aws cognito-idp admin-set-user-password \
  --user-pool-id "$USER_POOL_ID" \
  --username "$TEST_EMAIL" \
  --password "$TEST_PASSWORD" \
  --permanent \
  --region "$REGION"
echo "  User created + permanent password set: $TEST_EMAIL"

echo ""
echo "=== Step 2: Initiate auth + handle TOTP MFA flow ==="
python3 << PYEOF
import json, subprocess, base64, hmac, hashlib, struct, time, sys

REGION       = "us-west-2"
USER_POOL_ID = "us-west-2_67E39NjQ1"
CLIENT_ID    = "79lon5asqe452blgqk2nh0gl1s"
EMAIL        = "$TEST_EMAIL"
PASSWORD     = "$TEST_PASSWORD"

# ── Pure-stdlib TOTP (RFC 6238 / HOTP) ───────────────────────────────────────
def totp_now(secret_b32, window_offset=0, digits=6, interval=30):
    """Generate a TOTP code from a base32 secret."""
    # Pad base32 secret
    padded = secret_b32.upper()
    padded += "=" * (8 - len(padded) % 8) if len(padded) % 8 else ""
    key     = base64.b32decode(padded)
    counter = int(time.time()) // interval + window_offset
    msg     = struct.pack(">Q", counter)
    h       = hmac.new(key, msg, hashlib.sha1).digest()
    offset  = h[-1] & 0xF
    code    = (
        (h[offset]   & 0x7F) << 24 |
        (h[offset+1] & 0xFF) << 16 |
        (h[offset+2] & 0xFF) << 8  |
        (h[offset+3] & 0xFF)
    )
    return str(code % (10 ** digits)).zfill(digits)

# ── AWS CLI helpers ───────────────────────────────────────────────────────────
def cli(args):
    """Run an AWS CLI command, return parsed JSON."""
    result = subprocess.run(
        ["aws"] + args + ["--region", REGION, "--output", "json"],
        capture_output=True, text=True
    )
    if result.returncode != 0:
        print("CLI ERROR:", result.stderr.strip())
        sys.exit(1)
    return json.loads(result.stdout) if result.stdout.strip() else {}

# ── Auth flow ─────────────────────────────────────────────────────────────────
print("  Initiating auth...")
auth_payload = {
    "AuthFlow": "USER_PASSWORD_AUTH",
    "ClientId": CLIENT_ID,
    "AuthParameters": {"USERNAME": EMAIL, "PASSWORD": PASSWORD}
}
with open("/tmp/auth-params.json", "w") as f:
    json.dump(auth_payload["AuthParameters"], f)

resp = cli([
    "cognito-idp", "initiate-auth",
    "--auth-flow", "USER_PASSWORD_AUTH",
    "--client-id", CLIENT_ID,
    "--auth-parameters", f"file:///tmp/auth-params.json",
])
challenge = resp.get("ChallengeName")
session   = resp.get("Session")
print(f"  Challenge: {challenge}")

totp_secret = None

if challenge == "MFA_SETUP":
    # Associate a software token
    print("  Associating TOTP token...")
    assoc = cli(["cognito-idp", "associate-software-token", "--session", session])
    totp_secret = assoc["SecretCode"]
    session     = assoc["Session"]
    print(f"  Got secret (first 8 chars): {totp_secret[:8]}...")

    # Verify with stdlib TOTP — retry up to 3 windows if at a boundary
    verified = False
    for window in range(3):
        code = totp_now(totp_secret, window_offset=window)
        print(f"  Verifying TOTP code: {code} (window +{window})")
        result = subprocess.run(
            ["aws", "cognito-idp", "verify-software-token",
             "--session", session,
             "--user-code", code,
             "--friendly-device-name", "reb-e2e-test",
             "--region", REGION, "--output", "json"],
            capture_output=True, text=True
        )
        if result.returncode == 0:
            verify = json.loads(result.stdout)
            session = verify.get("Session", session)
            print(f"  Verify status: {verify['Status']}")
            verified = True
            break
        else:
            err = result.stderr
            if "Code mismatch" in err or "EnableSoftwareTokenMFA" in err:
                print(f"  Code mismatch, trying next window...")
            else:
                print(f"  Error: {err.strip()}")
                sys.exit(1)

    if not verified:
        print("ERROR: TOTP verification failed after 3 windows")
        sys.exit(1)

    # Complete MFA_SETUP challenge
    print("  Completing MFA_SETUP challenge...")
    mfa_resp = cli([
        "cognito-idp", "respond-to-auth-challenge",
        "--client-id", CLIENT_ID,
        "--challenge-name", "MFA_SETUP",
        "--session", session,
        "--challenge-responses", f"USERNAME={EMAIL}",
    ])
    challenge2 = mfa_resp.get("ChallengeName")
    print(f"  Post-setup challenge: {challenge2}")

    if "AuthenticationResult" in mfa_resp:
        tokens = mfa_resp["AuthenticationResult"]
    elif challenge2 == "SOFTWARE_TOKEN_MFA":
        # Generate fresh code for the login MFA step
        code = totp_now(totp_secret)
        print(f"  SOFTWARE_TOKEN_MFA code: {code}")
        final = cli([
            "cognito-idp", "respond-to-auth-challenge",
            "--client-id", CLIENT_ID,
            "--challenge-name", "SOFTWARE_TOKEN_MFA",
            "--session", mfa_resp["Session"],
            "--challenge-responses",
            f"USERNAME={EMAIL};SOFTWARE_TOKEN_MFA_CODE={code}",
        ])
        tokens = final.get("AuthenticationResult")
    else:
        print(f"ERROR: unexpected challenge after MFA_SETUP: {challenge2}")
        sys.exit(1)

elif challenge is None and "AuthenticationResult" in resp:
    tokens = resp["AuthenticationResult"]
else:
    print(f"ERROR: unhandled challenge '{challenge}'")
    sys.exit(1)

if not tokens:
    print("ERROR: no AuthenticationResult")
    sys.exit(1)

id_token = tokens["IdToken"]

# Decode sub from JWT payload (stdlib only — no jwt library needed)
payload  = id_token.split(".")[1]
payload += "=" * (4 - len(payload) % 4)
claims   = json.loads(base64.b64decode(payload))
sub      = claims["sub"]

print(f"\n  ✓ AUTH SUCCESS")
print(f"    userId (sub) : {sub}")
print(f"    IdToken      : {id_token[:60]}...")

with open("/tmp/reb-test-token.txt", "w") as f: f.write(id_token)
with open("/tmp/reb-test-sub.txt",   "w") as f: f.write(sub)
print("    Saved to /tmp/")
PYEOF

TOKEN=$(cat /tmp/reb-test-token.txt)
USER_SUB=$(cat /tmp/reb-test-sub.txt)
LISTING_ID="e2e-api-gw-$(date +%s)"

echo ""
echo "=== Step 3: Unauthenticated request → must be 401 ==="
STATUS=$(curl -s -o /dev/null -w "%{http_code}" \
  -X POST "$API_URL/api/ai/score")
echo "  Status: $STATUS  (expected: 401)"

echo ""
echo "=== Step 4: Create test listing in DynamoDB ==="
python3 << PYEOF
import json, subprocess, sys

listing_id = "$LISTING_ID"
user_sub   = "$USER_SUB"
item = {
    "listingId": {"S": listing_id},
    "userId":    {"S": user_sub},
    "address":   {"S": "789 Pine St, Seattle, WA 98101"},
    "price":     {"N": "875000"},
    "bedrooms":  {"N": "4"},
    "bathrooms": {"N": "2"},
    "sqft":      {"N": "2100"},
    "notes":     {"S": "Corner lot, mountain views, renovated 2022, walk to light rail"},
}
with open("/tmp/test-listing-item.json", "w") as f:
    json.dump(item, f)

r = subprocess.run(
    ["aws", "dynamodb", "put-item",
     "--table-name", "reb-listings",
     "--item", "file:///tmp/test-listing-item.json",
     "--region", "us-west-2"],
    capture_output=True, text=True
)
if r.returncode != 0:
    print("ERROR:", r.stderr); sys.exit(1)
print(f"  Created listing {listing_id} owned by {user_sub}")
PYEOF

echo ""
echo "=== Step 5: POST /api/ai/score through API Gateway (real JWT) ==="
SCORE_RESP=$(curl -s -X POST \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"listingId\":\"$LISTING_ID\"}" \
  "$API_URL/api/ai/score")

echo "  Response:"
echo "$SCORE_RESP" | python3 -m json.tool 2>/dev/null || echo "$SCORE_RESP"

echo ""
echo "=== Step 6: IDOR check — try to score another user's listing ==="
OTHER_ID="e2e-other-$(date +%s)"
OTHER_ITEM="{\"listingId\":{\"S\":\"$OTHER_ID\"},\"userId\":{\"S\":\"different-user-abc\"},\"address\":{\"S\":\"1 Hacker Way\"},\"price\":{\"N\":\"1\"}}"
echo "$OTHER_ITEM" > /tmp/other-listing.json
aws dynamodb put-item \
  --table-name reb-listings \
  --item "file:///tmp/other-listing.json" \
  --region "$REGION"

IDOR_RESP=$(curl -s -X POST \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"listingId\":\"$OTHER_ID\"}" \
  "$API_URL/api/ai/score")
echo "  IDOR response (expected 403):"
echo "$IDOR_RESP" | python3 -m json.tool 2>/dev/null || echo "$IDOR_RESP"

echo ""
echo "=== Cleanup ==="
# Delete DynamoDB items
for lid in "$LISTING_ID" "$OTHER_ID"; do
  aws dynamodb delete-item \
    --table-name reb-listings \
    --key "{\"listingId\":{\"S\":\"$lid\"}}" \
    --region "$REGION"
  echo "  Deleted listing: $lid"
done

# Delete Cognito user
aws cognito-idp admin-delete-user \
  --user-pool-id "$USER_POOL_ID" \
  --username "$TEST_EMAIL" \
  --region "$REGION"
echo "  Deleted Cognito user: $TEST_EMAIL"

echo ""
echo "=== Done ==="
