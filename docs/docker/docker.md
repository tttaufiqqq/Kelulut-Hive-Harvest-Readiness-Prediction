# Running in containers

This article explains how to build and run BuzzyHive in Docker, and what the app needs from whatever runs it. It is the source of truth for those requirements. A deployment guide (for example, the Azure one) should link here, not copy this list.

## 1. What is here

| File | Purpose |
|---|---|
| `Dockerfile` | The Laravel image. One image runs the web app, the queue worker, the scheduler and migrations |
| `ml/Dockerfile` | The Flask KNN API, served by gunicorn |
| `docker-compose.yml` | A local stack: MySQL 8.0, flask-ml, a one-shot migrate step, web, worker and scheduler |
| `docker/` | `Caddyfile`, `php.ini` and `entrypoint.sh` used by the Laravel image |
| `.env.docker.example` | Settings for the local stack |
| `.dockerignore`, `ml/.dockerignore` | Keep secrets, `vendor/`, tests and docs out of the build |
| `ml/requirements-serve.txt` | Runtime dependencies for the ML image only |

The existing Exabytes deployment does not use any of these files and is not affected by them.

## 2. Run it locally

```bash
cp .env.docker.example .env.docker
docker compose run --rm --no-deps app php artisan key:generate --show   # put the key in .env.docker as APP_KEY
docker compose up --build                                               # http://localhost:8080
```

- The migrate step runs first, then web, worker and scheduler start.
- The first start has an empty database. Seed demo data with `docker compose exec app php artisan db:seed --force`.
- Reset everything with `docker compose down -v`.

Build the images alone:

```bash
docker build -t buzzyhive/laravel:local .
docker build -t buzzyhive/flask-ml:local ml
```

## 3. Roles of the Laravel image

The image is the same for every role. Only the command changes.

| Role | Command |
|---|---|
| Web (default) | `frankenphp run`, port 8080, `/up` is the health check |
| Queue worker | `php artisan queue:work --tries=3 --max-time=3600` |
| Scheduler | `php artisan schedule:work` (long-running) or `php artisan schedule:run` (once a minute from an external scheduler) |
| Migrations | `php artisan migrate --force` |

Pass the command as arguments, not as an entrypoint override. The entrypoint caches the config at start, and replacing it skips that.

## 4. Settings

### 4.1 Build time

These are compiled into the JavaScript by Vite (`resources/js/app.tsx`), so setting them at runtime does nothing. Pass them as build arguments.

| Build argument | Default | Notes |
|---|---|---|
| `VITE_PUSHER_APP_KEY` | empty | Public by design. Without it, live updates silently stop |
| `VITE_PUSHER_APP_CLUSTER` | `ap1` | |
| `VITE_PUSHER_HOST`, `VITE_PUSHER_PORT`, `VITE_PUSHER_SCHEME` | empty, `443`, `https` | Only for a self-hosted Pusher-compatible server |
| `VITE_APP_NAME` | `BuzzyHive 2.0` | |

The Pusher secret is never needed at build time and never enters the image.

### 4.2 Runtime

| Variable | Notes |
|---|---|
| `APP_KEY` | Required. The entrypoint only caches the config when it is set |
| `DB_*` | MySQL connection |
| `MYSQL_ATTR_SSL_CA` | Path to a CA bundle, needed when the database requires TLS (for example `/etc/ssl/certs/ca-certificates.crt`) |
| `ML_URL` | Base URL of the ML API, for example `http://flask-ml:5000`. The code reads `ML_URL` (`config/services.php`) |
| `IOT_API_KEY` | The key the ESP32 sends as `X-API-Key` |
| `PUSHER_APP_ID`, `PUSHER_APP_KEY`, `PUSHER_APP_SECRET`, `PUSHER_APP_CLUSTER` | Server-side broadcasting |
| `TELEGRAM_BOT_TOKEN` | Alerts |
| `TRUSTED_PROXIES` | See 5.3 |
| `LOG_CHANNEL` | The image defaults to `stderr` so container logs are collected |

## 5. What the app needs from its host

Each item below was found by building and running the images. Each one fails in a way that is hard to trace if it is missed.

### 5.1 The migrations create a MySQL trigger

The `HRI_Summary` migration creates a trigger. With binary logging on (the MySQL 8 default and the managed-service default), MySQL refuses that for a user without the SUPER privilege and the migration stops with:

```
SQLSTATE[HY000]: General error: 1419 You do not have the SUPER privilege and binary logging is enabled
```

Set the server parameter `log_bin_trust_function_creators` to `ON`. Compose starts MySQL with `--log-bin-trust-function-creators=1`. On a managed server, set it as a server parameter.

### 5.2 The Vite build needs PHP

The wayfinder plugin runs `php artisan wayfinder:generate` during `npm run build`, so the asset stage needs PHP and `vendor/` as well as Node. A Node-only build fails.

### 5.3 Behind a reverse proxy, set `TRUSTED_PROXIES`

A TLS-terminating proxy forwards plain HTTP. Without trusted proxies, Laravel builds `http://` URLs. For example, an unauthenticated request redirected to `http://localhost:8080/login`. Set `TRUSTED_PROXIES=*` (or a comma-separated list) behind the proxy.

`bootstrap/app.php` only reads the variable when it is set, so shared hosting is unchanged.

### 5.4 Uploads are on local disk

Hive images and the thesis PDF are written to `storage/app/public` (`Storage::disk('public')`). In a container that is the container's own disk:

- It is lost when the container restarts.
- It is not shared between replicas.

Run one web replica, or mount a shared volume at `/app/storage/app/public`, or move the `public` disk to object storage.

### 5.5 The model needs a matching scikit-learn

`ml/model.pkl` was written by scikit-learn 1.8.0 (`model_version` in `ml/model_metadata.json`). `ml/requirements-serve.txt` pins that version, and the ML image build unpickles the model and scaler, so a mismatch fails the build. When you retrain, pin the same version in the training environment, or change both together.

### 5.6 The ML image reads its metadata from files

`app.py` needs `runtime.py`, `model.pkl`, `scaler.pkl` and `model_metadata.json`. `dataset.csv` is only a fallback when the metadata file is missing. The `ml/.dockerignore` allow-list keeps everything else out, so a new file the API needs must be added there.

## 6. Notes on the images

- **Laravel:** FrankenPHP in classic mode on Alpine, run as `www-data`, with opcache on and timestamp validation off. Route, view and event caches are built into the image. The config cache is built at container start, so secrets injected at runtime end up in the cache and not in the image.
- **ML:** `python:3.12-slim`, gunicorn with one worker and four threads, run as a non-root user. The training libraries (pandas, matplotlib) are not in the image.
- **Base images** use floating tags and are not scanned for vulnerabilities. Pin by digest and scan before relying on them.
- **Debian instead of Alpine** for the Laravel image: pass `--build-arg PHP_IMAGE=dunglas/frankenphp:1-php8.3-bookworm --build-arg NODE_IMAGE=node:22-bookworm-slim`. The Node image must use the same C library as the PHP image.

Why these choices were made, with measured sizes and throughput, and how the images run on Azure Container Apps, is in the infrastructure repository (`buzzyhive-azure-infra`, `docs/docker.md`).
