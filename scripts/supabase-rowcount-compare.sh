#!/usr/bin/env bash

set -euo pipefail

if [[ -z "${SRC_DB_URL:-}" ]]; then
  echo "Usage: SRC_DB_URL='postgresql://...' $0" >&2
  exit 1
fi

TARGET_DB_CONTAINER="${TARGET_DB_CONTAINER:-supabase-db-k4k0k4o0oog8w8480okc4g48}"
TARGET_DB_USER="${TARGET_DB_USER:-supabase_admin}"
TARGET_DB_NAME="${TARGET_DB_NAME:-postgres}"
TARGET_NETWORK="${TARGET_NETWORK:-k4k0k4o0oog8w8480okc4g48}"
SOURCE_PG_IMAGE="${SOURCE_PG_IMAGE:-postgres:17}"

src_count() {
  local table="$1"
  sudo docker run --rm \
    --network "$TARGET_NETWORK" \
    "$SOURCE_PG_IMAGE" sh -lc "psql \"$SRC_DB_URL\" -Atc \"select count(*) from public.${table};\""
}

dst_count() {
  local table="$1"
  sudo docker exec "$TARGET_DB_CONTAINER" \
    psql -U "$TARGET_DB_USER" -d "$TARGET_DB_NAME" -Atc "select count(*) from public.${table};"
}

TABLES=(
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
  eur_requests
  consultation_requests
  leads
  invoice_order_counter
)

for t in "${TABLES[@]}"; do
  src="$(src_count "$t")"
  dst="$(dst_count "$t")"
  printf "%-24s src=%-8s dst=%-8s %s\n" "$t" "$src" "$dst" "$([[ "$src" == "$dst" ]] && echo OK || echo MISMATCH)"
done
