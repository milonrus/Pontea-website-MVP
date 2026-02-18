#!/usr/bin/env bash

set -euo pipefail

usage() {
  cat <<'EOF'
Usage:
  SRC_DB_URL='postgresql://...' \
  ./scripts/supabase-cutover-vps.sh [--stop-app-container <name>]

Required:
  SRC_DB_URL             Source cloud Supabase Postgres URL (Session pooler works best on IPv4-only hosts).

Optional environment variables:
  TARGET_DB_CONTAINER    Default: supabase-db-k4k0k4o0oog8w8480okc4g48
  TARGET_DB_USER         Default: supabase_admin
  TARGET_DB_NAME         Default: postgres
  TARGET_NETWORK         Default: k4k0k4o0oog8w8480okc4g48
  SOURCE_PG_IMAGE        Default: postgres:17
  MIG_DIR                Default: $HOME/pontea-migration-YYYYmmdd-HHMMSS

Notes:
  - Run on the VPS host where self-hosted Supabase is running.
  - Script flow:
    1) preflight (source + target)
    2) optional app stop (write freeze)
    3) source dumps (public + auth.users/identities)
    4) compatibility filter for pg17->pg15 psql
    5) target import (auth first, then public)
    6) grants restore for anon/authenticated/service_role
    7) row-count verification
EOF
}

TARGET_DB_CONTAINER="${TARGET_DB_CONTAINER:-supabase-db-k4k0k4o0oog8w8480okc4g48}"
TARGET_DB_USER="${TARGET_DB_USER:-supabase_admin}"
TARGET_DB_NAME="${TARGET_DB_NAME:-postgres}"
TARGET_NETWORK="${TARGET_NETWORK:-k4k0k4o0oog8w8480okc4g48}"
SOURCE_PG_IMAGE="${SOURCE_PG_IMAGE:-postgres:17}"
MIG_DIR="${MIG_DIR:-$HOME/pontea-migration-$(date +%Y%m%d-%H%M%S)}"
APP_CONTAINER=""

while [[ $# -gt 0 ]]; do
  case "$1" in
    --stop-app-container)
      APP_CONTAINER="${2:-}"
      if [[ -z "$APP_CONTAINER" ]]; then
        echo "Missing value for --stop-app-container" >&2
        exit 1
      fi
      shift 2
      ;;
    -h|--help)
      usage
      exit 0
      ;;
    *)
      echo "Unknown argument: $1" >&2
      usage
      exit 1
      ;;
  esac
done

if [[ -z "${SRC_DB_URL:-}" ]]; then
  echo "SRC_DB_URL is required" >&2
  exit 1
fi

mkdir -p "$MIG_DIR"

run_source() {
  local cmd="$1"
  sudo docker run --rm \
    --network "$TARGET_NETWORK" \
    -v "$MIG_DIR:/work" \
    -e SRC_DB_URL="$SRC_DB_URL" \
    "$SOURCE_PG_IMAGE" sh -lc "$cmd"
}

run_target_sql() {
  local sql="$1"
  sudo docker exec "$TARGET_DB_CONTAINER" \
    psql -v ON_ERROR_STOP=1 -U "$TARGET_DB_USER" -d "$TARGET_DB_NAME" -c "$sql"
}

run_target_file() {
  local file="$1"
  sudo bash -lc "docker exec -i '$TARGET_DB_CONTAINER' psql -v ON_ERROR_STOP=1 -U '$TARGET_DB_USER' -d '$TARGET_DB_NAME'" < "$file"
}

echo "[1/9] Preflight source and target"
run_source 'psql "$SRC_DB_URL" -c "select now() as src_now;"'
run_target_sql 'select now() as dst_now;'

echo "[2/9] Source public table inventory"
run_source 'psql "$SRC_DB_URL" -Atc "select table_name from information_schema.tables where table_schema='\''public'\'' order by 1;"' > "$MIG_DIR/source_public_tables.txt"
for table in assessment_results pricing_leads consultation_leads invoice_order_counter student_progress; do
  if ! grep -qx "$table" "$MIG_DIR/source_public_tables.txt"; then
    echo "Required table missing in source: $table" >&2
    exit 1
  fi
done
echo "Saved: $MIG_DIR/source_public_tables.txt"

if [[ -n "$APP_CONTAINER" ]]; then
  echo "[3/9] Stopping app container to freeze writes: $APP_CONTAINER"
  sudo docker stop "$APP_CONTAINER" >/dev/null || true
else
  echo "[3/9] App freeze skipped (no --stop-app-container provided)"
fi

echo "[4/9] Dumping current target public backup"
sudo docker exec "$TARGET_DB_CONTAINER" \
  pg_dump -U "$TARGET_DB_USER" -d "$TARGET_DB_NAME" \
  --format=custom --no-owner --no-privileges --schema=public > "$MIG_DIR/00_target_public_before.dump"

echo "[5/9] Dumping source public and auth"
run_source 'pg_dump "$SRC_DB_URL" --clean --if-exists --no-owner --no-privileges --schema=public --file /work/01_public.sql'
run_source 'pg_dump "$SRC_DB_URL" --data-only --no-owner --no-privileges --table=auth.users --table=auth.identities --file /work/02_auth_users_identities.sql'

echo "[6/9] Filtering pg17-only meta commands for psql15 compatibility"
sed -E '/^\\restrict /d; /^\\unrestrict /d; /^SET transaction_timeout = /d' \
  "$MIG_DIR/01_public.sql" > "$MIG_DIR/01_public.pg15.sql"
sed -E '/^\\restrict /d; /^\\unrestrict /d; /^SET transaction_timeout = /d' \
  "$MIG_DIR/02_auth_users_identities.sql" > "$MIG_DIR/02_auth_users_identities.pg15.sql"

echo "[7/9] Importing into target"
run_target_sql 'DROP TABLE IF EXISTS public."Clinet" CASCADE; DROP TABLE IF EXISTS public."Test" CASCADE;'
run_target_sql 'TRUNCATE auth.identities, auth.users CASCADE;'
run_target_file "$MIG_DIR/02_auth_users_identities.pg15.sql"
run_target_file "$MIG_DIR/01_public.pg15.sql"

echo "[8/9] Restoring grants for API roles"
run_target_sql "
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL PRIVILEGES ON ALL ROUTINES IN SCHEMA public TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON ROUTINES TO anon, authenticated, service_role;
"

echo "[9/9] Row-count comparison"
KEY_TABLES=(
  subjects
  topics
  questions
  users
  student_progress
  test_templates
  test_sections
  template_sections
  test_attempts
  attempt_sections
  attempt_questions
  practice_sessions
  practice_answers
  assessment_results
  pricing_leads
  consultation_leads
  invoice_order_counter
)

for t in "${KEY_TABLES[@]}"; do
  src_count="$(run_source "psql \"\$SRC_DB_URL\" -Atc \"select count(*) from public.${t};\"")"
  dst_count="$(sudo docker exec "$TARGET_DB_CONTAINER" psql -U "$TARGET_DB_USER" -d "$TARGET_DB_NAME" -Atc "select count(*) from public.${t};")"
  if [[ "$src_count" != "$dst_count" ]]; then
    echo "MISMATCH $t: source=$src_count target=$dst_count" >&2
    exit 1
  fi
  echo "OK $t: $src_count"
done

src_auth_users="$(run_source 'psql "$SRC_DB_URL" -Atc "select count(*) from auth.users;"')"
src_auth_id="$(run_source 'psql "$SRC_DB_URL" -Atc "select count(*) from auth.identities;"')"
dst_auth_users="$(sudo docker exec "$TARGET_DB_CONTAINER" psql -U "$TARGET_DB_USER" -d "$TARGET_DB_NAME" -Atc 'select count(*) from auth.users;')"
dst_auth_id="$(sudo docker exec "$TARGET_DB_CONTAINER" psql -U "$TARGET_DB_USER" -d "$TARGET_DB_NAME" -Atc 'select count(*) from auth.identities;')"
if [[ "$src_auth_users" != "$dst_auth_users" || "$src_auth_id" != "$dst_auth_id" ]]; then
  echo "MISMATCH auth tables: users $src_auth_users/$dst_auth_users identities $src_auth_id/$dst_auth_id" >&2
  exit 1
fi
echo "OK auth.users: $src_auth_users"
echo "OK auth.identities: $src_auth_id"

shasum -a 256 \
  "$MIG_DIR/00_target_public_before.dump" \
  "$MIG_DIR/01_public.sql" \
  "$MIG_DIR/02_auth_users_identities.sql" \
  "$MIG_DIR/01_public.pg15.sql" \
  "$MIG_DIR/02_auth_users_identities.pg15.sql" > "$MIG_DIR/checksums.sha256"

echo "Migration complete. Artifacts in: $MIG_DIR"
