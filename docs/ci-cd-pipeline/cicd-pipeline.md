# BuzzyHive CI/CD Pipelines

Reference document for the GitHub Actions deployment pipelines to Exabytes shared hosting.

There are now two deployment workflows:

- `deploy.yml` — Laravel + React app for `https://buzzyhive.urban-alert.com`
- `deploy-ml.yml` — Flask ML app for `https://ml.buzzyhive.urban-alert.com`

The apps are deployed separately because they live in different server roots and use different runtimes:

- Laravel root: `/home/urbanale/public_html/buzzyhive`
- Laravel document root: `/home/urbanale/public_html/buzzyhive/public`
- ML app root: `/home/urbanale/public_html/buzzyhive-ml`

---

## Laravel Pipeline Diagram

```
git push main
(only triggers when app files change — see path filter)
         │
         ▼
┌─────────────────────────────────────┐
│          CONCURRENCY GUARD          │
│  cancel-in-progress: true           │
│  If a run is already in progress,   │
│  cancel it and start fresh.         │
└──────────────┬──────────────────────┘
               │
    ┌──────────▼──────────┐
    │      TESTS JOB      │  ← runs twice in parallel (PHP 8.3 + 8.4)
    │─────────────────────│
    │  checkout@v5         │
    │  setup PHP           │
    │  cache@v5 (composer) │  ← keyed on composer.lock hash
    │  composer install    │  ← skipped if cache hit
    │  cp .env.example     │  ← CI-only ephemeral env
    │  php artisan key:gen │
    │  touch database.sqlite│
    │  php artisan migrate │
    │  ./vendor/bin/pest   │  ← Vite::fake() — no npm needed
    └──────────┬──────────┘
               │ both PHP versions must pass
    ┌──────────▼──────────┐
    │      BUILD JOB      │  ← runs once after tests pass
    │─────────────────────│
    │  checkout@v5         │
    │  setup PHP 8.3       │
    │  cache@v5 (composer) │  ← same key as deploy, --no-dev
    │  composer install    │
    │  setup-node@v5       │  ← installs Node 22
    │  cache@v5 (npm)      │  ← keyed on package-lock.json hash
    │  npm ci              │
    │  inject VITE_APP_NAME│  ← frontend title / branding from GH variable
    │  inject VITE_PUSHER_*│  ← prod frontend websocket config from GH secrets
    │  npm run build       │  ← compiles React/TS → public/build/
    │  upload-artifact@v6  │  ← public/build/ stored in GH for 1 day
    └──────────┬──────────┘
               │
    ┌──────────▼──────────┐
    │     DEPLOY JOB      │
    │─────────────────────│
    │  checkout@v5         │
    │  download-artifact@v6│  ← public/build/ from build job
    │  FTP upload          │  ← changed files only (sync state)
    │  curl deploy-hook    │  ← POST /deploy-hook.php
    └──────────┬──────────┘
               │
    ┌──────────▼──────────────────────────────┐
    │         DEPLOY HOOK (on server)         │
    │  runs via HTTP — no SSH on shared host  │
    │─────────────────────────────────────────│
    │  check composer.lock hash               │
    │    → changed: composer install --no-dev │
    │    → same:    skip (saves ~45s)         │
    │  php artisan migrate --force            │
    │  php artisan db:seed MasterDataSeeder   │
    │  php artisan config:cache               │
    │  php artisan route:cache                │
    │  php artisan view:cache                 │
    └─────────────────────────────────────────┘
```

---

## ML Pipeline Diagram

```
git push main
(only triggers when ml/** changes — see path filter)
         │
         ▼
┌─────────────────────────────────────┐
│          CONCURRENCY GUARD          │
│  cancel-in-progress: true           │
│  If a run is already in progress,   │
│  cancel it and start fresh.         │
└──────────────┬──────────────────────┘
               │
    ┌──────────▼──────────┐
    │     TEST-ML JOB     │
    │─────────────────────│
    │  checkout            │
    │  setup Python 3.11   │
    │  pip cache           │
    │  pip install         │
    │  Flask smoke test    │
    │  /health + /predict  │
    └──────────┬──────────┘
               │
    ┌──────────▼──────────┐
    │    DEPLOY-ML JOB    │
    │─────────────────────│
    │  checkout            │
    │  optional warning    │  ← requirements.txt changed?
    │  FTP upload ml/      │  ← runtime files only
    │  upload restart.txt  │  ← Passenger restart marker
    │  GET /health         │  ← live health verification
    └─────────────────────┘
```

---

## Laravel Trigger — Why Path Filtering

```yaml
paths:
  - 'app/**'
  - 'config/**'
  - 'database/**'
  - 'resources/**'
  - 'routes/**'
  - 'public/**'
  - 'bootstrap/**'
  - 'composer.json'
  - 'composer.lock'
  - 'package.json'
  - 'package-lock.json'
  - 'vite.config.*'
  - '.github/workflows/deploy.yml'
```

**Why:** Pushing diary entries, documentation, or memory files should not trigger a full deploy. Only actual application code changes warrant a test + build + deploy cycle. This saves CI minutes on every non-code commit.

`workflow_dispatch` is kept enabled so the pipeline can be triggered manually from the GitHub Actions tab at any time.

---

## ML Trigger — Why Path Filtering

```yaml
paths:
  - 'ml/**'
  - '.github/workflows/deploy-ml.yml'
```

**Why:** ML-only changes should not wait for the Laravel test/build/deploy cycle, and Laravel-only changes should not redeploy the Python app. Splitting by path keeps each workflow fast and reduces the blast radius of failures.

`workflow_dispatch` is also enabled for the ML workflow so the Flask app can be redeployed manually without touching Laravel.

---

## Concurrency — Why Cancel In-Progress

```yaml
concurrency:
  group: ${{ github.workflow }}-${{ github.ref }}
  cancel-in-progress: true
```

**Why:** If two pushes happen in quick succession (e.g., fixing a typo after a feature push), the first run becomes stale. Without this, both runs race to FTP-upload to the same server simultaneously — the second upload might finish before the first and get overwritten. Cancelling the old run ensures only the latest code ever reaches the server.

---

## Tests Job — Why No npm

The tests job runs Pest (PHP unit + feature tests). Feature tests make HTTP requests to Laravel routes, which render Inertia pages through Blade. Blade calls `@vite(...)` to resolve asset URLs.

Without a build, `public/build/manifest.json` does not exist and Laravel throws an exception before the test even runs.

**Solution: `Vite::fake()`** — added to `tests/TestCase.php` base class. This tells Laravel to skip the manifest and return dummy asset URLs. Tests get to run without any frontend compilation.

**Why not just build in tests:** The build takes ~10–15s and runs in both PHP 8.3 and 8.4 matrix runners — that's 20–30s of wasted time per push for something tests don't actually need.

---

## Build Job — Why a Separate Job

Previously, `npm run build` ran inside the deploy job. This meant:
- The deploy job was responsible for both building and deploying
- If the build failed, there was no clear separation of concern

Extracting build into its own job means:
- **Build fails clearly** — you know it's a build issue, not a deploy issue
- **Artifact is shared** — `public/build/` is uploaded once to GitHub's artifact store and downloaded by the deploy job, eliminating a redundant second build
- **No npm in deploy job** — the deploy job becomes a pure "move files to server" step

If the frontend needs build-time environment variables, they must exist in GitHub Actions as secrets or variables. This matters for Pusher because `VITE_PUSHER_APP_KEY` and `VITE_PUSHER_APP_CLUSTER` are read by Vite during `npm run build`; values that exist only in the server `.env` are too late for the compiled JavaScript bundle.

The same rule applies to the browser tab title and other frontend branding. `VITE_APP_NAME` is injected during the CI build, so the GitHub Actions build job must receive it as a repository or environment variable. The current workflow uses `vars.VITE_APP_NAME` and falls back to `BuzzyHive 2.0` if the variable is missing, which avoids accidental `Laravel` titles in compiled production assets.

The workflow also now uses newer GitHub-maintained action versions (`checkout@v5`, `cache@v5`, `setup-node@v5`, `upload-artifact@v6`, `download-artifact@v6`) to stay ahead of the GitHub Actions Node 20 deprecation warnings.

The artifact has `retention-days: 1` — it only needs to survive the duration of the pipeline run.

---

## ML Test Job — What It Verifies

The ML workflow uses `actions/setup-python@v5` with Python `3.11` to stay close to the cPanel Python App runtime.

The smoke test:

- imports `ml/app.py`
- creates a Flask test client
- checks `GET /health`
- posts a sample payload to `POST /predict`
- verifies expected response keys exist

This is intentionally lightweight. It confirms that:

- the Flask app imports
- the serialized model/scaler can load
- the prediction route still accepts the expected request shape
- the response contract still contains the fields Laravel depends on

---

## Deploy Job — Why FTP and Not Git Pull

Exabytes shared hosting does not provide SSH access for external connections. Git pull over SSH from GitHub Actions is not possible.

FTP is the only viable remote file transfer mechanism on this hosting plan.

`SamKirkland/FTP-Deploy-Action@v4.4.0` maintains a `.ftp-deploy-sync-state.json` file on the server that tracks a hash of every uploaded file. On subsequent deploys, only files whose hash has changed are re-uploaded. This makes the first deploy slow (full upload) and all subsequent deploys fast (diff only).

---

## FTP Exclusions — Why Each One

| Excluded | Reason |
|---|---|
| `**/vendor/**` | Installed on server by deploy hook — uploading thousands of PHP files via FTP is slow |
| `**/node_modules/**` | Never needed on server — only `public/build/` (compiled output) is needed |
| `**/tests/**` | Test files have no purpose in production |
| `resources/js/**` | Source files — compiled into `public/build/` by Vite, not needed in production |
| `resources/css/**` | Same as above |
| `bootstrap/cache/**` | Generated files — rebuilt by `config:cache` + `route:cache` in deploy hook |
| `storage/logs/**` | Server logs must never be overwritten by CI |
| `storage/framework/cache/**` | Runtime cache — regenerated by Laravel automatically |
| `storage/framework/sessions/**` | Active user sessions — overwriting logs everyone out |
| `storage/framework/views/**` | Compiled Blade views — rebuilt by `view:cache` in deploy hook |
| `ml/.venv/**` | Python virtual environment (265MB) — equivalent to node_modules, installed on server |
| `ml/.idea/**` | JetBrains IDE config — not needed anywhere except local dev |
| `ml/train.ipynb` | Training notebook — not needed at runtime |
| `ml/dataset.csv` | Training dataset — not needed at runtime |
| `.env` | Server has its own `.env` with real credentials — must never be overwritten |
| `.composer-lock-hash` | Server-side file tracking last composer.lock hash — must not be overwritten by CI |
| `/CLAUDE.md` | Dev instructions for Claude Code — not part of the application |

---

## Deploy Hook — Why HTTP and Not SSH

No SSH access on Exabytes shared hosting plan. The deploy hook (`public/deploy-hook.php`) is a PHP script exposed via HTTP, protected by `X-Deploy-Secret` header matched against `DEPLOY_SECRET` in the server `.env`.

### Why composer install is skipped when unchanged

```php
$lockHash     = md5_file($laravelRoot . '/composer.lock');
$hashFile     = $laravelRoot . '/.composer-lock-hash';
$previousHash = file_exists($hashFile) ? trim(file_get_contents($hashFile)) : '';

if ($lockHash !== $previousHash) {
    shell_exec("composer install --no-dev ...");
    file_put_contents($hashFile, $lockHash);
}
```

`composer install` takes ~45 seconds on shared hosting. On a typical code-only push where no PHP packages changed, this is wasted time. The hash file persists between deploys and is excluded from FTP upload, so it accumulates across runs correctly.

### Why MasterDataSeeder runs on every deploy

`MasterDataSeeder` uses `updateOrInsert` throughout — it is fully idempotent. Running it on every deploy ensures master reference data (species, sites, honey colors, sensor thresholds, etc.) is always in sync with the codebase, even if someone manually deleted rows or a new row was added.

Demo data seeders (`DemoHiveSeeder`, `SensorLogSeeder`, etc.) are run **manually once** via cPanel terminal — they are not idempotent and would create duplicate records if run on every deploy.

---

## ML Deploy Job — Why a Separate FTP Account

The Laravel and ML apps use separate FTP accounts:

- Laravel FTP user → scoped to the Laravel app root
- ML FTP user → scoped to `/home/urbanale/public_html/buzzyhive-ml`

This separation is important because:

- each app has a different server root
- each app has a different restart procedure
- Laravel deploys should not accidentally overwrite ML files
- ML deploys should not need access to the Laravel `.env`, `public/`, or deploy hook

The ML workflow uploads only the runtime subset of `ml/`:

- `app.py`
- `runtime.py`
- `predict.py`
- `model.pkl`
- `scaler.pkl`
- `model_metadata.json`
- `requirements.txt`
- other runtime helpers needed by the Flask app

It excludes development-only or heavyweight local files such as:

- `.venv/`
- `.idea/`
- `__pycache__/`
- `artifacts/`
- `datasets/`
- `reports/`
- `data_sources/`
- `train.ipynb`
- `dataset.csv`

---

## ML Restart Strategy

The cPanel Python App uses Passenger. After an FTP deploy, the workflow uploads `tmp/restart.txt` into the ML app root to tell Passenger to reload the app.

This makes normal ML code deploys automated:

- upload changed files
- touch `tmp/restart.txt`
- verify `/health`

If Passenger fails to pick up the restart marker on a particular deploy, the fallback is manual: open cPanel → Python App → click `RESTART`.

---

## ML Dependencies — What Is Still Manual

The ML workflow installs dependencies in CI for testing, but it does **not** currently run `pip install -r requirements.txt` inside the production cPanel virtualenv.

That means:

- code-only changes in `ml/` are automated
- model/scaler/metadata changes are automated
- `requirements.txt` changes still require a manual server-side dependency refresh

The workflow now emits a warning when `ml/requirements.txt` changes during a push deploy.

Manual command on the server:

```bash
source /home/urbanale/virtualenv/public_html/buzzyhive-ml/3.11/bin/activate && cd /home/urbanale/public_html/buzzyhive-ml && pip install -r requirements.txt
```

After the install finishes:

- click `RESTART` in cPanel, or
- allow the next deploy to touch `tmp/restart.txt`

Important:

- keep the cPanel Python version aligned with the workflow (`3.11.x`)
- prefer pinned dependency versions in `ml/requirements.txt` for reproducible production installs

---

## Caching Strategy

| Cache | Key | Benefit |
|---|---|---|
| `vendor/` (tests) | `composer-{php-version}-{composer.lock hash}` | Skip composer install when no packages changed |
| `vendor/` (build) | `composer-8.3-{composer.lock hash}` | Same — shared across test and build jobs for PHP 8.3 |
| `node_modules/` | `node-{package-lock.json hash}` | Skip npm ci when no packages changed |
| `pip` (ML tests) | `ml/requirements.txt` hash | Skip repeated Python dependency downloads during ML CI |

Cache hits restore in ~2s vs 30–45s for a full install. On a typical code-only push, all three caches hit and dependency installation is essentially instant.

---

## Estimated Pipeline Times

| Scenario | Tests | Build | Deploy | Total |
|---|---|---|---|---|
| First ever run (cold cache, full FTP) | ~90s | ~2m 30s | ~5m | ~9m |
| Warm cache, code-only change | ~30s | ~45s | ~1m 30s | ~3m |
| Warm cache, dependency change | ~90s | ~2m | ~2m | ~5m |

The deploy time breakdown for a warm cache run:
- FTP sync (few changed files): ~30–45s
- Deploy hook — composer skipped: ~15s
- Deploy hook — artisan commands: ~10s

---

## Required GitHub Secrets

| Secret | Value |
|---|---|
| `FTP_SERVER` | `ftp.urban-alert.com` |
| `FTP_USERNAME` | `deploy@buzzyhive.urban-alert.com` |
| `FTP_PASSWORD` | FTP account password (set in cPanel) |
| `DEPLOY_SECRET` | Must match `DEPLOY_SECRET` in server `.env` |
| `VITE_PUSHER_APP_KEY` | Production Pusher public key used during `npm run build` |
| `VITE_PUSHER_APP_CLUSTER` | Production Pusher cluster used during `npm run build` |
| `ML_FTP_SERVER` | `ftp.urban-alert.com` |
| `ML_FTP_USERNAME` | FTP username for the ML app root |
| `ML_FTP_PASSWORD` | FTP password for the ML app root |

---

## Server-Side Manual Setup (one-time)

These are not handled by the pipeline and must be configured manually:

1. **Cron — queue worker** (cPanel → Cron Jobs)
   ```
   * * * * * cd /home/urbanale/public_html/buzzyhive && php artisan queue:work --stop-when-empty --max-time=55 2>&1
   ```

2. **Cron — Laravel scheduler**
   ```
   * * * * * cd /home/urbanale/public_html/buzzyhive && php artisan schedule:run 2>&1
   ```

3. **Python app (Flask/ML)** — cPanel → Setup Python App
   - Python version: `3.11.x`
   - Application root: `public_html/buzzyhive-ml`
   - Application URL: `ml.buzzyhive.urban-alert.com`
   - Startup file: `app.py`
   - Entry point: `application`
   - install `requirements.txt` into the cPanel-managed virtualenv before first use

4. **Pusher runtime env** — set these in the cPanel `.env` used by Laravel:
   ```dotenv
   BROADCAST_CONNECTION=pusher
   PUSHER_APP_ID=...
   PUSHER_APP_KEY=...
   PUSHER_APP_SECRET=...
   PUSHER_APP_CLUSTER=...
   PUSHER_PORT=443
   PUSHER_SCHEME=https
   ```

5. **Demo data seed** — run once after first deploy:
   ```bash
   cd /home/urbanale/public_html/buzzyhive
   php artisan migrate:fresh --seed
   ```

---

## Operational Summary

### Fully automated

- Laravel code deploys
- Laravel migrations and cache rebuild
- Frontend asset builds
- ML code deploys
- ML model/scaler/metadata deploys
- ML Passenger restart marker upload
- ML live `/health` verification

### Still manual

- creating and rotating FTP accounts/secrets
- first-time cPanel Python App creation/configuration
- production ML dependency refresh when `ml/requirements.txt` changes
- manual cPanel restart if Passenger does not react to `tmp/restart.txt`
