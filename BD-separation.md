# DB Separation: CRM-Only Cleanup on VM Supabase (2026-02-17)

## Goal
Keep only the CRM layer in the self-hosted Supabase Postgres database running on the VM, by deleting all non-CRM tables from `postgres.public`. Leave the `nocodb` database untouched.

This is the first step of splitting concerns:
- VM Supabase DB (this VM): CRM-only storage for leads, assessments, and client identity resolution.
- App DB (separate): the product database (question bank, timed tests, practice, etc.), to be hosted separately (cloud copy).

## Environment (facts)
- VM: `mikhail@89.232.188.98`
- Hostname: `compute-vm-2-2-20-ssd-1771009686767`
- Runtime: Coolify + self-hosted Supabase + NocoDB.

Key containers on the VM:
- App container: `yg0k00gswcg40g8ssgssoo0c-214626211187`
- Supabase DB container: `supabase-db-k4k0k4o0oog8w8480okc4g48`
- NocoDB container: `nocodb-v484wscoso8s8kswkscscc44`

Postgres databases inside `supabase-db-*`:
- `postgres` (Supabase “main” DB used by PostgREST/Studio)
- `nocodb` (NocoDB metadata + its user bases)
- `_supabase` (internal)

## Scope Decision
### `postgres.public` tables to KEEP (CRM)
- `assessment_results`
- `pricing_leads`
- `invoice_order_counter`
- `clients`
- `client_contacts`
- `client_link_reviews`

### `postgres.public` views to KEEP (CRM)
- `crm_client_timeline_v`
- `crm_clients_overview_v`

### `postgres.public` tables to DELETE (non-CRM / product)
- `attempt_questions`
- `attempt_sections`
- `practice_answers`
- `practice_sessions`
- `question_reports`
- `questions`
- `student_progress`
- `subjects`
- `template_sections`
- `test_attempts`
- `test_sections`
- `test_templates`
- `topics`
- `users` (this is `public.users`, not `auth.users`)

### `nocodb` database
- Not modified.
- No cleanup performed in `nocodb` DB or `nc_*` tables.

## Pre-cleanup Inventory (postgres.public)
Observed on the VM before deletion:

Tables:
- `assessment_results`
- `attempt_questions`
- `attempt_sections`
- `client_contacts`
- `client_link_reviews`
- `clients`
- `invoice_order_counter`
- `practice_answers`
- `practice_sessions`
- `pricing_leads`
- `question_reports`
- `questions`
- `student_progress`
- `subjects`
- `template_sections`
- `test_attempts`
- `test_sections`
- `test_templates`
- `topics`
- `users`

Views:
- `crm_client_timeline_v`
- `crm_clients_overview_v`

Triggers:
- `assessment_results`: `trg_crm_assign_client_assessment` (BEFORE INSERT)
- `pricing_leads`: `trg_assign_invoice_order_number` (BEFORE INSERT)
- `pricing_leads`: `trg_crm_assign_client_pricing_leads` (BEFORE INSERT)
- `test_templates`: `test_templates_updated_at` (BEFORE UPDATE)

Functions (public schema) before cleanup included:
- CRM/invoice: `assign_invoice_order_number`, `crm_*`, `trg_crm_*`
- Non-CRM/product leftovers: `admin_update_user_role`, `is_admin`, `handle_new_user`, `submit_answer`, `update_test_templates_updated_at`

Important gotcha: all `public.*` tables were owned by `supabase_admin`.
- Attempting `DROP TABLE ...` as `postgres` failed with: `ERROR: must be owner of table ...`.
- Fix: run DDL as `supabase_admin`.

## Backup Artifacts (taken BEFORE any destructive DDL)
Created on the VM:
- Directory: `/home/mikhail/pontea-crm-cleanup-20260217-220927`
- Files:
  - `public_tables_before.txt` (table inventory)
  - `public_before.dump` (pg_dump custom format, schema=public)
  - `checksums.sha256`

Backup commands used:
```bash
DB_CONT='supabase-db-k4k0k4o0oog8w8480okc4g48'
TS="$(date +%Y%m%d-%H%M%S)"
DIR="$HOME/pontea-crm-cleanup-$TS"
mkdir -p "$DIR"

sudo -n docker exec "$DB_CONT" psql -U postgres -d postgres -Atc \
  "select table_name from information_schema.tables where table_schema='public' and table_type='BASE TABLE' order by 1;" \
  > "$DIR/public_tables_before.txt"

sudo -n docker exec "$DB_CONT" pg_dump -U postgres -d postgres \
  --format=custom --no-owner --no-privileges --schema=public \
  > "$DIR/public_before.dump"

sha256sum "$DIR/public_tables_before.txt" "$DIR/public_before.dump" > "$DIR/checksums.sha256"
```

## Destructive Changes (executed)
### 1) Drop non-CRM tables (as `supabase_admin`)
```bash
DB_CONT='supabase-db-k4k0k4o0oog8w8480okc4g48'
DB_USER='supabase_admin'

sudo -n docker exec -i "$DB_CONT" psql -U "$DB_USER" -d postgres -v ON_ERROR_STOP=1 <<'SQL'
BEGIN;
SET lock_timeout = '5s';

DROP TABLE IF EXISTS
  public.attempt_questions,
  public.attempt_sections,
  public.practice_answers,
  public.practice_sessions,
  public.question_reports,
  public.questions,
  public.student_progress,
  public.subjects,
  public.template_sections,
  public.test_attempts,
  public.test_sections,
  public.test_templates,
  public.topics,
  public.users
CASCADE;

COMMIT;
SQL
```

### 2) Drop orphan non-CRM functions (as `supabase_admin`)
After removing `public.users` and product tables, some functions were clearly unrelated to CRM (and/or referenced dropped tables). These were removed:
- `admin_update_user_role`
- `is_admin`
- `handle_new_user`
- `submit_answer`
- `update_test_templates_updated_at`

```bash
DB_CONT='supabase-db-k4k0k4o0oog8w8480okc4g48'
DB_USER='supabase_admin'

sudo -n docker exec -i "$DB_CONT" psql -U "$DB_USER" -d postgres -v ON_ERROR_STOP=1 <<'SQL'
BEGIN;
DROP FUNCTION IF EXISTS public.admin_update_user_role(uuid, text);
DROP FUNCTION IF EXISTS public.is_admin();
DROP FUNCTION IF EXISTS public.handle_new_user();
DROP FUNCTION IF EXISTS public.submit_answer(uuid, uuid, uuid, text, integer, boolean);
DROP FUNCTION IF EXISTS public.update_test_templates_updated_at();
COMMIT;
SQL
```

## Post-cleanup State (postgres.public)
### Tables (CRM-only)
- `assessment_results`
- `pricing_leads`
- `invoice_order_counter`
- `clients`
- `client_contacts`
- `client_link_reviews`

### Views (still present)
- `crm_client_timeline_v`
- `crm_clients_overview_v`

### Triggers (still present)
- `assessment_results`: `trg_crm_assign_client_assessment` (BEFORE INSERT)
- `pricing_leads`: `trg_assign_invoice_order_number` (BEFORE INSERT)
- `pricing_leads`: `trg_crm_assign_client_pricing_leads` (BEFORE INSERT)

### Functions (public schema, after cleanup)
- `assign_invoice_order_number`
- `crm_apply_client_identity`
- `crm_merge_clients`
- `crm_normalize_email`
- `crm_resolve_client_link_review`
- `crm_resolve_or_create_client`
- `crm_upsert_client_contact`
- `trg_crm_assign_client_assessment`
- `trg_crm_assign_client_pricing_leads`

## Validation / Smoke Tests
### DB checks
List remaining `public` base tables:
```sql
select table_name
from information_schema.tables
where table_schema='public' and table_type='BASE TABLE'
order by 1;
```

Views still queryable (example):
```sql
select *
from public.crm_clients_overview_v
order by last_activity_at desc nulls last
limit 5;
```

### HTTP checks
Note: the Next.js app has `trailingSlash: true` (see `next.config.mjs`), so some endpoints redirect (308) without the trailing `/`.

Checked endpoints (expected):
- `https://pontea.school` -> `200`
- `https://supabase.pontea.school` -> `401` (expected for Kong)
- `https://nocodb.pontea.school` -> `302` (expected)

CRM flow smoke tests performed:
- `POST /api/assessment/submit/` -> `200`, returned `{ token }`
- `GET /results/<token>/` -> `200`
- `POST /api/pricing-leads/` (EUR lead) -> `200`, returned `{ success: true, orderNumber }`

The temporary smoke-test rows were deleted from CRM tables afterwards.

## App Container Note
During the process, the app container was briefly stopped and then started again.
After starting, it reported Next.js ready (`next start`).

Important: since non-CRM tables were deleted from the *current* Supabase instance, any app features still pointing to this Supabase URL and requiring the removed tables will now error until the app is cut over to the new App DB.

## Rollback Options
Rollback data source:
- `/home/mikhail/pontea-crm-cleanup-20260217-220927/public_before.dump`

Restore selected tables (example, choose what you need):
```bash
DIR='/home/mikhail/pontea-crm-cleanup-20260217-220927'
DB_CONT='supabase-db-k4k0k4o0oog8w8480okc4g48'

# Inspect dump contents (optional)
sudo bash -lc "docker exec -i '$DB_CONT' pg_restore -l '$DIR/public_before.dump' > '$DIR/public_before.list'"

# Restore specific tables back into postgres (example)
sudo docker exec -i "$DB_CONT" pg_restore \
  -U supabase_admin -d postgres --no-owner --no-privileges \
  -t public.questions \
  -t public.subjects \
  -t public.topics \
  -t public.users \
  "$DIR/public_before.dump"
```

Warning:
- Restoring the entire `public` schema (not selective) can overwrite post-cleanup CRM state, depending on restore strategy.

## Next Steps (separation completion)
1) Point the application to the separate App DB (cloud copy) by updating its Supabase connection (URL/keys) in the app container environment.
2) Verify product flows (question bank, tests, practice, profiles) against the new App DB.
3) Keep CRM flows using the current VM Supabase instance (the CRM-only DB after this cleanup).

