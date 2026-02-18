# Pontea Production VM (Yandex Cloud) - Single Source Of Truth

**Last updated:** 2026-02-18  
**Environment:** production  
**VM public static IP:** `89.232.188.98`  
**Old dynamic IP (do not use):** `158.160.75.46`  
**VM name:** `compute-vm-2-2-20-ssd-1771009686767`  
**OS:** Ubuntu 24.04 LTS  
**Sizing (current):** `8 vCPU / 16 GiB RAM / 100 GB SSD`  

This document is the primary runbook for the Pontea production VM. It consolidates the legacy Nginx/PM2 setup notes and the current Coolify + Supabase + NocoDB state.

## 0) TL;DR (Current State)

- The production stack is **Docker-based and managed by Coolify**.
- `coolify-proxy` publishes **80/443** on the VM and routes traffic to:
  - `pontea.school` (Next.js app container)
  - `supabase.pontea.school` (Supabase via Kong)
  - `supabase-studio.pontea.school` (Supabase Studio)
  - `nocodb.pontea.school` (NocoDB)
- **Legacy Nginx + PM2 stack is not used**:
  - `nginx` systemd service is `inactive`
  - PM2 daemon may be running, but the `pontea` process is `stopped`
  - Do not re-enable legacy stack: it can conflict with Coolify proxy on ports 80/443.

Quick VM health (run on VM):

```bash
lsblk -o NAME,SIZE,FSTYPE,MOUNTPOINT
df -h /
free -h
sudo docker ps --format '{{.Names}}\t{{.Status}}' | sort
```

## 1) Domains, DNS, TLS

### 1.1 DNS records (expected)

All records point to the VM static IP `89.232.188.98`:

- `pontea.school`
- `www.pontea.school`
- `supabase.pontea.school`
- `supabase-studio.pontea.school`
- `nocodb.pontea.school`

Quick check (from any machine):

```bash
dig +short pontea.school
dig +short www.pontea.school
dig +short supabase.pontea.school
dig +short supabase-studio.pontea.school
dig +short nocodb.pontea.school
```

### 1.2 TLS termination

TLS is handled by **Coolify proxy** (Let's Encrypt). The legacy `certbot + nginx` setup from older notes is no longer the active path.

### 1.3 Expected HTTP responses (sanity checks)

```bash
curl -I https://pontea.school
curl -I https://www.pontea.school
curl -I https://supabase.pontea.school
curl -I https://supabase-studio.pontea.school
curl -I https://nocodb.pontea.school
```

Expected (high-level):

- `pontea.school` -> `200`
- `www.pontea.school` -> redirect to non-www (status may be `307` depending on proxy config)
- `supabase.pontea.school` -> `401` (expected for Kong without auth)
- `supabase-studio.pontea.school` -> `307` (expected)
- `nocodb.pontea.school` -> `302` to `/dashboard` (expected)

### 1.4 Canonical host redirects (www -> non-www)

Canonical host: `pontea.school`.

Check redirect hops:

```bash
curl -s -o /dev/null -w 'final=%{url_effective} code=%{http_code} redirects=%{num_redirects}\n' -L http://www.pontea.school/
curl -s -o /dev/null -w 'final=%{url_effective} code=%{http_code} redirects=%{num_redirects}\n' -L https://www.pontea.school/
```

If you need strict `301` + single-hop behavior, do it at the proxy layer (Coolify proxy) or in the app routing. Avoid re-enabling legacy Nginx just for redirects.

## 2) Yandex Cloud Networking (Security Group)

Security Group should enforce:

- SG name (expected): `pontea-sg`
- Ingress:
  - TCP `80` from `0.0.0.0/0`
  - TCP `443` from `0.0.0.0/0`
  - TCP `22` from **admin public IP/32**
- Egress:
  - Allow all (required for `apt`, Let's Encrypt, OpenAI/Supabase outbound, etc.)

If SSH times out, the most common reason is that the **admin IP changed** and SG no longer allows port 22 from your current IP.

Historical note: during setup, the admin IP was `217.117.227.226/32`. Do not assume it is still correct.

## 2.1 Open ports on the VM (and what is actually reachable)

On the host you will see ports bound by Docker (example):

```bash
sudo ss -lntp | grep -E ':80|:443|:8000|:8080'
```

Notes:

- Only `80/443` should be internet-reachable (plus `22` from admin IP).
- `8000` is typically Coolify UI (blocked by SG; access via SSH tunnel).
- `8080` is used by Coolify proxy internals (should also be blocked by SG).

## 3) SSH Access

### 3.1 Canonical host

`mikhail@89.232.188.98`

### 3.2 VM self-check: external IP (metadata)

Run on the VM to confirm external IP (source of truth):

```bash
curl -s -H "Metadata-Flavor: Google" \
  "http://169.254.169.254/computeMetadata/v1/instance/network-interfaces/0/access-configs/0/external-ip" && echo
```

### 3.3 Hairpin NAT note

Requests from the VM to its own public domain can fail due to hairpin NAT. Prefer:

- From VM: check local containers and `127.0.0.1` endpoints where applicable
- From outside: check `https://*.pontea.school`

## 4) What Runs On This VM (Docker + Coolify)

### 4.0 Versions (useful when debugging)

```bash
sudo docker version
sudo docker compose version
```

As of 2026-02-18, Coolify label version observed on managed containers: `4.0.0-beta.463`.

### 4.1 Key Docker networks

- `coolify` (Coolify internal)
- `k4k0k4o0oog8w8480okc4g48` (Supabase service network)
- `v484wscoso8s8kswkscscc44` (NocoDB service network)

List networks:

```bash
sudo docker network ls
```

### 4.2 Key running containers (example)

```bash
sudo docker ps --format '{{.Names}}\t{{.Status}}' | sort
```

You should see:

- `coolify`, `coolify-proxy`, `coolify-db`, `coolify-redis`, `coolify-realtime`, `coolify-sentinel`
- Supabase containers `*-k4k0k4o0oog8w8480okc4g48` (including `supabase-db-k4k0...`)
- `nocodb-v484wscoso8s8kswkscscc44`
- App container `yg0k00gswcg40g8ssgssoo0c-*`

### 4.3 Coolify UI access (not public)

Security Group usually exposes only 80/443/22, so Coolify UI port is not reachable from the internet.

Use SSH tunnel:

```bash
ssh -L 8000:127.0.0.1:8000 mikhail@89.232.188.98
```

Then open:

- `http://127.0.0.1:8000`

## 5) File Locations On VM (Most Useful Paths)

### 5.1 Coolify-generated service files

Coolify writes service compose/env files under:

- `/data/coolify/services/<service_uuid>/docker-compose.yml`
- `/data/coolify/services/<service_uuid>/.env`
- `/data/coolify/applications/<app_uuid>/.env`

For this VM:

- Supabase service UUID: `k4k0k4o0oog8w8480okc4g48`
- NocoDB service UUID: `v484wscoso8s8kswkscscc44`
- App UUID: `yg0k00gswcg40g8ssgssoo0c`

Important:

- These files can be regenerated when changing the service in Coolify UI.
- If you edit them manually, verify after any redeploy/recreate.
- `/data/coolify/*` is root-owned on this VM, so use `sudo` for reads/writes and compose operations.

Secret hygiene:

- Treat any `/data/coolify/**/.env` as sensitive (contains secrets).
- Do not copy secret values into git/docs/chats.

### 5.2 Data volumes

```bash
sudo docker volume ls
```

Notable volumes:

- `k4k0k4o0oog8w8480okc4g48_supabase-db-data` (Supabase Postgres data)
- `v484wscoso8s8kswkscscc44_nocodb-data` (NocoDB internal data)
- `postgres-data-lwk8ok8wo8ko0ogwwwwocck8` (legacy standalone Postgres volume from old NocoDB setup)

### 5.3 Coolify internal state (FYI)

These directories exist on the VM and are useful for low-level debugging:

- `/data/coolify/proxy` (proxy state/config)
- `/data/coolify/ssl` (TLS assets used by proxy)
- `/data/coolify/backups` (Coolify backups)

Before editing anything under `/data/coolify/*`, take a quick copy with a timestamp:

```bash
ts="$(date -u +%Y%m%d-%H%M%S)"
sudo cp -a /data/coolify/services/<uuid>/docker-compose.yml "/data/coolify/services/<uuid>/docker-compose.yml.bak.$ts"
sudo cp -a /data/coolify/services/<uuid>/.env "/data/coolify/services/<uuid>/.env.bak.$ts"
```

## 5.4 Secrets, rotation, and redaction rules

- **Do not** paste secret values into git/docs/chats.
- Assume any leaked API key is compromised and rotate immediately.
- If Coolify API tokens were created for automation, plan for periodic rotation.

OpenAI key rotation (high-level):

1. Revoke the old key in OpenAI.
2. Update `OPENAI_API_KEY` in Coolify app env:
   - `/data/coolify/applications/yg0k00gswcg40g8ssgssoo0c/.env` (or via Coolify UI)
3. Trigger a rebuild/redeploy in Coolify.

NocoDB DB password rotation (high-level):

1. Change the `nocodb` role password in Supabase Postgres.
2. Update `NC_DB` in:
   - `/data/coolify/services/v484wscoso8s8kswkscscc44/.env`
3. Recreate/restart NocoDB.

## 6) Next.js App (Pontea)

### 6.1 How it runs

The app is deployed as a **Coolify-managed Docker container** (not PM2).

Legacy path from older setup (`/var/www/pontea-app`, PM2, Nginx) is considered historical and should not be used unless explicitly rolling back.

The app environment file on the VM:

- `/data/coolify/applications/yg0k00gswcg40g8ssgssoo0c/.env`

### 6.2 Build-time env pitfalls

Production build can fail if `OPENAI_API_KEY` is missing because OpenAI client initialization previously existed at module scope:

- `src/app/api/admin/questions/detect-difficulty/route.ts`

Rule of thumb:

- Ensure required env vars are present **before** triggering a build/redeploy in Coolify.
- `NEXT_PUBLIC_*` vars are baked into the client bundle at build time.

### 6.3 Redeploy

Preferred: redeploy via Coolify UI.

If you must do docker-level debugging:

```bash
sudo docker ps --format '{{.Names}}\t{{.Status}}' | grep yg0k00gswcg40g8ssgssoo0c
sudo docker logs --since 10m <app_container_name> | tail -n 200
```

### 6.4 App env variables (names only)

Commonly used keys (inventory, not values):

- `APP_URL`, `NEXT_PUBLIC_APP_URL`
- `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`
- `OPENAI_API_KEY`, `OPENAI_PARSE_MODEL`, `OPENAI_PARSE_STREAM_MODEL`, `OPENAI_DIFFICULTY_MODEL`
- `NEXT_PUBLIC_CALENDLY_URL`, `NEXT_PUBLIC_SUPPORT_TELEGRAM_URL`
- Payment URLs: `NEXT_PUBLIC_RUB_PAYMENT_URL_*`
- Webhooks: `ASSESSMENT_RESULTS_WEBHOOK_URL`, `PRICING_*_WEBHOOK_URL`, `PRICING_WEBHOOK_MAX_ATTEMPTS`, `WEBHOOK_TIMEOUT_MS`

### 6.5 Functional smoke tests (SEO/locale)

Run from any external machine:

```bash
curl -I https://pontea.school/sitemap.xml
curl -s https://pontea.school/sitemap.xml | grep -n \"<loc>https://pontea.school/\" | head
```

Locale smoke (expected behavior may depend on current product logic):

```bash
# No cookie: homepage should be EN (200)
curl -I https://pontea.school/

# RU cookie: should redirect to /ru/ (commonly 307)
curl -I -H 'Cookie: pontea_lang=ru' https://pontea.school/
```

### 6.6 Coolify build configuration

The app is deployed in Coolify with `build_pack=dockerfile`.

Important:

- Dockerfile can be stored as part of Coolify application config (not necessarily in git as a file).
- If you recreate the application in Coolify, verify the Dockerfile/build settings are preserved.

## 7) Supabase (Self-hosted via Coolify)

### 7.1 Service UUID and containers

- Service UUID: `k4k0k4o0oog8w8480okc4g48`
- DB container: `supabase-db-k4k0k4o0oog8w8480okc4g48` (alias inside its network: `supabase-db`)

Supabase compose/env on the VM:

- `/data/coolify/services/k4k0k4o0oog8w8480okc4g48/docker-compose.yml`
- `/data/coolify/services/k4k0k4o0oog8w8480okc4g48/.env`

### 7.2 Endpoint behavior

- `https://supabase.pontea.school` is fronted by Kong and commonly returns `401` for unauthenticated requests (expected).

### 7.3 Supabase Auth URLs

After domain/HTTPS changes, Supabase Auth settings must match:

- Site URL: `https://pontea.school`
- Redirect URLs should include at least: `https://pontea.school/auth/callback`

If not updated, OAuth/magic link flows can break (redirecting to old origins).

### 7.4 Schema references in this repo

- Snapshot: `docs/db-schema-snapshot-20260125.md`
- Root-level `supabase-*.sql` files: schema/migration snapshots

## 8) NocoDB (Connected to Supabase Postgres)

### 8.1 Service UUID and data

- Service UUID: `v484wscoso8s8kswkscscc44`
- Container name: `nocodb-v484wscoso8s8kswkscscc44`
- Volume: `v484wscoso8s8kswkscscc44_nocodb-data`

### 8.2 Database connection (NC_DB)

NocoDB uses Supabase Postgres with:

- Host: `supabase-db` (Docker network alias)
- Port: `5432`
- DB: `nocodb`
- User: `nocodb`

Expected format (do not commit secrets):

```text
NC_DB=pg://supabase-db:5432?u=nocodb&p=<secret>&d=nocodb
```

NocoDB env file on the VM:

- `/data/coolify/services/v484wscoso8s8kswkscscc44/.env`

Typical keys (names only):

- `NC_INVITE_ONLY_SIGNUP`
- `NC_PUBLIC_URL`
- `NC_DB`

### 8.3 The recurring failure mode (and the permanent fix)

Symptom:

- `https://nocodb.pontea.school` -> `503`
- `nocodb-v484...` is `Restarting (1)`
- Logs show `getaddrinfo ENOTFOUND` or `EAI_AGAIN` for `supabase-db-*`

Root cause:

- Docker DNS only resolves container hostnames inside the same network.
- If NocoDB is not connected to the Supabase network, it cannot resolve `supabase-db` (or `supabase-db-k4k0...`).

Permanent fix (implemented):

- Ensure NocoDB is attached to **both** networks:
  - NocoDB ingress network `v484wscoso8s8kswkscscc44` (for proxy routing)
  - Supabase network `k4k0k4o0oog8w8480okc4g48` (for DB connectivity)
- Ensure `NC_DB` uses `supabase-db` alias, not the long container name.

Source-of-truth config on VM:

- `/data/coolify/services/v484wscoso8s8kswkscscc44/docker-compose.yml`
- `/data/coolify/services/v484wscoso8s8kswkscscc44/.env`

Verification commands:

```bash
sudo docker inspect -f '{{json .NetworkSettings.Networks}}' nocodb-v484wscoso8s8kswkscscc44
sudo docker exec nocodb-v484wscoso8s8kswkscscc44 sh -lc 'getent hosts supabase-db | head -n 5'
sudo docker logs --since 10m nocodb-v484wscoso8s8kswkscscc44 | tail -n 200
```

Emergency manual fix (if Coolify regenerated config and broke networks):

```bash
sudo docker network connect k4k0k4o0oog8w8480okc4g48 nocodb-v484wscoso8s8kswkscscc44 || true
sudo docker restart nocodb-v484wscoso8s8kswkscscc44
```

If you need to apply an edited compose file (NocoDB example):

```bash
sudo bash -lc 'cd /data/coolify/services/v484wscoso8s8kswkscscc44 && docker compose -p v484wscoso8s8kswkscscc44 up -d --force-recreate'
```

## 8.4 DB connectivity test (without psql)

The `nocodb/nocodb` image does not include `nc` by default. A reliable minimal TCP test:

```bash
sudo docker exec nocodb-v484wscoso8s8kswkscscc44 sh -lc 'node -e \"const net=require(\\\"net\\\");const s=net.connect(5432,\\\"supabase-db\\\",()=>{console.log(\\\"tcp_ok\\\");s.end();});s.on(\\\"error\\\",(e)=>{console.log(\\\"tcp_fail\\\");console.error(String(e));process.exit(1);});\"'
```

## 9) Maintenance Runbooks

### 9.1 Safe reboot / clean restart

High-level order:

1. Stop application and services via Coolify (preferred) or docker compose in `/data/coolify/services/*`
2. Reboot VM
3. Start services back up:
   - app
   - supabase
   - nocodb
4. Post-check endpoints and NocoDB DB connectivity

Docker-level stop/start (fallback if you cannot use Coolify UI):

```bash
# stop NocoDB
sudo bash -lc 'cd /data/coolify/services/v484wscoso8s8kswkscscc44 && docker compose -p v484wscoso8s8kswkscscc44 stop'

# stop Supabase
sudo bash -lc 'cd /data/coolify/services/k4k0k4o0oog8w8480okc4g48 && docker compose -p k4k0k4o0oog8w8480okc4g48 stop'

# stop app (container name changes per deploy, so use prefix search)
sudo docker ps --format '{{.Names}}' | grep '^yg0k00gswcg40g8ssgssoo0c-' | xargs -r sudo docker stop
```

After stopping app/services, a healthy baseline is that `docker ps` shows only Coolify core:

- `coolify`
- `coolify-db`
- `coolify-redis`
- `coolify-realtime`
- `coolify-proxy`
- `coolify-sentinel`

```bash
# start app is normally done via Coolify; docker start works but won't rebuild/redeploy
sudo docker ps -a --format '{{.Names}}' | grep '^yg0k00gswcg40g8ssgssoo0c-' | xargs -r sudo docker start

# start Supabase
sudo bash -lc 'cd /data/coolify/services/k4k0k4o0oog8w8480okc4g48 && docker compose -p k4k0k4o0oog8w8480okc4g48 up -d'

# start NocoDB
sudo bash -lc 'cd /data/coolify/services/v484wscoso8s8kswkscscc44 && docker compose -p v484wscoso8s8kswkscscc44 up -d'
```

### 9.2 Disk and Docker cleanup

Quick disk sanity:

```bash
df -h /
sudo docker system df
```

If space pressure happens, prefer pruning build cache and unused images. Avoid deleting volumes unless you are 100% sure.

If you suspect stuck build processes (Coolify deploy hanging), check:

```bash
ps -eo pid,ppid,args | grep -E "nix-env|docker build|buildx|/artifacts/build.sh"
```

Prune (dangerous if you don't understand impact; do not delete volumes):

```bash
sudo docker builder prune -af
sudo docker image prune -af
```

### 9.3 Basic network egress test (VM)

```bash
curl -4 -I --max-time 8 https://archive.ubuntu.com/ubuntu/ | head -n 1
```

## 10) Legacy Notes (Historical Only)

These were used in the earlier production setup and can still exist on the VM, but are not part of the active stack:

- Nginx reverse proxy configs under `/etc/nginx/*` (service should remain `inactive`)
- Certbot/Let's Encrypt under `/etc/letsencrypt/*` (Coolify proxy now handles TLS)
- PM2 + `/var/www/pontea-app` (PM2 service may exist; `pontea` process is currently `stopped`)

If you intentionally roll back to legacy mode, you must:

- Stop Coolify proxy exposure on 80/443 or you will conflict
- Re-validate Nginx configs and certificate renewals
- Re-validate app env vars (`NEXT_PUBLIC_*` build-time behavior)

## 11) Troubleshooting Checklist

### 11.1 "Site is down" quick checks

From your laptop:

```bash
curl -I https://pontea.school
curl -I https://supabase.pontea.school
curl -I https://nocodb.pontea.school
```

On the VM:

```bash
sudo docker ps --format '{{.Names}}\t{{.Status}}' | sort
sudo docker logs --since 10m coolify-proxy | tail -n 200
sudo docker logs --since 10m nocodb-v484wscoso8s8kswkscscc44 | tail -n 200
```

### 11.2 SSH timeouts

- Confirm your public IP: `curl -4 ifconfig.me`
- Update SG ingress rule for port 22 to your current IP/32

## 12) Appendix: Useful Identifiers

- App UUID: `yg0k00gswcg40g8ssgssoo0c`
- Supabase service UUID: `k4k0k4o0oog8w8480okc4g48`
- NocoDB service UUID: `v484wscoso8s8kswkscscc44`
- Legacy standalone NocoDB DB UUID (historical): `lwk8ok8wo8ko0ogwwwwocck8`
