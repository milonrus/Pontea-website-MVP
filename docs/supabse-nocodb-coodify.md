# Pontea + Coolify + Supabase + NocoDB

> Важно: этот документ сохранен как история миграции/инцидентов.  
> Single source of truth по VM: `docs/pontea-vm-runbook.md` (актуализация: 2026-02-18).

## Финальный статус (после clean restart, resize и привязки NocoDB к Supabase)

**Дата/время фиксации:** 2026-02-16 23:25 UTC  
**Сервер:** `mikhail@89.232.188.98`  
**Результат:** миграция завершена, сервисы работают.

### Что подтверждено

- VM увеличена до `8 vCPU / 16 GB RAM / 100 GB SSD`.
- Root FS расширен и активен:
  - `/dev/vda1` ~`97G`
  - свободно ~`79G` (на момент финальной проверки)
- Выполнен clean stop перед рестартом:
  - остановлены app/supabase/nocodb
  - оставлены только core контейнеры Coolify
- `pontea-web` переведен на `build_pack=dockerfile`.
- App redeploy завершился `finished`:
  - deployment UUID: `d8wso8sg0okc8os8cwk844s8`
- Supabase успешно поднят и healthy.
- NocoDB поднят и healthy.
- NocoDB переведен на PostgreSQL внутри Supabase (`supabase-db-k4k0...`).
- Отдельная NocoDB DB (`lwk8...`) остановлена и больше не нужна для текущей работы.

---

## Итоговые endpoint проверки

- `https://pontea.school` -> `200`
- `https://www.pontea.school` -> `302` (редирект на non-www)
- `https://supabase.pontea.school` -> `401` (ожидаемо для API через Kong)
- `https://supabase-studio.pontea.school` -> `307` (ожидаемо)
- `https://nocodb.pontea.school` -> `302` (ожидаемо)

---

## Важные идентификаторы

- App UUID: `yg0k00gswcg40g8ssgssoo0c`
- Supabase service UUID: `k4k0k4o0oog8w8480okc4g48`
- NocoDB service UUID: `v484wscoso8s8kswkscscc44`
- Legacy NocoDB database UUID (old standalone): `lwk8ok8wo8ko0ogwwwwocck8`

---

## Что было ключевым в фиксе

1. Убрали зависшие/орфанные build-процессы (`nix-env`, helper build shells).
2. Перешли с `nixpacks` на `dockerfile` для app.
3. Очистили Docker cache/images (без удаления volumes).
4. Поднимали сервисы в правильном порядке:
   - app first
   - supabase
   - nocodb
5. Мигрировали NocoDB на Supabase DB:
   - создана роль `nocodb` в `supabase-db`
   - создана БД `nocodb`
   - обновлен `NC_DB` в сервисе NocoDB на `supabase-db-k4k0k4o0oog8w8480okc4g48:5432`
   - выполнен `restart` NocoDB
   - old standalone DB `lwk8...` остановлена

---

## Миграция NocoDB -> Supabase DB (выполнено)

- Текущее значение `NC_DB` у сервиса NocoDB:
  - `pg://supabase-db-k4k0k4o0oog8w8480okc4g48:5432?u=nocodb&p=<secret>&d=nocodb`
- Проверка применения:
  - внутри контейнера `nocodb-v484...` переменная `NC_DB` указывает на `supabase-db-k4k0...`
  - `https://nocodb.pontea.school` отвечает `302`
- Файлы на VM для rollback/аудита:
  - `/home/mikhail/nocodb-ncdb-backup-20260216-231247.txt` (старый `NC_DB`)
  - `/home/mikhail/nocodb-supabase-db-password.txt` (пароль роли `nocodb` в Supabase DB)

---

## Инцидент 2026-02-17: NocoDB `503` после миграции Supabase

### Симптом

- `https://nocodb.pontea.school` отдавал `503`.
- Контейнер `nocodb-v484...` был в `Restarting (1)`.
- В логах NocoDB:
  - `getaddrinfo ENOTFOUND supabase-db-k4k0k4o0oog8w8480okc4g48`

### Причина

- `NC_DB` у NocoDB указывает на internal hostname Supabase DB:
  - `supabase-db-k4k0k4o0oog8w8480okc4g48`.
- После изменений в окружении контейнеры оказались в разных Docker network:
  - NocoDB: `v484wscoso8s8kswkscscc44`
  - Supabase: `k4k0k4o0oog8w8480okc4g48`
- В результате hostname БД не резолвился из NocoDB (DNS `ENOTFOUND`), сервис падал на старте.

### Фикс (применен)

**Рекомендуемый фикс:** подключить **NocoDB** к сети **Supabase**, чтобы после `supabase` redeploy/recreate не нужно было каждый раз руками «добавлять» DB в сеть NocoDB.

```bash
sudo docker network connect k4k0k4o0oog8w8480okc4g48 nocodb-v484wscoso8s8kswkscscc44 || true
```

Если раньше применяли старый workaround (подключали DB в сеть NocoDB), можно убрать лишнюю связь:

```bash
sudo docker network disconnect v484wscoso8s8kswkscscc44 supabase-db-k4k0k4o0oog8w8480okc4g48 || true
```

Проверки:

- `nocodb-v484...` -> `Up (healthy)`
- `https://nocodb.pontea.school` -> `302 https://nocodb.pontea.school/dashboard`
- Внутри `nocodb-v484...` резолвится `supabase-db-k4k0...` (и/или `supabase-db`) и есть TCP-коннект до `:5432`.

### Важно на будущее

- Важно, что проблема тут **network-level**: Docker DNS резолвит контейнерные hostname только внутри общей сети.
- Старый workaround (подключать `supabase-db-*` в сеть `v484...`) часто ломается после `supabase` redeploy/recreate (DB контейнер пересоздается и связь с сетью теряется).
- Если держать NocoDB подключенным к сети Supabase (`k4k0...`), то `supabase` redeploy обычно проходит без падения NocoDB.

### Update 2026-02-18: "Permanent" hardening

Чтобы не возвращаться к ручному `docker network connect` после пересоздания контейнеров, зафиксировали связь на уровне compose NocoDB:

- В `/data/coolify/services/v484wscoso8s8kswkscscc44/docker-compose.yml` добавлена external-сеть Supabase `k4k0k4o0oog8w8480okc4g48`.
- `nocodb` подключен к двум сетям: `v484...` (ingress) и `k4k0...` (доступ к DB).
- В `/data/coolify/services/v484wscoso8s8kswkscscc44/.env` `NC_DB` переведен на `supabase-db` (alias), чтобы не зависеть от длинного имени контейнера.

Авто-фикс через systemd timer больше не требуется и не установлен (оставлен ниже только как опциональный шаблон).

### Авто-фикс (опционально)

Если по каким-то причинам NocoDB периодически пересоздается/переезжает между сетями (и проблема повторяется), можно поставить на VM systemd-timer, который будет автоматически проверять сеть и, при необходимости, подключать `nocodb-*` к сети Supabase DB.

Пример (на VM):

- Скрипт: `/usr/local/bin/pontea-ensure-nocodb-supabase-network.sh`
- Юнит: `/etc/systemd/system/pontea-nocodb-network.service`
- Таймер: `/etc/systemd/system/pontea-nocodb-network.timer`

Проверка:

```bash
sudo systemctl status pontea-nocodb-network.timer --no-pager
sudo journalctl -u pontea-nocodb-network.service -n 50 --no-pager
```

---

## Текущая рабочая конфигурация app

- `build_pack`: `dockerfile`
- Dockerfile хранится inline в записи `applications.dockerfile` в БД Coolify.
- Подход Dockerfile: self-contained build с `git clone` репозитория внутри build stage.

Важно:
- Это рабочий обходной путь, потому что API update для existing app не принимает поле `dockerfile`.
- Если позже app пересоздавать или менять через UI/API, проверить, что Dockerfile не потерялся.

---

## Runbook на следующий цикл (если снова делать clean restart)

### 1) Полный stop перед reboot

```bash
# app
POST /api/v1/applications/{app_uuid}/stop
# services
POST /api/v1/services/{supabase_uuid}/stop
POST /api/v1/services/{nocodb_uuid}/stop
```

Проверка: в `docker ps` остаются только:
- `coolify`
- `coolify-db`
- `coolify-redis`
- `coolify-realtime`
- `coolify-proxy`
- `coolify-sentinel`

### 2) После запуска VM

```bash
lsblk -o NAME,SIZE,FSTYPE,MOUNTPOINT
df -h /
free -h
```

### 3) Перед новым deploy

```bash
ps -eo pid,ppid,args | grep -E "nix-env|docker build|buildx|/artifacts/build.sh"
docker builder prune -af
docker image prune -af
```

### 4) Поднятие сервисов

Порядок:
1. app deploy
2. supabase start
3. nocodb restart/start

### 5) Post-check NocoDB <-> Supabase DB network

Проверка, что NocoDB не ушел в restart-loop:

```bash
sudo docker ps --format '{{.Names}}\t{{.Status}}' | grep nocodb-v484wscoso8s8kswkscscc44
sudo docker logs --since 2m nocodb-v484wscoso8s8kswkscscc44 | tail -n 80
curl -I https://nocodb.pontea.school
```

Если в логах `ENOTFOUND` / `EAI_AGAIN` на `supabase-db-k4k0...`, выполнить:

```bash
# Подключить NocoDB к сети Supabase DB (рекомендуемый вариант)
sudo docker network connect k4k0k4o0oog8w8480okc4g48 nocodb-v484wscoso8s8kswkscscc44 || true

# (Опционально) если раньше применяли старый workaround, убрать лишнюю связь
sudo docker network disconnect v484wscoso8s8kswkscscc44 supabase-db-k4k0k4o0oog8w8480okc4g48 || true

sudo docker restart nocodb-v484wscoso8s8kswkscscc44
```

---

## Безопасность/гигиена

- API токены создавались вручную для automation; после стабилизации рекомендуется ротация.
- Старый `nginx/pm2` стек не включать обратно (иначе конфликт с Coolify proxy).
- Docker-команды выполнять через `sudo docker ...`, если пользователь не в docker group.
