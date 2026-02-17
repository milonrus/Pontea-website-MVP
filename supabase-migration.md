# Supabase Migration Report (Cloud -> Self-Hosted)

Дата отчета: 2026-02-17  
Проект: Pontea (`pontea.school`)

## 1) Итоговый статус

Миграция с Supabase Cloud на self-hosted Supabase на VPS **выполнена**.  
Приложение переключено на self-hosted инстанс и задеплоено с новыми ENV.

## 2) Что было целью

- Полный перенос рабочей БД приложения с cloud Supabase на self-hosted Supabase.
- Source of truth: cloud Supabase.
- Формат cutover: cold cutover (короткое окно с остановкой записей).
- Scope переноса:
  - `public` (schema + data + policies/functions/triggers из дампа),
  - `auth.users`,
  - `auth.identities`.
- Storage не переносился (в scope не входил).

## 3) Что сделано (факт)

### 3.1 Доступы и preflight

- Получен доступ к VPS и проверены контейнеры:
  - приложение,
  - self-hosted Supabase stack,
  - Postgres контейнер self-hosted.
- Найдены и проверены параметры подключения target БД (self-hosted).
- Для source (Supabase Cloud) выявлена типовая проблема:
  - direct host `db.<ref>.supabase.co:5432` недоступен с VPS (IPv6-only сценарий),
  - использован `pooler` endpoint.
- Рабочее подключение к source достигнуто через pooler с корректным портом/учетными данными.

### 3.2 Cutover и перенос

- Остановлены записи со стороны приложения (контейнер приложения остановлен на окно миграции).
- Выполнен финальный экспорт source:
  - `public` dump,
  - data-only dump `auth.users` + `auth.identities`.
- Выполнен импорт в target (self-hosted):
  1. импорт auth (`TRUNCATE ... CASCADE` + restore users/identities),
  2. импорт `public`.
- Устранена несовместимость дампа PostgreSQL 17 -> PostgreSQL 15:
  - удалены PG17-специфичные команды из SQL-файлов,
  - адаптирован порядок импорта.
- Удалены конфликтующие legacy-таблицы в target (`public."Clinet"`, `public."Test"`), мешавшие чистому восстановлению schema.
- Восстановлены GRANT-права для ролей Supabase API:
  - `anon`,
  - `authenticated`,
  - `service_role`,
  чтобы PostgREST корректно видел таблицы.

### 3.3 Переключение приложения

- Обновлены ENV приложения в Coolify на self-hosted:
  - `NEXT_PUBLIC_SUPABASE_URL=https://supabase.pontea.school`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY=<self-hosted anon key>`
  - `SUPABASE_SERVICE_ROLE_KEY=<self-hosted service role key>`
  - `NEXT_PUBLIC_APP_URL=https://pontea.school`
- Выполнен redeploy приложения (важно для `NEXT_PUBLIC_*` переменных).
- Новый контейнер приложения поднят и работает.

### 3.4 Проверки после переключения

- Проверена доступность сайта `https://pontea.school` (HTTP 200).
- Проверен self-hosted Supabase gateway.
- Проверен REST-запрос к `rest/v1` с anon key: данные возвращаются.
- Выполнена сверка row counts source vs target:
  - ключевые таблицы `public` совпадают,
  - `auth.users` и `auth.identities` совпадают.

## 4) Acceptance criteria — статус

1. `public` схема/данные перенесены: **выполнено**.  
2. Row counts по ключевым таблицам совпадают: **выполнено**.  
3. Existing users migrated (`auth.users/identities`): **выполнено**.  
4. API/routes с новыми ключами работают: **выполнено (smoke)**.  
5. На фронте нет запросов к старому cloud URL: **выполнено после redeploy**.  
6. Google OAuth end-to-end через self-hosted callback: **требует финальной проверки/донастройки**.  
7. 24h мониторинг ошибок auth/db: **в процессе/после cutover**.

## 5) Что осталось доделать

1. Финализировать Google OAuth на self-hosted:
   - задать `GOTRUE_EXTERNAL_GOOGLE_CLIENT_ID`,
   - задать `GOTRUE_EXTERNAL_GOOGLE_SECRET`,
   - проверить redirect URI в Google Cloud:
     - `https://supabase.pontea.school/auth/v1/callback`.
2. Прогнать smoke по auth-сценариям вручную:
   - login/signup/logout,
   - password update,
   - вход через Google.
3. 24 часа мониторить логи:
   - auth/db ошибки,
   - 401/403/500,
   - latency/regressions.
4. С учетом публикации credentials в чате:
   - снова сменить пароль cloud DB,
   - убедиться, что новые секреты сохранены только в защищенных ENV/secret storage.

## 6) Rollback (14 дней)

- Cloud Supabase держим 14 дней без удаления.
- Для отката:
  1. вернуть старые cloud ENV в Coolify:
     - `NEXT_PUBLIC_SUPABASE_URL`,
     - `NEXT_PUBLIC_SUPABASE_ANON_KEY`,
     - `SUPABASE_SERVICE_ROLE_KEY`;
  2. выполнить redeploy приложения.
- Важно: данные, записанные после cutover в self-hosted, автоматически в cloud не попадут (reverse migration отдельно не настроен).

## 7) Артефакты и скрипты

Созданы/обновлены утилиты для повторяемого cutover:

- `/Users/mikhail/Documents/vibe-coding/Pontea-website-MVP/scripts/supabase-cutover-vps.sh`
- `/Users/mikhail/Documents/vibe-coding/Pontea-website-MVP/scripts/supabase-rowcount-compare.sh`

Файл отражает фактический ход миграции и текущее состояние на дату отчета.
