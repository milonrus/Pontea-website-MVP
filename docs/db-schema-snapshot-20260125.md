## Supabase Database Reference (User-Provided)
- Source: Supabase SQL Editor outputs provided by the user.
- Note: The columns list below does not include `topics` or `users` rows in the supplied output.

### Tables
```
| table_schema | table_name           |
| ------------ | -------------------- |
| auth         | audit_log_entries    |
| auth         | flow_state           |
| auth         | identities           |
| auth         | instances            |
| auth         | mfa_amr_claims       |
| auth         | mfa_challenges       |
| auth         | mfa_factors          |
| auth         | oauth_authorizations |
| auth         | oauth_client_states  |
| auth         | oauth_clients        |
| auth         | oauth_consents       |
| auth         | one_time_tokens      |
| auth         | refresh_tokens       |
| auth         | saml_providers       |
| auth         | saml_relay_states    |
| auth         | schema_migrations    |
| auth         | sessions             |
| auth         | sso_domains          |
| auth         | sso_providers        |
| auth         | users                |
| public       | attempt_questions    |
| public       | attempt_sections     |
| public       | practice_answers     |
| public       | practice_sessions    |
| public       | question_reports     |
| public       | questions            |
| public       | subjects             |
| public       | test_attempts        |
| public       | test_sections        |
| public       | test_templates       |
| public       | topics               |
| public       | users                |
```

### Columns (public schema)
```
| table_name        | column_name             | data_type                | is_nullable | column_default                                                        |
| ----------------- | ----------------------- | ------------------------ | ----------- | --------------------------------------------------------------------- |
| attempt_questions | id                      | uuid                     | NO          | gen_random_uuid()                                                     |
| attempt_questions | attempt_id              | uuid                     | NO          | null                                                                  |
| attempt_questions | question_id             | uuid                     | NO          | null                                                                  |
| attempt_questions | section_index           | integer                  | YES         | null                                                                  |
| attempt_questions | selected_answer         | text                     | YES         | null                                                                  |
| attempt_questions | is_correct              | boolean                  | YES         | null                                                                  |
| attempt_questions | time_spent              | integer                  | YES         | 0                                                                     |
| attempt_questions | answered_at             | timestamp with time zone | YES         | null                                                                  |
| attempt_questions | created_at              | timestamp with time zone | YES         | now()                                                                 |
| attempt_sections  | id                      | uuid                     | NO          | gen_random_uuid()                                                     |
| attempt_sections  | attempt_id              | uuid                     | NO          | null                                                                  |
| attempt_sections  | section_index           | integer                  | NO          | null                                                                  |
| attempt_sections  | started_at              | timestamp with time zone | YES         | null                                                                  |
| attempt_sections  | completed_at            | timestamp with time zone | YES         | null                                                                  |
| attempt_sections  | status                  | text                     | YES         | 'pending'::text                                                       |
| attempt_sections  | created_at              | timestamp with time zone | YES         | now()                                                                 |
| practice_answers  | id                      | uuid                     | NO          | gen_random_uuid()                                                     |
| practice_answers  | session_id              | uuid                     | NO          | null                                                                  |
| practice_answers  | question_id             | uuid                     | NO          | null                                                                  |
| practice_answers  | selected_answer         | text                     | YES         | null                                                                  |
| practice_answers  | is_correct              | boolean                  | YES         | null                                                                  |
| practice_answers  | time_spent              | integer                  | YES         | 0                                                                     |
| practice_answers  | answered_at             | timestamp with time zone | YES         | now()                                                                 |
| practice_answers  | created_at              | timestamp with time zone | YES         | now()                                                                 |
| practice_sessions | id                      | uuid                     | NO          | gen_random_uuid()                                                     |
| practice_sessions | user_id                 | uuid                     | NO          | null                                                                  |
| practice_sessions | filters                 | jsonb                    | YES         | '{}'::jsonb                                                           |
| practice_sessions | question_ids            | ARRAY                    | YES         | '{}'::uuid[]                                                          |
| practice_sessions | current_index           | integer                  | YES         | 0                                                                     |
| practice_sessions | status                  | text                     | NO          | 'in_progress'::text                                                   |
| practice_sessions | started_at              | timestamp with time zone | YES         | now()                                                                 |
| practice_sessions | completed_at            | timestamp with time zone | YES         | null                                                                  |
| practice_sessions | correct_count           | integer                  | YES         | 0                                                                     |
| practice_sessions | total_time_spent        | integer                  | YES         | 0                                                                     |
| practice_sessions | created_at              | timestamp with time zone | YES         | now()                                                                 |
| question_reports  | id                      | uuid                     | NO          | gen_random_uuid()                                                     |
| question_reports  | question_id             | uuid                     | NO          | null                                                                  |
| question_reports  | reported_by             | uuid                     | NO          | null                                                                  |
| question_reports  | reason                  | text                     | NO          | null                                                                  |
| question_reports  | status                  | text                     | YES         | 'pending'::text                                                       |
| question_reports  | admin_notes             | text                     | YES         | null                                                                  |
| question_reports  | reviewed_by             | uuid                     | YES         | null                                                                  |
| question_reports  | created_at              | timestamp with time zone | YES         | now()                                                                 |
| question_reports  | resolved_at             | timestamp with time zone | YES         | null                                                                  |
| questions         | id                      | uuid                     | NO          | gen_random_uuid()                                                     |
| questions         | subject_id              | uuid                     | YES         | null                                                                  |
| questions         | topic_id                | uuid                     | YES         | null                                                                  |
| questions         | tags                    | ARRAY                    | YES         | '{}'::text[]                                                          |
| questions         | difficulty              | text                     | NO          | 'medium'::text                                                        |
| questions         | question_text           | text                     | NO          | null                                                                  |
| questions         | question_image_url      | text                     | YES         | null                                                                  |
| questions         | options                 | jsonb                    | NO          | '[]'::jsonb                                                           |
| questions         | correct_answer          | text                     | NO          | null                                                                  |
| questions         | explanation             | text                     | YES         | ''::text                                                              |
| questions         | explanation_image_url   | text                     | YES         | null                                                                  |
| questions         | created_by              | uuid                     | YES         | null                                                                  |
| questions         | created_at              | timestamp with time zone | YES         | now()                                                                 |
| questions         | updated_at              | timestamp with time zone | YES         | now()                                                                 |
| questions         | is_active               | boolean                  | YES         | true                                                                  |
| questions         | stats                   | jsonb                    | YES         | '{"correctCount": 0, "totalAttempts": 0, "totalTimeSpent": 0}'::jsonb |
| subjects          | id                      | uuid                     | NO          | gen_random_uuid()                                                     |
| subjects          | name                    | text                     | NO          | null                                                                  |
| subjects          | description             | text                     | YES         | null                                                                  |
| subjects          | order                   | integer                  | YES         | 0                                                                     |
| subjects          | created_at              | timestamp with time zone | YES         | now()                                                                 |
| test_attempts     | id                      | uuid                     | NO          | gen_random_uuid()                                                     |
| test_attempts     | user_id                 | uuid                     | NO          | null                                                                  |
| test_attempts     | template_id             | uuid                     | YES         | null                                                                  |
| test_attempts     | filters                 | jsonb                    | YES         | '{}'::jsonb                                                           |
| test_attempts     | question_ids            | ARRAY                    | YES         | '{}'::uuid[]                                                          |
| test_attempts     | status                  | text                     | NO          | 'in_progress'::text                                                   |
| test_attempts     | started_at              | timestamp with time zone | YES         | now()                                                                 |
| test_attempts     | completed_at            | timestamp with time zone | YES         | null                                                                  |
| test_attempts     | server_start_time       | timestamp with time zone | YES         | now()                                                                 |
| test_attempts     | time_limit_seconds      | integer                  | YES         | null                                                                  |
| test_attempts     | current_section_index   | integer                  | YES         | 0                                                                     |
| test_attempts     | current_question_index  | integer                  | YES         | 0                                                                     |
| test_attempts     | score                   | numeric                  | YES         | null                                                                  |
| test_attempts     | percentage_score        | integer                  | YES         | null                                                                  |
| test_attempts     | correct_count           | integer                  | YES         | 0                                                                     |
| test_attempts     | incorrect_count         | integer                  | YES         | 0                                                                     |
| test_attempts     | unanswered_count        | integer                  | YES         | 0                                                                     |
| test_attempts     | total_time_spent        | integer                  | YES         | 0                                                                     |
| test_attempts     | created_at              | timestamp with time zone | YES         | now()                                                                 |
| test_sections     | id                      | uuid                     | NO          | gen_random_uuid()                                                     |
| test_sections     | template_id             | uuid                     | NO          | null                                                                  |
| test_sections     | name                    | text                     | NO          | null                                                                  |
| test_sections     | description             | text                     | YES         | null                                                                  |
| test_sections     | time_limit_minutes      | integer                  | YES         | null                                                                  |
| test_sections     | question_count          | integer                  | NO          | 10                                                                    |
| test_sections     | subject_id              | uuid                     | YES         | null                                                                  |
| test_sections     | difficulty_distribution | jsonb                    | YES         | '{"easy": 30, "hard": 20, "medium": 50}'::jsonb                       |
| test_sections     | order_index             | integer                  | NO          | 0                                                                     |
| test_sections     | created_at              | timestamp with time zone | YES         | now()                                                                 |
| test_templates    | id                      | uuid                     | NO          | gen_random_uuid()                                                     |
| test_templates    | name                    | text                     | NO          | null                                                                  |
| test_templates    | description             | text                     | YES         | null                                                                  |
| test_templates    | total_time_minutes      | integer                  | NO          | 60                                                                    |
| test_templates    | is_active               | boolean                  | YES         | true                                                                  |
| test_templates    | created_by              | uuid                     | YES         | null                                                                  |
```

### RLS Policies (public schema)
```
| schemaname | tablename         | policyname                             | permissive | roles           | cmd    | qual                                                                                                                                                       | with_check                 |
| ---------- | ----------------- | -------------------------------------- | ---------- | --------------- | ------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------- |
| public     | attempt_questions | Admins can view all attempt questions  | PERMISSIVE | {public}        | SELECT | (EXISTS ( SELECT 1
   FROM users
  WHERE ((users.id = auth.uid()) AND (users.role = 'admin'::text))))                                                      | null                       |
| public     | attempt_questions | Users can manage own attempt questions | PERMISSIVE | {public}        | ALL    | (EXISTS ( SELECT 1
   FROM test_attempts
  WHERE ((test_attempts.id = attempt_questions.attempt_id) AND (test_attempts.user_id = auth.uid()))))            | null                       |
| public     | attempt_sections  | Users can manage own attempt sections  | PERMISSIVE | {public}        | ALL    | (EXISTS ( SELECT 1
   FROM test_attempts
  WHERE ((test_attempts.id = attempt_sections.attempt_id) AND (test_attempts.user_id = auth.uid()))))             | null                       |
| public     | practice_answers  | Users can manage own practice answers  | PERMISSIVE | {public}        | ALL    | (EXISTS ( SELECT 1
   FROM practice_sessions
  WHERE ((practice_sessions.id = practice_answers.session_id) AND (practice_sessions.user_id = auth.uid())))) | null                       |
| public     | practice_sessions | Admins can view all practice sessions  | PERMISSIVE | {public}        | SELECT | (EXISTS ( SELECT 1
   FROM users
  WHERE ((users.id = auth.uid()) AND (users.role = 'admin'::text))))                                                      | null                       |
| public     | practice_sessions | Users can create own practice sessions | PERMISSIVE | {public}        | INSERT | null                                                                                                                                                       | (user_id = auth.uid())     |
| public     | practice_sessions | Users can update own practice sessions | PERMISSIVE | {public}        | UPDATE | (user_id = auth.uid())                                                                                                                                     | null                       |
| public     | practice_sessions | Users can view own practice sessions   | PERMISSIVE | {public}        | SELECT | (user_id = auth.uid())                                                                                                                                     | null                       |
| public     | question_reports  | Admins can manage reports              | PERMISSIVE | {public}        | ALL    | (EXISTS ( SELECT 1
   FROM users
  WHERE ((users.id = auth.uid()) AND (users.role = 'admin'::text))))                                                      | null                       |
| public     | question_reports  | Users can create reports               | PERMISSIVE | {public}        | INSERT | null                                                                                                                                                       | (reported_by = auth.uid()) |
| public     | question_reports  | Users can view own reports             | PERMISSIVE | {public}        | SELECT | (reported_by = auth.uid())                                                                                                                                 | null                       |
| public     | questions         | Admins can manage questions            | PERMISSIVE | {public}        | ALL    | (EXISTS ( SELECT 1
   FROM users
  WHERE ((users.id = auth.uid()) AND (users.role = 'admin'::text))))                                                      | null                       |
| public     | questions         | Admins can read all questions          | PERMISSIVE | {public}        | SELECT | (EXISTS ( SELECT 1
   FROM users
  WHERE ((users.id = auth.uid()) AND (users.role = 'admin'::text))))                                                      | null                       |
| public     | questions         | Anyone can read active questions       | PERMISSIVE | {public}        | SELECT | (is_active = true)                                                                                                                                         | null                       |
| public     | subjects          | Admins can manage subjects             | PERMISSIVE | {public}        | ALL    | (EXISTS ( SELECT 1
   FROM users
  WHERE ((users.id = auth.uid()) AND (users.role = 'admin'::text))))                                                      | null                       |
| public     | subjects          | Anyone can read subjects               | PERMISSIVE | {public}        | SELECT | true                                                                                                                                                       | null                       |
| public     | test_attempts     | Admins can view all test attempts      | PERMISSIVE | {public}        | SELECT | (EXISTS ( SELECT 1
   FROM users
  WHERE ((users.id = auth.uid()) AND (users.role = 'admin'::text))))                                                      | null                       |
| public     | test_attempts     | Users can create own test attempts     | PERMISSIVE | {public}        | INSERT | null                                                                                                                                                       | (user_id = auth.uid())     |
| public     | test_attempts     | Users can update own test attempts     | PERMISSIVE | {public}        | UPDATE | (user_id = auth.uid())                                                                                                                                     | null                       |
| public     | test_attempts     | Users can view own test attempts       | PERMISSIVE | {public}        | SELECT | (user_id = auth.uid())                                                                                                                                     | null                       |
| public     | test_sections     | Admins can manage test sections        | PERMISSIVE | {public}        | ALL    | (EXISTS ( SELECT 1
   FROM users
  WHERE ((users.id = auth.uid()) AND (users.role = 'admin'::text))))                                                      | null                       |
| public     | test_sections     | Anyone can read test sections          | PERMISSIVE | {public}        | SELECT | true                                                                                                                                                       | null                       |
| public     | test_templates    | Admins can manage test templates       | PERMISSIVE | {public}        | ALL    | (EXISTS ( SELECT 1
   FROM users
  WHERE ((users.id = auth.uid()) AND (users.role = 'admin'::text))))                                                      | null                       |
| public     | test_templates    | Anyone can read active test templates  | PERMISSIVE | {public}        | SELECT | (is_active = true)                                                                                                                                         | null                       |
| public     | topics            | Admins can manage topics               | PERMISSIVE | {public}        | ALL    | (EXISTS ( SELECT 1
   FROM users
  WHERE ((users.id = auth.uid()) AND (users.role = 'admin'::text))))                                                      | null                       |
| public     | topics            | Anyone can read topics                 | PERMISSIVE | {public}        | SELECT | true                                                                                                                                                       | null                       |
| public     | users             | Admins can view all users              | PERMISSIVE | {public}        | SELECT | (EXISTS ( SELECT 1
   FROM users u
  WHERE ((u.id = auth.uid()) AND (u.role = 'admin'::text))))                                                            | null                       |
| public     | users             | Enable insert access                   | PERMISSIVE | {authenticated} | INSERT | null                                                                                                                                                       | (auth.uid() = id)          |
| public     | users             | Enable read access                     | PERMISSIVE | {authenticated} | SELECT | true                                                                                                                                                       | null                       |
| public     | users             | Enable update access                   | PERMISSIVE | {authenticated} | UPDATE | (auth.uid() = id)                                                                                                                                          | (auth.uid() = id)          |
| public     | users             | Users can insert own profile           | PERMISSIVE | {public}        | INSERT | null                                                                                                                                                       | (id = auth.uid())          |
| public     | users             | Users can update own profile           | PERMISSIVE | {public}        | UPDATE | (id = auth.uid())                                                                                                                                          | null                       |
| public     | users             | Users can view own profile             | PERMISSIVE | {public}        | SELECT | (id = auth.uid())                                                                                                                                          | null                       |
```

### Grants (public schema)
```
| table_schema | table_name        | grantee       | privilege_type |
| ------------ | ----------------- | ------------- | -------------- |
| public       | attempt_questions | anon          | DELETE         |
| public       | attempt_questions | anon          | INSERT         |
| public       | attempt_questions | anon          | REFERENCES     |
| public       | attempt_questions | anon          | SELECT         |
| public       | attempt_questions | anon          | TRIGGER        |
| public       | attempt_questions | anon          | TRUNCATE       |
| public       | attempt_questions | anon          | UPDATE         |
| public       | attempt_questions | authenticated | DELETE         |
| public       | attempt_questions | authenticated | INSERT         |
| public       | attempt_questions | authenticated | REFERENCES     |
| public       | attempt_questions | authenticated | SELECT         |
| public       | attempt_questions | authenticated | TRIGGER        |
| public       | attempt_questions | authenticated | TRUNCATE       |
| public       | attempt_questions | authenticated | UPDATE         |
| public       | attempt_questions | postgres      | DELETE         |
| public       | attempt_questions | postgres      | INSERT         |
| public       | attempt_questions | postgres      | REFERENCES     |
| public       | attempt_questions | postgres      | SELECT         |
| public       | attempt_questions | postgres      | TRIGGER        |
| public       | attempt_questions | postgres      | TRUNCATE       |
| public       | attempt_questions | postgres      | UPDATE         |
| public       | attempt_questions | service_role  | DELETE         |
| public       | attempt_questions | service_role  | INSERT         |
| public       | attempt_questions | service_role  | REFERENCES     |
| public       | attempt_questions | service_role  | SELECT         |
| public       | attempt_questions | service_role  | TRIGGER        |
| public       | attempt_questions | service_role  | TRUNCATE       |
| public       | attempt_questions | service_role  | UPDATE         |
| public       | attempt_sections  | anon          | DELETE         |
| public       | attempt_sections  | anon          | INSERT         |
| public       | attempt_sections  | anon          | REFERENCES     |
| public       | attempt_sections  | anon          | SELECT         |
| public       | attempt_sections  | anon          | TRIGGER        |
| public       | attempt_sections  | anon          | TRUNCATE       |
| public       | attempt_sections  | anon          | UPDATE         |
| public       | attempt_sections  | authenticated | DELETE         |
| public       | attempt_sections  | authenticated | INSERT         |
| public       | attempt_sections  | authenticated | REFERENCES     |
| public       | attempt_sections  | authenticated | SELECT         |
| public       | attempt_sections  | authenticated | TRIGGER        |
| public       | attempt_sections  | authenticated | TRUNCATE       |
| public       | attempt_sections  | authenticated | UPDATE         |
| public       | attempt_sections  | postgres      | DELETE         |
| public       | attempt_sections  | postgres      | INSERT         |
| public       | attempt_sections  | postgres      | REFERENCES     |
| public       | attempt_sections  | postgres      | SELECT         |
| public       | attempt_sections  | postgres      | TRIGGER        |
| public       | attempt_sections  | postgres      | TRUNCATE       |
| public       | attempt_sections  | postgres      | UPDATE         |
| public       | attempt_sections  | service_role  | DELETE         |
| public       | attempt_sections  | service_role  | INSERT         |
| public       | attempt_sections  | service_role  | REFERENCES     |
| public       | attempt_sections  | service_role  | SELECT         |
| public       | attempt_sections  | service_role  | TRIGGER        |
| public       | attempt_sections  | service_role  | TRUNCATE       |
| public       | attempt_sections  | service_role  | UPDATE         |
| public       | practice_answers  | anon          | DELETE         |
| public       | practice_answers  | anon          | INSERT         |
| public       | practice_answers  | anon          | REFERENCES     |
| public       | practice_answers  | anon          | SELECT         |
| public       | practice_answers  | anon          | TRIGGER        |
| public       | practice_answers  | anon          | TRUNCATE       |
| public       | practice_answers  | anon          | UPDATE         |
| public       | practice_answers  | authenticated | DELETE         |
| public       | practice_answers  | authenticated | INSERT         |
| public       | practice_answers  | authenticated | REFERENCES     |
| public       | practice_answers  | authenticated | SELECT         |
| public       | practice_answers  | authenticated | TRIGGER        |
| public       | practice_answers  | authenticated | TRUNCATE       |
| public       | practice_answers  | authenticated | UPDATE         |
| public       | practice_answers  | postgres      | DELETE         |
| public       | practice_answers  | postgres      | INSERT         |
| public       | practice_answers  | postgres      | REFERENCES     |
| public       | practice_answers  | postgres      | SELECT         |
| public       | practice_answers  | postgres      | TRIGGER        |
| public       | practice_answers  | postgres      | TRUNCATE       |
| public       | practice_answers  | postgres      | UPDATE         |
| public       | practice_answers  | service_role  | DELETE         |
| public       | practice_answers  | service_role  | INSERT         |
| public       | practice_answers  | service_role  | REFERENCES     |
| public       | practice_answers  | service_role  | SELECT         |
| public       | practice_answers  | service_role  | TRIGGER        |
| public       | practice_answers  | service_role  | TRUNCATE       |
| public       | practice_answers  | service_role  | UPDATE         |
| public       | practice_sessions | anon          | DELETE         |
| public       | practice_sessions | anon          | INSERT         |
| public       | practice_sessions | anon          | REFERENCES     |
| public       | practice_sessions | anon          | SELECT         |
| public       | practice_sessions | anon          | TRIGGER        |
| public       | practice_sessions | anon          | TRUNCATE       |
| public       | practice_sessions | anon          | UPDATE         |
| public       | practice_sessions | authenticated | DELETE         |
| public       | practice_sessions | authenticated | INSERT         |
| public       | practice_sessions | authenticated | REFERENCES     |
| public       | practice_sessions | authenticated | SELECT         |
| public       | practice_sessions | authenticated | TRIGGER        |
| public       | practice_sessions | authenticated | TRUNCATE       |
| public       | practice_sessions | authenticated | UPDATE         |
| public       | practice_sessions | postgres      | DELETE         |
| public       | practice_sessions | postgres      | INSERT         |
| public       | practice_sessions | postgres      | REFERENCES     |
| public       | practice_sessions | postgres      | SELECT         |
| public       | practice_sessions | postgres      | TRIGGER        |
| public       | practice_sessions | postgres      | TRUNCATE       |
| public       | practice_sessions | postgres      | UPDATE         |
| public       | practice_sessions | service_role  | DELETE         |
| public       | practice_sessions | service_role  | INSERT         |
| public       | practice_sessions | service_role  | REFERENCES     |
| public       | practice_sessions | service_role  | SELECT         |
| public       | practice_sessions | service_role  | TRIGGER        |
| public       | practice_sessions | service_role  | TRUNCATE       |
| public       | practice_sessions | service_role  | UPDATE         |
| public       | question_reports  | anon          | DELETE         |
| public       | question_reports  | anon          | INSERT         |
| public       | question_reports  | anon          | REFERENCES     |
| public       | question_reports  | anon          | SELECT         |
| public       | question_reports  | anon          | TRIGGER        |
| public       | question_reports  | anon          | TRUNCATE       |
| public       | question_reports  | anon          | UPDATE         |
| public       | question_reports  | authenticated | DELETE         |
| public       | question_reports  | authenticated | INSERT         |
| public       | question_reports  | authenticated | REFERENCES     |
| public       | question_reports  | authenticated | SELECT         |
| public       | question_reports  | authenticated | TRIGGER        |
| public       | question_reports  | authenticated | TRUNCATE       |
| public       | question_reports  | authenticated | UPDATE         |
| public       | question_reports  | postgres      | DELETE         |
| public       | question_reports  | postgres      | INSERT         |
| public       | question_reports  | postgres      | REFERENCES     |
| public       | question_reports  | postgres      | SELECT         |
| public       | question_reports  | postgres      | TRIGGER        |
| public       | question_reports  | postgres      | TRUNCATE       |
| public       | question_reports  | postgres      | UPDATE         |
| public       | question_reports  | service_role  | DELETE         |
| public       | question_reports  | service_role  | INSERT         |
| public       | question_reports  | service_role  | REFERENCES     |
| public       | question_reports  | service_role  | SELECT         |
| public       | question_reports  | service_role  | TRIGGER        |
| public       | question_reports  | service_role  | TRUNCATE       |
| public       | question_reports  | service_role  | UPDATE         |
| public       | questions         | anon          | DELETE         |
| public       | questions         | anon          | INSERT         |
| public       | questions         | anon          | REFERENCES     |
| public       | questions         | anon          | SELECT         |
| public       | questions         | anon          | TRIGGER        |
| public       | questions         | anon          | TRUNCATE       |
| public       | questions         | anon          | UPDATE         |
| public       | questions         | authenticated | DELETE         |
| public       | questions         | authenticated | INSERT         |
| public       | questions         | authenticated | REFERENCES     |
| public       | questions         | authenticated | SELECT         |
| public       | questions         | authenticated | TRIGGER        |
| public       | questions         | authenticated | TRUNCATE       |
| public       | questions         | authenticated | UPDATE         |
| public       | questions         | postgres      | DELETE         |
| public       | questions         | postgres      | INSERT         |
| public       | questions         | postgres      | REFERENCES     |
| public       | questions         | postgres      | SELECT         |
| public       | questions         | postgres      | TRIGGER        |
| public       | questions         | postgres      | TRUNCATE       |
| public       | questions         | postgres      | UPDATE         |
| public       | questions         | service_role  | DELETE         |
| public       | questions         | service_role  | INSERT         |
| public       | questions         | service_role  | REFERENCES     |
| public       | questions         | service_role  | SELECT         |
| public       | questions         | service_role  | TRIGGER        |
| public       | questions         | service_role  | TRUNCATE       |
| public       | questions         | service_role  | UPDATE         |
| public       | subjects          | anon          | DELETE         |
| public       | subjects          | anon          | INSERT         |
| public       | subjects          | anon          | REFERENCES     |
| public       | subjects          | anon          | SELECT         |
| public       | subjects          | anon          | TRIGGER        |
| public       | subjects          | anon          | TRUNCATE       |
| public       | subjects          | anon          | UPDATE         |
| public       | subjects          | authenticated | DELETE         |
| public       | subjects          | authenticated | INSERT         |
| public       | subjects          | authenticated | REFERENCES     |
| public       | subjects          | authenticated | SELECT         |
| public       | subjects          | authenticated | TRIGGER        |
| public       | subjects          | authenticated | TRUNCATE       |
| public       | subjects          | authenticated | UPDATE         |
| public       | subjects          | postgres      | DELETE         |
| public       | subjects          | postgres      | INSERT         |
| public       | subjects          | postgres      | REFERENCES     |
| public       | subjects          | postgres      | SELECT         |
| public       | subjects          | postgres      | TRIGGER        |
| public       | subjects          | postgres      | TRUNCATE       |
| public       | subjects          | postgres      | UPDATE         |
| public       | subjects          | service_role  | DELETE         |
| public       | subjects          | service_role  | INSERT         |
| public       | subjects          | service_role  | REFERENCES     |
| public       | subjects          | service_role  | SELECT         |
| public       | subjects          | service_role  | TRIGGER        |
| public       | subjects          | service_role  | TRUNCATE       |
| public       | subjects          | service_role  | UPDATE         |
| public       | test_attempts     | anon          | DELETE         |
| public       | test_attempts     | anon          | INSERT         |
| public       | test_attempts     | anon          | REFERENCES     |
| public       | test_attempts     | anon          | SELECT         |
| public       | test_attempts     | anon          | TRIGGER        |
| public       | test_attempts     | anon          | TRUNCATE       |
| public       | test_attempts     | anon          | UPDATE         |
| public       | test_attempts     | authenticated | DELETE         |
| public       | test_attempts     | authenticated | INSERT         |
| public       | test_attempts     | authenticated | REFERENCES     |
| public       | test_attempts     | authenticated | SELECT         |
| public       | test_attempts     | authenticated | TRIGGER        |
| public       | test_attempts     | authenticated | TRUNCATE       |
| public       | test_attempts     | authenticated | UPDATE         |
| public       | test_attempts     | postgres      | DELETE         |
| public       | test_attempts     | postgres      | INSERT         |
| public       | test_attempts     | postgres      | REFERENCES     |
| public       | test_attempts     | postgres      | SELECT         |
| public       | test_attempts     | postgres      | TRIGGER        |
| public       | test_attempts     | postgres      | TRUNCATE       |
| public       | test_attempts     | postgres      | UPDATE         |
| public       | test_attempts     | service_role  | DELETE         |
| public       | test_attempts     | service_role  | INSERT         |
| public       | test_attempts     | service_role  | REFERENCES     |
| public       | test_attempts     | service_role  | SELECT         |
| public       | test_attempts     | service_role  | TRIGGER        |
| public       | test_attempts     | service_role  | TRUNCATE       |
| public       | test_attempts     | service_role  | UPDATE         |
| public       | test_sections     | anon          | DELETE         |
| public       | test_sections     | anon          | INSERT         |
| public       | test_sections     | anon          | REFERENCES     |
| public       | test_sections     | anon          | SELECT         |
| public       | test_sections     | anon          | TRIGGER        |
| public       | test_sections     | anon          | TRUNCATE       |
| public       | test_sections     | anon          | UPDATE         |
| public       | test_sections     | authenticated | DELETE         |
| public       | test_sections     | authenticated | INSERT         |
| public       | test_sections     | authenticated | REFERENCES     |
| public       | test_sections     | authenticated | SELECT         |
| public       | test_sections     | authenticated | TRIGGER        |
| public       | test_sections     | authenticated | TRUNCATE       |
| public       | test_sections     | authenticated | UPDATE         |
| public       | test_sections     | postgres      | DELETE         |
| public       | test_sections     | postgres      | INSERT         |
| public       | test_sections     | postgres      | REFERENCES     |
| public       | test_sections     | postgres      | SELECT         |
| public       | test_sections     | postgres      | TRIGGER        |
| public       | test_sections     | postgres      | TRUNCATE       |
| public       | test_sections     | postgres      | UPDATE         |
| public       | test_sections     | service_role  | DELETE         |
| public       | test_sections     | service_role  | INSERT         |
| public       | test_sections     | service_role  | REFERENCES     |
| public       | test_sections     | service_role  | SELECT         |
| public       | test_sections     | service_role  | TRIGGER        |
| public       | test_sections     | service_role  | TRUNCATE       |
| public       | test_sections     | service_role  | UPDATE         |
| public       | test_templates    | anon          | DELETE         |
| public       | test_templates    | anon          | INSERT         |
| public       | test_templates    | anon          | REFERENCES     |
| public       | test_templates    | anon          | SELECT         |
| public       | test_templates    | anon          | TRIGGER        |
| public       | test_templates    | anon          | TRUNCATE       |
| public       | test_templates    | anon          | UPDATE         |
| public       | test_templates    | authenticated | DELETE         |
| public       | test_templates    | authenticated | INSERT         |
| public       | test_templates    | authenticated | REFERENCES     |
| public       | test_templates    | authenticated | SELECT         |
| public       | test_templates    | authenticated | TRIGGER        |
| public       | test_templates    | authenticated | TRUNCATE       |
| public       | test_templates    | authenticated | UPDATE         |
| public       | test_templates    | postgres      | DELETE         |
| public       | test_templates    | postgres      | INSERT         |
| public       | test_templates    | postgres      | REFERENCES     |
| public       | test_templates    | postgres      | SELECT         |
| public       | test_templates    | postgres      | TRIGGER        |
| public       | test_templates    | postgres      | TRUNCATE       |
| public       | test_templates    | postgres      | UPDATE         |
| public       | test_templates    | service_role  | DELETE         |
| public       | test_templates    | service_role  | INSERT         |
| public       | test_templates    | service_role  | REFERENCES     |
| public       | test_templates    | service_role  | SELECT         |
| public       | test_templates    | service_role  | TRIGGER        |
| public       | test_templates    | service_role  | TRUNCATE       |
| public       | test_templates    | service_role  | UPDATE         |
| public       | topics            | anon          | DELETE         |
| public       | topics            | anon          | INSERT         |
| public       | topics            | anon          | REFERENCES     |
| public       | topics            | anon          | SELECT         |
| public       | topics            | anon          | TRIGGER        |
| public       | topics            | anon          | TRUNCATE       |
| public       | topics            | anon          | UPDATE         |
| public       | topics            | authenticated | DELETE         |
| public       | topics            | authenticated | INSERT         |
| public       | topics            | authenticated | REFERENCES     |
| public       | topics            | authenticated | SELECT         |
| public       | topics            | authenticated | TRIGGER        |
| public       | topics            | authenticated | TRUNCATE       |
| public       | topics            | authenticated | UPDATE         |
| public       | topics            | postgres      | DELETE         |
| public       | topics            | postgres      | INSERT         |
| public       | topics            | postgres      | REFERENCES     |
| public       | topics            | postgres      | SELECT         |
| public       | topics            | postgres      | TRIGGER        |
| public       | topics            | postgres      | TRUNCATE       |
| public       | topics            | postgres      | UPDATE         |
| public       | topics            | service_role  | DELETE         |
| public       | topics            | service_role  | INSERT         |
| public       | topics            | service_role  | REFERENCES     |
| public       | topics            | service_role  | SELECT         |
| public       | topics            | service_role  | TRIGGER        |
| public       | topics            | service_role  | TRUNCATE       |
| public       | topics            | service_role  | UPDATE         |
| public       | users             | anon          | DELETE         |
| public       | users             | anon          | INSERT         |
| public       | users             | anon          | REFERENCES     |
| public       | users             | anon          | SELECT         |
| public       | users             | anon          | TRIGGER        |
| public       | users             | anon          | TRUNCATE       |
| public       | users             | anon          | UPDATE         |
| public       | users             | authenticated | DELETE         |
| public       | users             | authenticated | INSERT         |
| public       | users             | authenticated | REFERENCES     |
| public       | users             | authenticated | SELECT         |
| public       | users             | authenticated | TRIGGER        |
| public       | users             | authenticated | TRUNCATE       |
| public       | users             | authenticated | UPDATE         |
| public       | users             | postgres      | DELETE         |
| public       | users             | postgres      | INSERT         |
| public       | users             | postgres      | REFERENCES     |
| public       | users             | postgres      | SELECT         |
| public       | users             | postgres      | TRIGGER        |
| public       | users             | postgres      | TRUNCATE       |
| public       | users             | postgres      | UPDATE         |
| public       | users             | service_role  | DELETE         |
| public       | users             | service_role  | INSERT         |
| public       | users             | service_role  | REFERENCES     |
| public       | users             | service_role  | SELECT         |
| public       | users             | service_role  | TRIGGER        |
| public       | users             | service_role  | TRUNCATE       |
| public       | users             | service_role  | UPDATE         |
```

### Triggers
- None (no rows returned).

### Functions (public schema)
```
CREATE OR REPLACE FUNCTION public.admin_update_user_role(target_user_id uuid, new_role text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
    BEGIN
      -- Check if caller is admin (this query is OK because it's checking the caller's own row)
      IF NOT EXISTS (
        SELECT 1 FROM public.users
        WHERE id = auth.uid() AND role = 'admin'
      ) THEN
        RAISE EXCEPTION 'Only admins can update user roles';
      END IF;

      -- Update the target user's role
      UPDATE public.users
      SET role = new_role
      WHERE id = target_user_id;
    END;
    $function$;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
 begin
   insert into public.users (id, email, display_name, role, created_at)
   values (
     new.id,
     new.email,
     coalesce(new.raw_user_meta_data->>'full_name', new.email, 'Student'),
     'student',
     now()
   );
   return new;
 end;
 $function$;

CREATE OR REPLACE FUNCTION public.submit_answer(user_id uuid, set_id uuid, question_id uuid, selected_answer text, time_spent integer, is_correct boolean)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
BEGIN
  -- Insert the response
  INSERT INTO exercise_responses (
    exercise_set_id,
    question_id,
    selected_answer,
    is_correct,
    time_spent,
    answered_at
  ) VALUES (
    set_id,
    question_id,
    selected_answer,
    is_correct,
    time_spent,
    NOW()
  );

  -- Update exercise set stats
  UPDATE exercise_sets
  SET
    current_index = current_index + 1,
    correct_count = correct_count + CASE WHEN is_correct THEN 1 ELSE 0 END,
    total_time_spent = total_time_spent + time_spent
  WHERE id = set_id;

  -- Update question stats
  UPDATE questions
  SET stats = jsonb_set(
    jsonb_set(
      jsonb_set(
        stats,
        '{totalAttempts}',
        to_jsonb((stats->>'totalAttempts')::int + 1)
      ),
      '{totalTimeSpent}',
      to_jsonb((stats->>'totalTimeSpent')::int + time_spent)
    ),
    '{correctCount}',
    to_jsonb((stats->>'correctCount')::int + CASE WHEN is_correct THEN 1 ELSE 0 END)
  )
  WHERE id = question_id;

  -- Ensure student_progress record exists
  INSERT INTO student_progress (id, last_activity_at)
  VALUES (user_id, NOW())
  ON CONFLICT (id) DO NOTHING;

  -- Update student progress
  UPDATE student_progress
  SET
    total_questions_attempted = total_questions_attempted + 1,
    total_correct = total_correct + CASE WHEN is_correct THEN 1 ELSE 0 END,
    total_time_spent = total_time_spent + time_spent,
    last_activity_at = NOW()
  WHERE id = user_id;
END;
$function$;
```

### RLS Status (public schema)
```
| table             | relrowsecurity | relforcerowsecurity |
| ----------------- | -------------- | ------------------- |
| attempt_questions | true           | false               |
| attempt_sections  | true           | false               |
| practice_answers  | true           | false               |
| practice_sessions | true           | false               |
| question_reports  | true           | false               |
| questions         | true           | false               |
| subjects          | true           | false               |
| test_attempts     | true           | false               |
| test_sections     | true           | false               |
| test_templates    | true           | false               |
| topics            | true           | false               |
| users             | true           | false               |
```

### Extensions
```
| extname            | extversion |
| ------------------ | ---------- |
| pg_graphql         | 1.5.11     |
| pg_stat_statements | 1.11       |
| pgcrypto           | 1.3        |
| plpgsql            | 1.0        |
| supabase_vault     | 0.3.1      |
| uuid-ossp          | 1.1        |
```
