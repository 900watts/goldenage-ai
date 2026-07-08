#!/usr/bin/env bash
# =====================================================================
# GoldenAge AI — Supabase one-shot setup
# =====================================================================
# Provisions a new Supabase project, applies the migration, deploys
# the Edge Function, and writes the resulting URL + anon key back to
# `.env` so the Flutter app can read them via --dart-define.
#
# Prerequisites:
#   1. A Supabase personal access token:
#      https://supabase.com/dashboard/account/tokens
#   2. A Supabase organization (free tier is fine):
#      https://supabase.com/dashboard/orgs
#   3. jq + curl installed.
#
# Usage:
#   cp .env.example .env
#   # fill in SUPABASE_MANAGEMENT_TOKEN, SUPABASE_ORG_ID, SUPABASE_DB_PASSWORD
#   bash bin/setup_supabase.sh
# =====================================================================
set -euo pipefail

ENV_FILE=".env"
if [ ! -f "$ENV_FILE" ]; then
  echo "❌  $ENV_FILE not found. Run: cp .env.example .env"
  exit 1
fi

# shellcheck disable=SC1090
set -a; source "$ENV_FILE"; set +a

: "${SUPABASE_MANAGEMENT_TOKEN:?Set SUPABASE_MANAGEMENT_TOKEN in .env}"
: "${SUPABASE_ORG_ID:?Set SUPABASE_ORG_ID in .env}"
: "${SUPABASE_DB_PASSWORD:?Set SUPABASE_DB_PASSWORD in .env (8+ chars)}"
REGION="${SUPABASE_REGION:-ap-southeast-1}"
PROJECT_NAME="goldenage-ai"

API="https://api.supabase.com/v1"
AUTH="Authorization: Bearer $SUPABASE_MANAGEMENT_TOKEN"
JSON="Content-Type: application/json"

echo "🚀  Creating Supabase project '$PROJECT_NAME' in region $REGION…"
CREATE_BODY=$(jq -n \
  --arg name  "$PROJECT_NAME" \
  --arg org   "$SUPABASE_ORG_ID" \
  --arg pwd   "$SUPABASE_DB_PASSWORD" \
  --arg reg   "$REGION" \
  '{name:$name, organization_id:$org, db_pass:$pwd, region:$reg, plan:"free"}')

CREATE_RES=$(curl -sS -X POST "$API/projects" \
  -H "$AUTH" -H "$JSON" -d "$CREATE_BODY")
PROJECT_ID=$(echo "$CREATE_RES" | jq -r '.id // empty')
if [ -z "$PROJECT_ID" ]; then
  echo "❌  Failed to create project. Response:"
  echo "$CREATE_RES" | jq .
  exit 1
fi
echo "✅  Project created: $PROJECT_ID"

echo "⏳  Waiting for project to come online (this can take ~90s)…"
for i in $(seq 1 30); do
  STATUS=$(curl -sS -H "$AUTH" "$API/projects/$PROJECT_ID" | jq -r '.status // empty')
  if [ "$STATUS" = "ACTIVE_HEALTHY" ]; then
    echo "✅  Project is ACTIVE_HEALTHY after ${i}×5s"
    break
  fi
  sleep 5
  echo "   …status=$STATUS"
done

PROJECT_URL=$(curl -sS -H "$AUTH" "$API/projects/$PROJECT_ID" | jq -r '.endpoint // empty')
ANON_KEY=$(curl   -sS -H "$AUTH" "$API/projects/$PROJECT_ID/api-keys" | jq -r '.[] | select(.name=="anon") | .api_key')
SERVICE_KEY=$(curl -sS -H "$AUTH" "$API/projects/$PROJECT_ID/api-keys" | jq -r '.[] | select(.name=="service_role") | .api_key')

if [ -z "$PROJECT_URL" ] || [ -z "$ANON_KEY" ]; then
  echo "❌  Could not fetch URL / anon key. Got:"
  echo "URL=$PROJECT_URL"
  echo "ANON=$ANON_KEY"
  exit 1
fi

# --- Patch .env -------------------------------------------------------
echo "📝  Writing credentials back to .env…"
sed -i.bak "s|^SUPABASE_URL=.*|SUPABASE_URL=$PROJECT_URL|"        "$ENV_FILE"
sed -i.bak "s|^SUPABASE_ANON_KEY=.*|SUPABASE_ANON_KEY=$ANON_KEY|"  "$ENV_FILE"
sed -i.bak "s|^SUPABASE_SERVICE_ROLE_KEY=.*|SUPABASE_SERVICE_ROLE_KEY=$SERVICE_KEY|" "$ENV_FILE"
rm -f "$ENV_FILE.bak"
echo "✅  .env updated."

# --- Apply migration via the project's REST API -----------------------
echo "📦  Applying migration via psql (you may need to install the postgres client)…"
PG_URL="postgresql://postgres:$SUPABASE_DB_PASSWORD@db.${PROJECT_ID#supabase_}.supabase.co:5432/postgres"
if command -v psql >/dev/null 2>&1; then
  PGPASSWORD="$SUPABASE_DB_PASSWORD" psql "$PG_URL" -f supabase/migrations/20260708000000_init.sql \
    && echo "✅  Migration applied." \
    || echo "⚠️  Migration failed — apply manually in the SQL editor."
else
  echo "⚠️  psql not installed. Apply supabase/migrations/20260708000000_init.sql"
  echo "    manually in https://supabase.com/dashboard/project/$PROJECT_ID/sql"
fi

# --- Deploy Edge Function --------------------------------------------
if command -v supabase >/dev/null 2>&1; then
  echo "⚡  Deploying Edge Function notify-guardian…"
  supabase functions deploy notify-guardian --project-ref "${PROJECT_ID#supabase_}" \
    && echo "✅  Function deployed."
  echo "🔐  Set Edge Function secrets (run interactively):"
  echo "    supabase secrets set --project-ref ${PROJECT_ID#supabase_} \\"
  echo "      TWILIO_ACCOUNT_SID=… TWILIO_AUTH_TOKEN=… TWILIO_FROM_NUMBER=… FCM_SERVER_KEY=…"
else
  echo "ℹ️  Install the Supabase CLI to deploy Edge Functions:"
  echo "    brew install supabase/tap/supabase   # macOS"
  echo "    winget install Supabase.CLI          # Windows"
fi

echo ""
echo "🎉  Done!"
echo "Project URL : $PROJECT_URL"
echo "Anon key    : ${ANON_KEY:0:20}…"
echo ""
echo "Run the app with:"
echo "  flutter run --dart-define=SUPABASE_URL=$PROJECT_URL --dart-define=SUPABASE_ANON_KEY=$ANON_KEY"
