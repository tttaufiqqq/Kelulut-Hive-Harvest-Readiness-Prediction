# BuzzyHive 2.0

IoT-based harvest readiness monitoring system for kelulut (stingless bee) farming in Malaysia.

Sensors on the hive push environmental data to the platform, a machine learning model classifies harvest readiness, and beekeepers get a clean dashboard to manage hives, log harvests, record inspections, and track analytics — all from a web browser.

**Live:** [buzzyhive.urban-alert.com](https://buzzyhive.urban-alert.com)

---

## Features

- **Real-time sensor ingestion** — ESP32 posts temperature, humidity, and gas (MQ2/MQ3/MQ5/MQ135) readings via HTTP
- **ML harvest readiness** — Flask API runs a KNN classifier with guardrails (OOD detection, confidence-based downgrade, threshold conflict detection) and returns one of four labels: Not Ready / Approaching / Nearly Ready / Ready to Harvest
- **Realtime updates** — Pusher + Laravel Echo pushes live predictions and sensor readings to the dashboard without page refresh
- **Telegram alerts** — notifies the beekeeper automatically when the hive hits "Ready to Harvest"
- **Two-factor authentication** — TOTP-based 2FA available on all accounts
- **Hive management** — add/edit hives, assign beekeepers, track species and site
- **Harvest records** — log weight, honey color, flavor, and productivity per harvest
- **Inspection logs** — record hive inspections with weather conditions and flora observations
- **Analytics dashboard** — HRI trend charts, sensor readings, harvest history, 30-day summaries
- **Reporting** — per-hive HRI gauge and readiness trend across time
- **Role-based access** — Admin manages users and master data; Beekeepers manage their own hives
- **Admin invite-only** — no self-registration; admins issue invites

---

## Tech Stack

| Layer | Technology |
|---|---|
| Backend | Laravel 13 (PHP 8.3+) |
| Frontend | React 19 + TypeScript (Inertia.js) |
| Styling | Tailwind CSS v4 + Radix UI |
| Auth & Roles | Laravel Fortify + Spatie Permission |
| Database | MySQL (production) / SQLite (tests) |
| ML API | Python + scikit-learn (KNN) → Flask REST API |
| Hardware | ESP32 + DHT11 + MQ2 + MQ3 + MQ5 + MQ135 |
| Hosting | Exabytes shared hosting (LiteSpeed) |
| CI/CD | GitHub Actions → artifact build → FTP deploy → post-deploy hook |

---

## Project Structure

```
buzzyhive/
├── app/
│   ├── Http/Controllers/
│   │   ├── Admin/              # BeekeeperController, SensorDashboardController
│   │   ├── SensorController.php       # IoT HTTP POST endpoint
│   │   ├── AnalyticsController.php
│   │   └── ReportingController.php
│   ├── Services/
│   │   ├── MlPredictionService.php    # Calls Flask API, stores prediction, updates HriSummary
│   │   └── TelegramService.php
│   └── Models/                 # Hive, SensorLog, IotNode, Prediction, HriSummary, User ...
├── resources/js/pages/
│   ├── dashboard.tsx            # Beekeeper hive overview
│   ├── analytics.tsx            # HRI trend + sensor charts
│   ├── reporting.tsx            # HRI gauges + readiness trend
│   └── admin/                  # Admin dashboard, sensor monitor, user management
├── database/
│   ├── migrations/             # Full schema — master tables, core tables, junctions
│   └── seeders/                # MasterDataSeeder (auto) + demo data seeders (manual once)
├── ml/
│   ├── app.py                  # Flask REST API — POST /predict
│   ├── model.pkl               # Trained KNN model
│   ├── scaler.pkl              # Feature scaler
│   ├── train.ipynb             # Training notebook (expanded synthetic dataset)
│   └── requirements.txt
├── diagrams/                   # ERD + DFD (.drawio)
├── .github/workflows/
│   ├── deploy.yml              # tests → build → FTP upload → deploy hook
│   ├── lint.yml                # ESLint + Prettier + Pint
│   └── deploy-ml.yml           # smoke-test → upload ml/ → Passenger restart
└── public/
    └── deploy-hook.php         # Post-deploy: composer install (if changed), migrate, seed, cache
```

---

## Local Setup

### Requirements

- PHP 8.3+
- Composer
- Node.js 22+
- MySQL
- Python 3.10+ (for ML API)

### Steps

```bash
# Clone
git clone https://github.com/tttaufiqqq/Kelulut-Hive-Harvest-Readiness-Prediction.git
cd Kelulut-Hive-Harvest-Readiness-Prediction

# PHP dependencies
composer install

# Node dependencies
npm install

# Environment
cp .env.example .env
php artisan key:generate

# Configure .env:
# DB_DATABASE, DB_USERNAME, DB_PASSWORD
# ML_API_URL=http://localhost:5000
# BROADCAST_CONNECTION=pusher
# PUSHER_APP_ID, PUSHER_APP_KEY, PUSHER_APP_SECRET, PUSHER_APP_CLUSTER
# VITE_PUSHER_APP_KEY, VITE_PUSHER_APP_CLUSTER, VITE_PUSHER_HOST, VITE_PUSHER_PORT, VITE_PUSHER_SCHEME
# TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID
# DEPLOY_SECRET (for post-deploy hook)

# Database
php artisan migrate
php artisan db:seed

# Build assets + run
npm run dev
php artisan serve
```

### ML API (Flask)

```bash
cd ml
pip install -r requirements.txt
python app.py
# Runs on http://localhost:5000
# POST /predict — accepts { temp, humidity, mq2_value, mq3_value, mq5_value, mq135_value }
```

---

## Hardware

The ESP32 firmware reads sensors every interval and sends a JSON POST to `/api/sensor`:

```json
{
  "device_id": "NODE-001",
  "hive_id": 1,
  "temp": 34.2,
  "humidity": 71.5,
  "mq2_value": 310,
  "mq3_value": 275,
  "mq5_value": 290,
  "mq135_value": 320
}
```

The endpoint stores the reading in `sensor_logs`, calls the Flask ML API for a prediction, stores the result in `predictions`, updates `hri_summary`, and dispatches a Telegram alert if readiness is "Ready to Harvest".

**Sensors:** DHT11 (temp/humidity), MQ2 (smoke/LPG), MQ3 (alcohol/VOC), MQ5 (LPG/natural gas), MQ135 (air quality/CO2)
**ADC:** `analogReadResolution(10)` — 0–1023 range on all MQ sensors.

---

## ML Pipeline

**Task:** Multi-class classification — kelulut honey harvest readiness from sensor readings.

**Labels:** `not_ready` / `approaching` / `nearly_ready` / `ready`

**Model:** K-Nearest Neighbours (KNN, k=7, distance-weighted)

**Dataset:** Expanded synthetic dataset anchored on Aida 'Izwani's thesis baselines (same species, same sensor types).

**Guardrails (`ml/runtime.py`):** OOD detection per feature, confidence-based label downgrade, threshold conflict detection — stored alongside the raw model output for auditability.

**Stack:** scikit-learn → `.pkl` model + scaler → Flask REST API on cPanel (Passenger WSGI)

**Output per prediction:** `readiness_level`, `raw_readiness_level`, `hri_value`, `raw_hri_value`, `confidence_score`, `warning_state`, `guardrail_action`, `out_of_distribution`

---

## Roles

| Role | Access |
|---|---|
| `admin` | Full access — manage beekeepers, master data, view all hives |
| `beekeeper` | Own hives only — sensor dashboard, harvests, inspections |

Roles are managed via Spatie Permission. Admins assign roles when inviting users.

---

## CI/CD

Push to `main` (app files only — docs and unrelated changes are ignored) triggers:

1. **Lint** (`lint.yml`) — ESLint, Prettier, Laravel Pint — runs in parallel
2. **Tests** (`deploy.yml`) — Pest on PHP 8.3 + 8.4 in parallel, SQLite in-memory, `Vite::fake()` (no frontend build needed) — 119 tests / 501 assertions
3. **Build** (after tests pass) — installs deps, runs `npm run build`, uploads `public/build/` as a GitHub Actions artifact
4. **Deploy** (after build) — downloads artifact, FTPs changed files only to Exabytes, hits `deploy-hook.php`

**Deploy hook** (runs on server via HTTP):
- `composer install` — **not automated**; hook returns 409 if `composer.lock` changed — requires manual install on the server first
- `php artisan migrate --force`
- `php artisan db:seed --class=MasterDataSeeder`
- `php artisan config:cache` + `route:cache` + `view:cache`

**Estimated pipeline time:** ~3–4 min (warm cache, code-only change)

---

## Database Schema

| Group | Tables |
|---|---|
| Master / lookup | master_species, master_sites, master_sensor_thresholds, master_honey_colors, master_honey_flavors, master_weather_conditions, master_flora_types |
| Core | hives, iot_nodes, sensor_logs, predictions, harvests, inspections, hri_summary |
| Junction | inspection_weather, inspection_flora, sensor_log_thresholds |
| Laravel system | users, cache, jobs, permissions (Spatie) |
