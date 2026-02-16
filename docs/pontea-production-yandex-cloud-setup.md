# Pontea (Next.js) — Production сетап в Yandex Cloud (Compute VM + Nginx + PM2 + Let’s Encrypt)

**Дата актуализации:** 2026-02-16  
**Проект:** Pontea website MVP  
**Репозиторий (локально у владельца):** `/Users/mikhail/Documents/vibe-coding/Pontea-website-MVP`  
**Стек:** Next.js 15 (App Router), React 19, Tailwind, Supabase, OpenAI API  
**Прод окружение:** Yandex Cloud Compute VM (Ubuntu), Nginx reverse proxy, PM2 process manager, TLS (Let’s Encrypt/certbot)

---

## 1) Обзор архитектуры

Поток запросов:

1. Пользователь → `https://pontea.school` (канонический хост; `www` принудительно редиректится)
2. DNS A-record → **публичный статический IP** VM: `89.232.188.98`
3. Nginx на VM принимает 80/443:
   - `www` (80/443) → single-hop `301` на `https://pontea.school$request_uri`
   - `pontea.school` на 80 → `301` на `https://pontea.school$request_uri`
   - `pontea.school` на 443 → reverse proxy на `http://127.0.0.1:3000`
4. Next.js app работает на `127.0.0.1:3000`, управляется PM2 (`npm run start`)

---

## 2) Compute VM

- **VM name:** `compute-vm-2-2-20-ssd-1771009686767`
- **User:** `mikhail`
- **App directory:** `/var/www/pontea-app`
- **Публичный IP (статический):** `89.232.188.98`
- **Старый IP (динамический, больше не используется):** `158.160.75.46`

### Важный момент: статический IP
Изначально IP был динамический и менялся при stop/start. В итоге:
- VM остановили
- отвязали динамический IP
- привязали статический `89.232.188.98`
- запустили VM

Проверка на VM (истинный источник):
```bash
curl -s -H "Metadata-Flavor: Google" \
  "http://169.254.169.254/computeMetadata/v1/instance/network-interfaces/0/access-configs/0/external-ip" && echo
```

---

## 3) Сеть и Security Group

### 3.1 Security Group

* **SG:** `pontea-sg` (привязана к сетевому интерфейсу VM)

#### Ingress (входящий трафик)

* TCP **80** from `0.0.0.0/0` (HTTP, и нужен для Let’s Encrypt challenge/редиректа)
* TCP **443** from `0.0.0.0/0` (HTTPS)
* TCP **22** from **админский IP/32** (SSH)

  * В ходе настройки использовался IP админа: `217.117.227.226/32`
  * Важно: IP админа может меняться → при таймаутах SSH первым делом проверить текущий публичный IP и обновить правило

> Ошибка, которую исправили: было неверно поставлено правило SSH на `89.232.188.98/32` (IP самой VM). Так нельзя — SSH должен быть разрешён с IP администратора.

#### Egress (исходящий трафик) — критично

**Обязательно** разрешён исходящий трафик:

* Any protocol, any port → `0.0.0.0/0`

Без этого:

* `apt update` / установка certbot не работали
* внешние запросы (OpenAI/Supabase) могли бы не работать

### 3.2 Диагностика сети

Проверка, что исходящий интернет работает:

```bash
curl -4 -I --max-time 8 https://archive.ubuntu.com/ubuntu/ | head -n 1
```

---

## 4) DNS и домен

### 4.1 Домен

* **Primary:** `pontea.school`
* **Alias:** `www.pontea.school`

### 4.2 DNS записи

A-record’ы:

* `pontea.school` → `89.232.188.98`
* `www.pontea.school` → `89.232.188.98`

Проверка снаружи (например, с Mac):

```bash
dig +short pontea.school
dig +short www.pontea.school
```

---

## 5) Приложение (Next.js) и переменные окружения

### 5.1 Сборка/запуск

В проекте используются команды:

* Build: `npm run build`
* Start: `npm run start`

### 5.2 Важный нюанс про OPENAI_API_KEY

**Production build падал**, если нет `OPENAI_API_KEY`, потому что в коде была **инициализация OpenAI на уровне модуля**:

* `src/app/api/admin/questions/detect-difficulty/route.ts`

Следствие:

* `OPENAI_API_KEY` должен присутствовать в окружении **на этапе сборки** (build), иначе сборка может упасть.

### 5.3 Env файлы

На VM используется:

* `/var/www/pontea-app/.env.production`

Ключевые переменные (примерный список, значения не коммитятся):

* `APP_URL`
* `NEXT_PUBLIC_APP_URL`
* `NEXT_PUBLIC_CALENDLY_URL`
* `NEXT_PUBLIC_SUPABASE_URL`
* `NEXT_PUBLIC_SUPABASE_ANON_KEY`
* `SUPABASE_SERVICE_ROLE_KEY`
* `OPENAI_API_KEY`
* `ASSESSMENT_RESULTS_WEBHOOK_URL`
* `PRICING_EUR_INVOICE_WEBHOOK_URL`
* `PRICING_MENTORSHIP_APPLICATION_WEBHOOK_URL`
* `PRICING_PAYMENT_INTENT_WEBHOOK_URL`
* `NEXT_PUBLIC_SUPPORT_TELEGRAM_URL`
* `NEXT_PUBLIC_RUB_PAYMENT_URL_FOUNDATION`
* `NEXT_PUBLIC_RUB_PAYMENT_URL_ADVANCED`
* `NEXT_PUBLIC_RUB_PAYMENT_URL_FOUNDATION_INSTALLMENT` (optional)
* `NEXT_PUBLIC_RUB_PAYMENT_URL_ADVANCED_INSTALLMENT` (optional)
* `OPENAI_PARSE_MODEL`
* `OPENAI_PARSE_STREAM_MODEL`
* `OPENAI_DIFFICULTY_MODEL`
* `PRICING_WEBHOOK_MAX_ATTEMPTS`
* `WEBHOOK_TIMEOUT_MS`

**Важно:** `NEXT_PUBLIC_*` переменные в Next.js **вшиваются в клиент при `npm run build`**.
Поэтому просто поменять `.env.production` и сделать `pm2 restart` недостаточно — нужен `npm run build`.

В ходе настройки:

* `NEXT_PUBLIC_APP_URL` установлен в `https://pontea.school`
* затем выполнен `npm run build` и `pm2 restart pontea --update-env`

Проверка текущего публичного URL без утечки секретов:

```bash
grep '^NEXT_PUBLIC_APP_URL=' /var/www/pontea-app/.env.production
```

---

## 6) Process manager: PM2

### 6.1 Установка и запуск

PM2 установлен (через npm под nvm).

Процесс:

* **Name:** `pontea`
* Запускается командой:

```bash
pm2 start npm --name pontea -- start
pm2 save
```

Проверка:

```bash
pm2 status
pm2 logs pontea --lines 100 --nostream
```

Если в non-interactive shell команда `pm2` не находится, сначала загрузить nvm:

```bash
source ~/.nvm/nvm.sh
pm2 status
```

### 6.2 Автозапуск PM2 (systemd)

Настроен сервис:

* `pm2-mikhail.service` (активен и running)

В процессе настройки встречалась ошибка `protocol` при `pm2 startup` из-за конфликта с уже запущенным PM2 daemon.
Фикс, который применялся:

* `pm2 kill`
* `systemctl reset-failed` / запуск сервиса

Проверка:

```bash
sudo systemctl status pm2-mikhail --no-pager -l
```

---

## 7) Reverse proxy: Nginx

### 7.1 Конфиги

Активный сайт:

* `/etc/nginx/sites-available/pontea` (канонический редирект `www` → non-www настроен)
* `/etc/nginx/sites-enabled/pontea` → symlink на sites-available

С 2026-02-15 используется явное разделение primary/secondary host без `if ($host)`:

* `pontea.school` = canonical host
* `www.pontea.school` = secondary host, всегда `301` на canonical

Полный рабочий конфиг:

```nginx
server {
    listen 80;
    listen [::]:80;
    server_name www.pontea.school;

    return 301 https://pontea.school$request_uri;
}

server {
    listen 80;
    listen [::]:80;
    server_name pontea.school;

    return 301 https://pontea.school$request_uri;
}

server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name www.pontea.school;

    ssl_certificate /etc/letsencrypt/live/pontea.school/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/pontea.school/privkey.pem;
    include /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;

    return 301 https://pontea.school$request_uri;
}

server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name pontea.school;

    ssl_certificate /etc/letsencrypt/live/pontea.school/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/pontea.school/privkey.pem;
    include /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;

        proxy_set_header Host $host;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";

        proxy_read_timeout 60s;
        proxy_connect_timeout 5s;
    }
}
```

Применение изменений и rollback:

```bash
# backup
sudo cp /etc/nginx/sites-available/pontea /etc/nginx/sites-available/pontea.bak.$(date +%F-%H%M%S)

# edit /etc/nginx/sites-available/pontea

# validate + reload
sudo nginx -t
sudo systemctl reload nginx

# rollback (если нужно)
sudo cp /etc/nginx/sites-available/pontea.bak.<timestamp> /etc/nginx/sites-available/pontea
sudo nginx -t
sudo systemctl reload nginx
```

Проверка конфигов:

```bash
sudo nginx -t
sudo systemctl reload nginx
```

### 7.2 Прокси на приложение

Nginx проксирует на:

* `http://127.0.0.1:3000`

Проверка локально на VM:

```bash
curl -I http://127.0.0.1:3000
curl -I http://127.0.0.1
```

Примечание:

* запросы с VM на свой публичный домен могут не работать из-за hairpin NAT (не считать это поломкой; проверять снаружи).

---

## 8) TLS / SSL (Let’s Encrypt)

### 8.1 Certbot

Установлен:

* `certbot`
* `python3-certbot-nginx`

Сертификат выпущен для:

* `pontea.school`
* `www.pontea.school`

Расположение:

* `/etc/letsencrypt/live/pontea.school/fullchain.pem`
* `/etc/letsencrypt/live/pontea.school/privkey.pem`

Expire:

* `2026-05-14`

Certbot автоматом:

* внедрил SSL в nginx конфиг
* включил HTTPS
* настроил scheduled task на renew

Проверка renew:

```bash
sudo certbot renew --dry-run
```

Проверка редиректов:

```bash
curl -I http://pontea.school
curl -I http://www.pontea.school
curl -I https://www.pontea.school
curl -I https://pontea.school
```

Ожидаемо:

* `http://www.pontea.school/*` → `301` на `https://pontea.school/*` (single-hop)
* `https://www.pontea.school/*` → `301` на `https://pontea.school/*` (single-hop)
* `http://pontea.school/*` → `301` на `https://pontea.school/*`
* `https://pontea.school/*` → `200`/`30x` только по логике приложения

---

## 9) Supabase (Auth)

После перехода на домен и HTTPS необходимо обновить Supabase Auth настройки:

**Auth → URL Configuration**

* **Site URL:** `https://pontea.school`
* **Redirect URLs** (минимум):

  * `https://pontea.school/auth/callback`
  * `https://www.pontea.school/auth/callback` (опционально на переходный период, чтобы старые ссылки не ломались)

Если это не обновить:

* OAuth/magic link редиректы будут уходить на старый URL/IP/HTTP.

---

## 10) Секреты и безопасность

### 10.1 Ротация OPENAI_API_KEY — обязательно

Ключ был “светился” в чате → считать скомпрометированным.

Процедура:

1. В OpenAI удалить/отозвать старый ключ
2. Создать новый
3. Обновить `/var/www/pontea-app/.env.production`
4. Пересобрать и перезапустить:

```bash
cd /var/www/pontea-app
npm run build
pm2 restart pontea --update-env
```

### 10.2 Права на env файл

Рекомендуется:

```bash
chmod 600 /var/www/pontea-app/.env.production
chown mikhail:mikhail /var/www/pontea-app/.env.production
```

### 10.3 SSH hardening

* В SG: SSH только с IP администратора `/32`
* Рекомендовано на VM:

  * `PasswordAuthentication no`
  * `PermitRootLogin no`
  * ключевой доступ

---

## 11) Runbook: обновление приложения (deploy)

### 11.1 Стандартный деплой из git

```bash
cd /var/www/pontea-app
source ~/.nvm/nvm.sh

git fetch origin
git merge --ff-only origin/main

npm ci --no-audit --no-fund
npm run build

pm2 restart pontea --update-env
```

### 11.2 Если менялись только server-side секреты (не NEXT_PUBLIC_*)

Если уверены, что изменения не влияют на клиент (нет `NEXT_PUBLIC_*`), можно:

* обновить `.env.production`
* `pm2 restart pontea --update-env`

Но безопаснее по умолчанию делать build, чтобы исключить неожиданности.

---

## 12) Быстрая диагностика

### 12.1 Сервисы

```bash
source ~/.nvm/nvm.sh
pm2 status
pm2 logs pontea --lines 100 --nostream

sudo systemctl status nginx --no-pager -l
sudo systemctl status pm2-mikhail --no-pager -l
```

### 12.2 Порты

```bash
sudo ss -lntp | grep -E ':80|:443|:3000'
```

Ожидаемо:

* nginx слушает `0.0.0.0:80` и `0.0.0.0:443`
* node/next слушает `127.0.0.1:3000`

### 12.3 Локальные проверки на VM

```bash
curl -I http://127.0.0.1:3000
curl -I http://127.0.0.1
```

### 12.4 Внешние проверки

С любой внешней машины:

```bash
curl -I http://pontea.school
curl -I https://pontea.school
curl -I http://www.pontea.school/ru/legal?x=1
curl -I https://www.pontea.school/ru/legal?x=1
curl -s -o /dev/null -w 'final=%{url_effective} code=%{http_code} redirects=%{num_redirects}\n' -L "http://www.pontea.school/ru/legal?x=1"
curl -s -L https://www.pontea.school/ru/legal | rg 'rel="canonical"'
curl -I https://www.pontea.school/sitemap.xml
curl -s https://pontea.school/sitemap.xml | rg '<loc>https://pontea.school/'
```

Ожидаемо:

* `www` всегда отдает `301` на non-www с сохранением path + query string
* для `http://www.../ru/legal?x=1` количество редиректов после `-L` = `1`
* canonical и sitemap содержат только `https://pontea.school/...`
* `/` без cookie отдает `200` (EN homepage)
* `/` с cookie `pontea_lang=ru` отдает `307` на `/ru/` c `Cache-Control: private, no-store` и `Vary: Cookie`
* `Accept-Language` сам по себе не должен принудительно редиректить на `/ru/`

### 12.5 Проверка egress (важно для apt/OpenAI/Supabase)

```bash
curl -4 -I --max-time 8 https://archive.ubuntu.com/ubuntu/ | head -n 1
```

---

## 13) Частые проблемы и что делать

### 13.1 SSH “Operation timed out”

Причины:

* В SG SSH ограничен на старый IP администратора (у провайдера IP изменился)
  Решение:
* узнать текущий IP: `curl -4 ifconfig.me`
* обновить SG правило 22 на новый IP/32

### 13.2 `npm run build` падает

Частая причина:

* отсутствует `OPENAI_API_KEY` (инициализация OpenAI на уровне модуля)
  Решение:
* убедиться, что ключ присутствует в `.env.production` перед сборкой

### 13.3 Certbot/apt не устанавливается

Причина:

* отсутствует исходящий интернет (не настроен egress в SG)
  Решение:
* добавить egress allow-all: Any → `0.0.0.0/0`

### 13.4 Домен работает снаружи, но не работает “с VM на себя”

Причина:

* hairpin NAT / NAT loopback
  Решение:
* проверять домен с внешней машины, а на VM проверять через `127.0.0.1`

---

## 14) Текущие “истины” окружения (на 2026-02-16)

* **IP:** `89.232.188.98` (статический)
* **Домены:** `pontea.school`, `www.pontea.school`
* **Canonical host policy:** `www` → `301` на `https://pontea.school$request_uri` (single-hop)
* **HTTPS:** включён, сертификат действителен, renew dry-run проходит
* **Приложение:** PM2 `pontea` online
* **Proxy:** Nginx → `127.0.0.1:3000`
* **APP_URL / NEXT_PUBLIC_APP_URL:** `https://pontea.school`
* **Deploy commit (main):** `a28f357` (`fix: restore main build after merge for RU locale routes`)
* **Locale behavior on root:** EN по умолчанию на `/`, RU-редирект только по явному выбору (cookie/query override), без IP/Accept-Language форс-редиректа

---

## 15) TODO (если ещё не сделано)

* [x] Nginx canonical host: `www` → `https://pontea.school$request_uri` (single-hop)
* [ ] Supabase Auth: Site URL + Redirect URLs обновлены на `https://pontea.school`
* [ ] Ротация `OPENAI_API_KEY` выполнена (старый ключ отозван)
* [ ] Убедиться, что нет временного SSH правила `0.0.0.0/0` (если когда-либо добавлялось)
