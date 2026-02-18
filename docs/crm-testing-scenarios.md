# CRM Testing Scenarios (leads + assessment + consultation + EUR invoices)

## Scope
- Verify CRM normalization introduced by migration `20260217_crm_clients_normalization.sql`.
- Verify CRM split introduced by migration `20260218_crm_split_consults_and_status_tariff.sql`.
- Verify breaking field cleanup from migration `20260220_crm_fields_cleanup_breaking.sql`.
- Verify linking for:
  - `assessment_results` (always in scope)
  - `eur_requests` with `lead_type IN ('eur_application', 'eur_prepayment_application')` (EUR invoice + EUR prepayment)
  - `consultation_requests` with `lead_type='mentorship_application'` (consultation/individual)
- Verify that `rub_intent` is disabled (API rejects; DB guard rejects new inserts).

## Preconditions
- Migrations are applied in order:
  - `20260217_crm_clients_normalization.sql`
  - `20260217_crm_clients_hotfix_review_merge.sql`
  - `20260218_crm_split_consults_and_status_tariff.sql`
  - `20260219_crm_global_table_rename.sql`
  - `20260220_crm_fields_cleanup_breaking.sql`
- API routes are available:
  - `POST /api/assessment/submit`
  - `POST /api/pricing-leads`
  - `POST /api/pricing-leads/retry-webhook`
- Use a dedicated prefix in test data to simplify cleanup:
  - Name prefix: `CRM QA`
  - Email domain: `crm-qa.local`
  - Page path marker: `/crm-qa/`

## Test Data Templates
- Phone A: `+393331110001`
- Phone B: `+393331110002`
- Phone C: `+393331110003`
- Email A: `crm.qa.a@crm-qa.local`
- Email B: `crm.qa.b@crm-qa.local`
- Shared Email: `crm.qa.shared@crm-qa.local`

## Scenario 1: Assessment creates new client
1. Submit assessment with `name=CRM QA User 1`, `phone=Phone A`, `email=Email A`.
2. Verify one row exists in `assessment_results` for this email.
3. Verify `assessment_results.client_id IS NOT NULL`.
4. Verify `leads` has exactly one row with same phone/email and `lifecycle_status='active'`.
5. Verify `client_contacts` has 2 rows for this `client_id`:
   - phone (primary)
   - email (primary)

Expected result:
- Assessment row is linked to a newly created client.

## Scenario 2: Mentorship application links to same client by phone
1. After Scenario 1, submit `mentorship_application`.
2. Verify inserted `consultation_requests` row has `client_id` equal to Scenario 1 client.
3. Verify `leads.last_seen_at` updated.
4. Verify no new `leads` row created.

Expected result:
- Consultation request reuses the same client by phone match.

## Scenario 3: EUR application links by email and updates primary contact
1. Submit EUR lead with:
   - `leadType='eur_application'`
   - `planId='foundation'`
   - `currency='EUR'`
   - `firstName='CRM'`, `lastName='QA User 1'`
   - `email=Email A`
   - `phone=Phone B` (different from old phone)
   - required contract fields + `consentOffer=true`
2. Verify `eur_requests.client_id` equals Scenario 1 client.
3. Verify `leads.phone` became `Phone B` (last seen policy).
4. Verify old phone still exists in `client_contacts` with `is_primary=false`.
5. Verify new phone exists in `client_contacts` with `is_primary=true`.

Expected result:
- Match by email works.
- Primary phone switches to latest known phone.

## Scenario 4: Shared email merges identities by OR rule
1. Submit assessment for another person:
   - `name=CRM QA User 2`
   - `phone=Phone C`
   - `email=Shared Email`
2. Submit consultation request:
   - `firstName='CRM QA User 3'`
   - `phone=Phone B`
   - `email=Shared Email` (if provided)
3. Verify both rows point to the same `client_id` if phone OR email match resolves to one candidate.

Expected result:
- One shared client identity is used (as per OR uniqueness policy).

## Scenario 5: Collision A/B creates placeholder and review
Setup:
1. Create Client A by submitting assessment with `phone=Phone A`, `email=Email A`.
2. Create Client B by submitting assessment with `phone=Phone B`, `email=Email B`.

Execution:
3. Submit in-scope lead with `phone=Phone A` and `email=Email B`.

Validation:
4. Verify new row is saved (no data loss).
5. Verify row `client_id` points to a `leads.lifecycle_status='placeholder'`.
6. Verify one `client_link_reviews` row exists:
   - `status='open'`
   - `candidate_client_ids` contains both A and B.
   - `source_table/source_row_id` points to new source row.

Expected result:
- Collision is captured as review; write path remains successful.

## Scenario 6: Resolve review with `linked_existing`
1. Pick open review from Scenario 5.
2. Execute:
   - `select crm_resolve_client_link_review(<review_id>, 'linked_existing', <client_a_id>, 'qa link existing');`
3. Verify:
   - review `status='resolved'`, `resolution='linked_existing'`, `resolved_client_id=client_a_id`.
   - source row `client_id=client_a_id`.
   - placeholder client is merged into target (`lifecycle_status='merged'`, `merged_into_client_id=client_a_id`).

Expected result:
- Manual resolution relinks source correctly and closes review.

## Scenario 7: Resolve review with `merged_clients`
1. Reproduce new open collision review.
2. Execute:
   - `select crm_resolve_client_link_review(<review_id>, 'merged_clients', <target_client_id>, 'qa merged');`
3. Verify:
   - candidates are merged into target.
   - source row linked to target.
   - review closed with `resolution='merged_clients'`.

Expected result:
- Merge flow consolidates leads and resolves review.

## Scenario 8: Resolve review with `kept_placeholder`
1. Reproduce new open collision review.
2. Execute:
   - `select crm_resolve_client_link_review(<review_id>, 'kept_placeholder', null, 'qa keep placeholder');`
3. Verify:
   - review resolved with `resolved_client_id=placeholder_client_id`.
   - source row remains linked to placeholder.

Expected result:
- Review can be closed without merge/relink.

## Scenario 9: EUR always gets invoice order number and client_id
1. Submit valid EUR lead.
2. Verify:
   - `invoice_order_number IS NOT NULL`
   - `client_id IS NOT NULL`
   - `lead_type='eur_application'`

Expected result:
- EUR lead has both invoice order and CRM link.

## Scenario 10: rub_intent is disabled
1. Submit `rub_intent` lead through API.
2. Verify API returns 400 with error `rub_intent disabled`.
3. Try SQL insert into `eur_requests` with `lead_type='rub_intent'`.
4. Verify DB rejects insert due to check constraint on `lead_type`.

Expected result:
- `rub_intent` is disabled and does not enter the CRM database.

## Scenario 11: Constraint guard for in-scope types
1. Try SQL insert into `eur_requests` for `eur_application` with `client_id` explicitly null and triggers disabled (or with manual transaction mode if available in your env).
2. Verify check constraint prevents bad persisted row.

Expected result:
- In-scope rows cannot persist without `client_id`.

Note:
- If your environment cannot disable triggers, validate guard indirectly:
  - all inserted in-scope rows must end with non-null `client_id`.

## Scenario 12: EUR prepayment full flow (UI -> API -> DB -> webhook)
1. Open `/ru/`.
2. Click prepayment CTA (`Зафиксировать цену за €100`).
3. In payment modal choose EUR option (`Карты зарубежного банка (EUR)`).
4. Verify redirect to `/ru/invoice-request/?mode=prepayment`.
5. Fill EUR form with valid test data and submit.
6. Verify success UI appears.
7. Verify in `eur_requests`:
   - `lead_type='eur_prepayment_application'`
   - `plan_id='universal'`
   - `currency='EUR'`
   - `client_id IS NOT NULL`
   - `invoice_order_number IS NOT NULL`
   - `webhook_status='webhook_delivered'`
8. Verify linked row in `leads` exists and `tariff IS NULL`.
9. Repeat mirrored flow for EN route `/invoice-request/?mode=prepayment`.

Expected result:
- EUR prepayment goes through end-to-end and keeps tariff unchanged.

## Why this bug was not caught before
- Existing tests covered:
  - UI navigation/visibility for prepayment modal and route query,
  - payload normalization/webhook payload unit checks.
- Existing tests did not cover:
  - real form submit for prepayment,
  - actual insert into `eur_requests` under live DB constraints,
  - webhook delivery state transition to `webhook_delivered`.
- Required baseline regression set from now on:
  - API smoke: `/api/pricing-leads` with `eur_prepayment_application` and DB assertions.
  - UI E2E RU + EN submit with DB assertions for `client_id` and webhook status.

## SQL Verification Snippets
```sql
-- A) In-scope rows with missing client_id (must be 0)
select lead_type, count(*) as cnt
from eur_requests
where lead_type in ('eur_application', 'eur_prepayment_application')
  and client_id is null
group by lead_type;

select lead_type, count(*) as cnt
from consultation_requests
where lead_type = 'mentorship_application'
  and client_id is null
group by lead_type;

select count(*) as assessment_missing_client
from assessment_results
where client_id is null;

-- B) Open collision reviews
select id, source_table, source_row_id, candidate_client_ids, created_at
from client_link_reviews
where status = 'open'
order by created_at desc;

-- C) Quick linkage health (without overview views)
select
  c.id as client_id,
  c.phone,
  c.email,
  c.lifecycle_status,
  c.crm_status,
  c.tariff,
  (
    select count(*) from assessment_results ar where ar.client_id = c.id
  ) as assessments_count,
  (
    select count(*) from consultation_requests cr
    where cr.client_id = c.id and cr.lead_type = 'mentorship_application'
  ) as consultation_count,
  (
    select count(*) from eur_requests er
    where er.client_id = c.id and er.lead_type = 'eur_application'
  ) as eur_count
from leads c
order by c.updated_at desc
limit 50;
```

## Cleanup (QA-only test data)
```sql
-- Adjust filters if your test data pattern differs.
delete from eur_requests
where page_path = '/crm-qa/'
   or email like '%@crm-qa.local';

delete from consultation_requests
where page_path = '/crm-qa/'
   or email like '%@crm-qa.local';

delete from assessment_results where email like '%@crm-qa.local';

-- Optional cleanup for orphan placeholders and reviews.
delete from client_link_reviews
where incoming_email_normalized like '%@crm-qa.local';

delete from client_contacts
where contact_value like '%@crm-qa.local'
   or contact_value in ('+393331110001', '+393331110002', '+393331110003');

delete from leads
where email like '%@crm-qa.local'
   or phone in ('+393331110001', '+393331110002', '+393331110003');
```
