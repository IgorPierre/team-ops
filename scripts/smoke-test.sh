#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

echo "==> Team-Ops smoke test"

if ! command -v docker >/dev/null 2>&1; then
  echo "docker is required for the smoke test"
  exit 1
fi

echo "→ Starting stack..."
docker compose up -d --wait 2>/dev/null || docker compose up -d

echo "→ Waiting for API..."
for _ in $(seq 1 30); do
  if curl -sf http://localhost:8080/healthz >/dev/null; then
    break
  fi
  sleep 2
done
curl -sf http://localhost:8080/healthz >/dev/null

echo "→ Building npm packages..."
npm install >/dev/null
npm run build -w @team-ops/mcp
npm run build -w @team-ops/setup
npm run test -w @team-ops/mcp
npm run test -w @team-ops/setup

TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT

echo "→ Bootstrapping first user..."
REGISTER=$(curl -sf -X POST http://localhost:8080/v1/auth/register \
  -H 'Content-Type: application/json' \
  -d '{"name":"Smoke Test","email":"smoke@example.com","password":"password123"}' \
  -c "$TMP/cookies.txt")
echo "$REGISTER" | grep -q '"email":"smoke@example.com"'

echo "→ Creating workspace..."
ORG=$(curl -sf -X POST http://localhost:8080/v1/organizations \
  -H 'Content-Type: application/json' \
  -b "$TMP/cookies.txt" \
  -d '{"name":"Smoke Org","slug":"smoke-org"}')
ORG_ID=$(echo "$ORG" | python3 -c "import sys,json; print(json.load(sys.stdin)['data']['id'])")

curl -sf -X POST http://localhost:8080/v1/projects \
  -H 'Content-Type: application/json' \
  -b "$TMP/cookies.txt" \
  -d "{\"organizationId\":\"$ORG_ID\",\"name\":\"ERP\",\"key\":\"ERP\"}" >/dev/null

echo "→ Creating agent + API key..."
AGENT=$(curl -sf -X POST "http://localhost:8080/v1/agents" \
  -H 'Content-Type: application/json' \
  -b "$TMP/cookies.txt" \
  -d "{\"organizationId\":\"$ORG_ID\",\"name\":\"Smoke Agent\"}")
AGENT_ID=$(echo "$AGENT" | python3 -c "import sys,json; print(json.load(sys.stdin)['data']['id'])")

KEY=$(curl -sf -X POST "http://localhost:8080/v1/agents/$AGENT_ID/api-keys" \
  -H 'Content-Type: application/json' \
  -b "$TMP/cookies.txt" \
  -d '{"name":"smoke"}')
TOKEN=$(echo "$KEY" | python3 -c "import sys,json; print(json.load(sys.stdin)['data']['key'])")

PROJECT=$(curl -sf "http://localhost:8080/v1/projects?organizationId=$ORG_ID" \
  -H 'Accept: application/json' \
  -b "$TMP/cookies.txt")
PROJECT_ID=$(echo "$PROJECT" | python3 -c "import sys,json; print(json.load(sys.stdin)['data'][0]['id'])")

echo "→ Creating task via agent token..."
TASK=$(curl -sf -X POST http://localhost:8080/v1/tasks \
  -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: application/json' \
  -d "{\"organizationId\":\"$ORG_ID\",\"projectId\":\"$PROJECT_ID\",\"title\":\"Smoke task\",\"externalRef\":\"smoke-1\",\"source\":\"ai\"}")
TASK_ID=$(echo "$TASK" | python3 -c "import sys,json; print(json.load(sys.stdin)['data']['id'])")
VERSION=$(echo "$TASK" | python3 -c "import sys,json; print(json.load(sys.stdin)['data']['version'])")

curl -sf -X POST "http://localhost:8080/v1/tasks/$TASK_ID/move" \
  -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: application/json' \
  -d "{\"status\":\"in_progress\",\"expectedVersion\":$VERSION}" >/dev/null

echo "→ Running setup CLI in temp project..."
WORK="$TMP/work"
mkdir -p "$WORK/.cursor"
TEAM_OPS_URL=http://localhost:8080 TEAM_OPS_TOKEN="$TOKEN" node apps/setup/dist/index.js \
  --yes --cwd "$WORK" --cursor --project

test -f "$WORK/.cursor/skills/team-ops/SKILL.md"
test -f "$WORK/.cursor/mcp.json"
test -f "$WORK/.team-ops.json"

echo "→ Setup check mode..."
TEAM_OPS_URL=http://localhost:8080 TEAM_OPS_TOKEN="$TOKEN" node apps/setup/dist/index.js \
  --check --yes --url http://localhost:8080 --token "$TOKEN"

echo ""
echo "Smoke test passed."
