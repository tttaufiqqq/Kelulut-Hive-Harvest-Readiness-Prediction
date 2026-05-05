# BuzzyHive CI/CD Pipeline

Reference document for the GitHub Actions deployment pipeline to Exabytes shared hosting.

---

## Full Pipeline Diagram

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
    │  checkout            │
    │  setup PHP           │
    │  composer cache      │  ← keyed on composer.lock hash
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
    │  checkout            │
    │  setup PHP 8.3       │
    │  composer cache      │  ← same key as deploy, --no-dev
    │  composer install    │
    │  setup Node 22       │
    │  npm cache           │  ← keyed on package-lock.json hash
    │  npm ci              │
    │  inject VITE_PUSHER_*│  ← prod frontend websocket config from GH secrets
    │  npm run build       │  ← compiles React/TS → public/build/
    │  upload artifact     │  ← public/build/ stored in GH for 1 day
    └──────────┬──────────┘
               │
    ┌──────────▼──────────┐
    │     DEPLOY JOB      │
    │─────────────────────│
    │  checkout            │
    │  download artifact   │  ← public/build/ from build job
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

## Trigger — Why Path Filtering

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

The artifact has `retention-days: 1` — it only needs to survive the duration of the pipeline run.

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

## Caching Strategy

| Cache | Key | Benefit |
|---|---|---|
| `vendor/` (tests) | `composer-{php-version}-{composer.lock hash}` | Skip composer install when no packages changed |
| `vendor/` (build) | `composer-8.3-{composer.lock hash}` | Same — shared across test and build jobs for PHP 8.3 |
| `node_modules/` | `node-{package-lock.json hash}` | Skip npm ci when no packages changed |

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

3. **Python app (Flask/ML)** — cPanel → Setup Python App → point to `ml/app.py`, install `requirements.txt`, set `ML_API_URL` in server `.env`

4. **Demo data seed** — run once after first deploy:
   ```bash
   cd /home/urbanale/public_html/buzzyhive
   php artisan migrate:fresh --seed
   ```
