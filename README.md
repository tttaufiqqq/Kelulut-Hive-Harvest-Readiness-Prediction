# BuzzyHive 2.0

IoT-based harvest readiness monitoring system for kelulut (stingless bee) farming in Malaysia.

Sensors on the hive push environmental data to the platform, a machine learning model classifies harvest readiness, and beekeepers get a clean dashboard to manage hives, log harvests, record inspections, and track analytics — all from a web browser.

**Live:** [buzzyhive.urban-alert.com](https://buzzyhive.urban-alert.com)

---

## Features

- **Real-time sensor ingestion** — ESP32 posts temperature, humidity, and gas (MQ2) readings via HTTP
- **ML harvest readiness** — Flask API runs a scikit-learn classifier and returns one of four labels: Not Ready / Approaching / Nearly Ready / Ready to Harvest
- **Telegram alerts** — notifies the beekeeper automatically when the hive hits "Ready to Harvest"
- **Hive management** — add/edit hives, assign beekeepers, track species and site
- **Harvest records** — log weight, honey color, flavor, and productivity per harvest
- **Inspection logs** — record hive inspections with weather conditions and flora observations
- **Analytics dashboard** — HRI summary table, sensor trend charts, harvest history
- **Role-based access** — Admin manages users and master data; Beekeepers manage their own hives
- **Admin invite-only** — no self-registration; admins issue invites

---

## Tech Stack

| Layer | Technology |
|---|---|
| Backend | Laravel 11 (PHP 8.3+) |
| Frontend | React 19 + TypeScript (Inertia.js) |
| Styling | Tailwind CSS v4 + Radix UI |
| Auth & Roles | Laravel Fortify + Spatie Permission |
| Database | MySQL (production) / SQLite (tests) |
| ML API | Python + scikit-learn → Flask REST API |
| Hardware | ESP32 + DHT11 (temperature/humidity) + MQ2 (gas) |
| Hosting | Exabytes shared hosting (LiteSpeed) |
| CI/CD | GitHub Actions → FTP deploy → post-deploy hook |

---

## Project Structure

```
buzzyhive/
├── app/
│   ├── Http/Controllers/
│   │   ├── Admin/          # BeekeeperController, SensorDashboardController, ThesisController
│   │   ├── SensorController.php   # IoT HTTP POST endpoint
│   │   └── AnalyticsController.php
│   └── Models/             # Hive, SensorLog, IotNode, HiveSummary, User ...
├── resources/js/Pages/
│   ├── LandingPage.tsx
│   ├── dashboard.tsx
│   ├── analytics.tsx
│   └── admin/              # dashboard, sensors, thesis pages
├── database/migrations/    # 22 migrations — master tables, core tables, junctions
├── ml/                     # (pending) train.ipynb, model.pkl, app.py, requirements.txt
├── diagrams/               # ERD (.drawio), DFD (.md)
├── .github/workflows/
│   ├── deploy.yml          # test → build → FTP upload → deploy hook
│   └── lint.yml            # ESLint + Prettier + Pint
└── public/
    └── deploy-hook.php     # Post-deploy artisan commands (migrate, cache)
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
git clone https://github.com/tttaufiqqq/BuzzyHive-2.0.git
cd buzzyhive

# PHP dependencies
composer install

# Node dependencies
npm install

# Environment
cp .env.example .env
php artisan key:generate

# Configure .env:
# DB_DATABASE, DB_USERNAME, DB_PASSWORD
# FLASK_API_URL=http://localhost:5000
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
# POST /predict — accepts { temperature, humidity, mq2_value }
```

---

## Hardware

The ESP32 firmware sends a JSON POST to `/api/sensor` after each reading:

```json
{
  "node_id": 1,
  "temperature": 30.5,
  "humidity": 72.0,
  "mq2_value": 120
}
```

The endpoint stores the reading in `sensor_logs`, calls the Flask API for a prediction, stores the result in `predictions`, and triggers a Telegram alert if readiness is "Ready to Harvest".

---

## ML Pipeline

**Task:** Multi-class classification — harvest readiness from sensor readings.

**Labels:** Not Ready / Approaching / Nearly Ready / Ready to Harvest

**Stack:** scikit-learn → `.pkl` model file → Flask REST API

> Dataset is pending from the supervising lecturer. The `ml/` directory structure is scaffolded but training has not yet been run.

---

## Roles

| Role | Access |
|---|---|
| `admin` | Full access — manage beekeepers, master data, view all hives |
| `beekeeper` | Own hives only — sensor dashboard, harvests, inspections |

Roles are managed via Spatie Permission. Admins assign roles when inviting users.

---

## CI/CD

Push to `main` triggers:

1. **Lint** (`lint.yml`) — ESLint, Prettier, Laravel Pint — runs in parallel
2. **Tests** (`deploy.yml`) — Pest on PHP 8.3 + 8.4, SQLite in-memory, RefreshDatabase
3. **Deploy** (only if tests pass) — builds frontend assets, uploads via FTP to Exabytes, hits `deploy-hook.php`

The deploy hook runs `migrate --force`, `config:cache`, `route:cache`, `view:cache` over HTTP (no SSH on shared hosting).

---

## Database Schema

22 migrations across four groups:

| Group | Tables |
|---|---|
| Master / lookup | species, sites, sensor_thresholds, honey_colors, honey_flavors, weather_conditions, flora_types |
| Core | hives, iot_nodes, sensor_logs, predictions, harvests, inspections, hri_summary |
| Junction | inspection_weather, inspection_flora, sensor_log_thresholds |
| Laravel system | users, cache, jobs, permissions (Spatie) |
