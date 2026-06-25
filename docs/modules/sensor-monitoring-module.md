# BuzzyHive 2.0 — Sensor Monitoring Module (M1)

*Version: 1.0 | Date: 2026-05-01 | Status: Complete*

---

## Overview

The Sensor Monitoring Module handles the full pipeline from ESP32 data ingestion to ML-based harvest readiness prediction. It receives sensor readings via a secured REST endpoint, stores them, matches environmental thresholds, calls the Flask ML service, persists the prediction, and rolls up a daily HRI summary per hive. The admin dashboard displays all 4 MQ gas sensor readings alongside temperature and humidity in real time.

---

## Pipeline

```
ESP32 POST /api/sensor-data
  → [X-API-Key auth]
  → [payload validation]
  → [IotNode resolve: device_id + hive_id + device_status=active]
  → SensorLog::create()
  → SensorReadingCreated::dispatch() → Pusher broadcast (realtime dashboard update)
  → match master_sensor_thresholds → insert sensor_log_thresholds (non-blocking)
  → MlPredictionService::runPrediction($log)
       → Http::post(Flask /predict, {mq2,mq3,mq5,mq135,temp,humidity})
       → Flask returns {readiness_level, raw_readiness_level, hri_value, raw_hri_value,
                        confidence_score, warning_state, guardrail_action, out_of_distribution,
                        out_of_distribution_features, prediction_warning, threshold_warning_level}
       → Prediction::create() inside DB::transaction()
       → HriSummary::updateOrCreate(hive_id + today, daily averages)
           (MySQL: trigger trg_predictions_after_insert; SQLite: PHP fallback)
       → PredictionCreated::dispatch() → Pusher broadcast
       → if readiness_level === 'ready' → SendTelegramAlert::dispatch()->afterCommit()
  → 201 {"status":"ok"} to ESP32
```

**Key implementation detail — `persistPrediction($queueAlert)`:** The `MlPredictionService::persistPrediction()` method accepts a `bool $queueAlert = true` parameter. This prevents double-dispatching Telegram alerts. The IoT ingestion path passes the default (`true`). The synthetic diagnostic endpoint passes `queueAlert: false` and handles the Telegram send itself synchronously via `dispatchSync()`.

---

## Architecture

### Backend

| Layer | File | Responsibility |
|-------|------|----------------|
| Controller | `app/Http/Controllers/SensorController.php` | Auth, validation, node resolution, sensor log, threshold matching; also hosts `testTelegramReady()` diagnostic endpoint |
| Service | `app/Services/MlPredictionService.php` | Flask call, prediction store, HRI summary update, Telegram trigger |
| Model | `app/Models/SensorLog.php` | SENSOR_LOG table, hive + iotNode relationships |
| Model | `app/Models/IotNode.php` | IOT_NODE table, device registry |
| Model | `app/Models/Prediction.php` | PREDICTION table, sensorLog relationship |
| Model | `app/Models/HriSummary.php` | HRI_SUMMARY table, daily rollup per hive |
| Controller | `app/Http/Controllers/Admin/SensorDashboardController.php` | Admin dashboard data: latest + history for all 6 sensor types |

### Frontend

| File | Responsibility |
|------|----------------|
| `resources/js/pages/admin/sensors.tsx` | Live sensor dashboard — arc gauges, progress bars, line charts, 4-sensor gas scroll row |
| `resources/js/components/core/scroll-area.tsx` | Reusable ScrollArea component with custom amber webkit scrollbar |

### Tables

| Table | Purpose |
|-------|---------|
| `sensor_logs` | Raw readings: hive_id, device_id FK→iot_nodes, temp, humidity, mq2/3/5/135_value, record_timestamp |
| `iot_nodes` | Device registry: device_id (string unique), hive_id, device_status enum |
| `predictions` | ML output: sensor_log_id FK, readiness_level, hri_value, confidence_score, prediction_timestamp |
| `hri_summary` | Daily rollup: hive_id, summary_date, avg_temperature, avg_humidity, avg_mq2, avg_hri_value, latest_readiness_level |
| `sensor_log_thresholds` | Junction: sensor_log_id FK, threshold_id FK |
| `master_sensor_thresholds` | Lookup bands: sensor_type, min_value, max_value, level, meaning, recommended_action |

---

## Key Configuration

| Key | Value | Location |
|-----|-------|----------|
| `IOT_API_KEY` | `buzzyhive-iot-key-2026` | `.env` → `config('app.iot_api_key')` |
| `ML_API_URL` | `http://localhost:5000` | `.env` → `config('services.ml.url')` |
| `TELEGRAM_BOT_TOKEN` | set in env | `.env` → `config('services.telegram.token')` |
| `TEST_TELEGRAM_SECRET` | set in env | `.env` → `config('services.telegram.test_secret')` — guards the diagnostic endpoint |

---

## Sensor Types & Thresholds

| Sensor | Normal | Warning | Critical |
|--------|--------|---------|----------|
| temp | 32.0–37.0 °C | 37.1–40.0 °C | 40.1–99.0 °C |
| humidity | 60.0–80.0 % | 80.1–90.0 % | 90.1–100.0 % |
| mq2 | 0–300 ADC | 301–500 ADC | 501–9999 ADC |
| mq3 | 0–300 ADC | 301–500 ADC | 501–9999 ADC |
| mq5 | 0–300 ADC | 301–500 ADC | 501–9999 ADC |
| mq135 | 0–300 ADC | 301–500 ADC | 501–9999 ADC |

ADC resolution: `analogReadResolution(10)` on ESP32 → 0–1023 range.

---

## ESP32 Payload

```json
{
  "device_id":   "NODE-001",
  "hive_id":     1,
  "temp":        33.5,
  "humidity":    70.0,
  "mq2_value":   250,
  "mq3_value":   200,
  "mq5_value":   180,
  "mq135_value": 220
}
```

Header: `X-API-Key: buzzyhive-iot-key-2026`

---

## ML Output

Flask returns a continuous HRI value and a guarded readiness label:

| Field | Type | Description |
|---|---|---|
| `readiness_level` | string | Guarded label after guardrails: `not_ready` / `approaching` / `nearly_ready` / `ready` |
| `raw_readiness_level` | string | Raw model output before any guardrail override |
| `hri_value` | float (0–1) | Guarded continuous HRI score (not a fixed mapping per level) |
| `raw_hri_value` | float (0–1) | Raw model score before guardrail modification |
| `confidence_score` | float (0–1) | KNN vote ratio (e.g. 0.86 = 86% of neighbours voted for this class) |
| `warning_state` | string | `normal` or `warning` — indicates guardrail trust level |
| `guardrail_action` | string | `none` / `downgrade` / `suppress` — what the guardrail did |
| `out_of_distribution` | bool | True if any feature falls outside the training min/max range |
| `out_of_distribution_features` | array | Which features triggered OOD, with observed vs training bounds |
| `prediction_warning` | string\|null | Human-readable explanation when guardrails reduce trust |
| `threshold_warning_level` | string\|null | `warning` or `critical` when sensor thresholds conflict with the ML result |

Telegram alert fires when `readiness_level === 'ready'`.

HRI score bands (per `docs/ml/ml-decision-policy.md`):

| Score range | Label |
|---|---|
| < 0.35 | `not_ready` |
| 0.35 – 0.60 | `approaching` |
| 0.60 – 0.80 | `nearly_ready` |
| ≥ 0.80 | `ready` |

---

## Telegram Diagnostic Endpoint

`POST /api/internal/test-telegram-ready`

An internal HTTP endpoint for verifying the Telegram alert pipeline without waiting for the IoT device to produce a real "ready" prediction. Protected by `X-Test-Secret` header checked against `config('services.telegram.test_secret')`.

| Mode | Behaviour |
|---|---|
| `full_pipeline` | Stores a real sensor log → calls Flask ML → stores prediction → queues Telegram alert if "ready" |
| `synthetic_ready` | Stores a sensor log → creates a synthetic "ready" prediction (no ML call) → sends Telegram synchronously |

**Synthetic prediction fields** (distinguishable from real ML output):
- `model_version: synthetic_diagnostic_ready_v1`
- `hri_value: 0.85`, `confidence_score: 0.88`
- `prediction_warning: 'Synthetic diagnostic prediction created by the internal Telegram readiness test endpoint.'`

**Response codes:**
- `201` — pipeline succeeded (prediction stored, Telegram queued or sent)
- `409` — full_pipeline ran but ML returned a non-ready level
- `503` — full_pipeline ran but Flask ML API was unavailable
- `401` — missing or wrong test secret
- `404` — device_id not found or device_status not active
- `422` — payload validation failed

Controller: `app/Http/Controllers/SensorController::testTelegramReady()`
Script: `scripts/trigger-prod-ready-alert.ps1`

---

## Bugs Fixed

| Bug | File | Fix |
|-----|------|-----|
| `->where('status')` — wrong column | `SensorController.php` | `->where('device_status', 'active')` |
| `'iot_node_id' => $node->id` — wrong key | `SensorController.php` | `'device_id' => $node->id` |
| `'recorded_at' => now()` — wrong key | `SensorController.php` | `'record_timestamp' => now()` |
| `=== 'Ready to Harvest'` — wrong string | `MlPredictionService.php` | `=== 'ready'` |
| `hive()` BelongsTo on Prediction — stale | `Prediction.php` | Removed (predictions has no hive_id) |

---

## Migration Guards Added

Five `2026_04_29` fix migrations were written for a live MySQL DB with old column names. On a fresh SQLite test schema (`RefreshDatabase`) the original `create_*` migrations already used final names, causing crashes. Guards added:

| Migration | Guard type | Problem |
|-----------|-----------|---------|
| `fix_iot_nodes_columns` | `Schema::hasColumn` | `registered_at`, `status` never existed on fresh schema |
| `fix_sensor_logs_columns` | `Schema::hasColumn` | `iot_node_id`, `recorded_at` never existed on fresh schema |
| `rebuild_hri_summary_table` | `Schema::hasTable` | `hri_summary` already created by earlier migration |
| `fix_predictions_table` | `Schema::hasColumn` | `hive_id` never existed on fresh schema |
| `fix_harvests_table` | `Schema::hasColumn` | `updated_at` already in `create_harvests_table` |

---

## Tests

### `tests/Feature/SensorIngestTest.php`

| # | Test | Assertion |
|---|------|-----------|
| 1 | Valid payload | 201 + `SensorLog::count() == 1` |
| 2 | Prediction stored | `Prediction::count() == 1`, linked to sensor_log_id |
| 3 | HRI summary created | `HriSummary` exists for hive_id + today |
| 4 | Missing X-API-Key | 401 + no sensor_log stored |
| 5 | Wrong X-API-Key | 401 |
| 6 | Invalid payload (temp=999) | 422 + no sensor_log stored |
| 7 | Unknown device_id | 404 |
| 8 | Flask down (ConnectionException) | 201 + sensor_log saved + no prediction |
| 9 | Threshold matching | `sensor_log_thresholds` row written for matched threshold |

### `tests/Feature/TelegramDiagnosticTest.php`

| # | Test | Assertion |
|---|------|-----------|
| 1 | Missing or wrong test secret | 401, no sensor_log stored |
| 2 | Invalid payload or inactive device | 422 / 404, no sensor_log stored |
| 3 | full_pipeline — ML returns non-ready | 409, prediction stored, Telegram NOT queued |
| 4 | full_pipeline — ML unavailable | 503, sensor_log saved, no prediction, Telegram NOT queued |
| 5 | full_pipeline — ML returns ready | 201, sensor_log + prediction stored, Telegram queued |
| 6 | synthetic_ready — success | 201, prediction stored with `model_version=synthetic_diagnostic_ready_v1`, Telegram sent synchronously |
| 7 | Synthetic vs real prediction distinction | Both prediction types coexist, `model_version` values differ, `prediction_warning` present on synthetic |

**CI note:** Tests set `config(['services.telegram.token' => 'test-bot-token'])` in `beforeEach`. Without a dummy token, `TelegramService::execute()` throws before making any HTTP call — causing `synthetic_ready` to report `telegram_dispatch: send_failed`.

**Queue::fake() + dispatchSync() behaviour:** When `Queue::fake()` is active, `dispatchSync()` on a `ShouldQueue` job routes through `dispatchToQueue('sync')` — the `QueueFake` captures the job without executing `handle()`. No Telegram HTTP call fires. This is why the distinguishable-predictions test expects `Http::assertSentCount(1)` (one ML call) not 2.

Run with:

```bash
php artisan test --filter=SensorIngest
php artisan test --filter=TelegramDiagnostic
```

---

## Phase 8 Verification (2026-05-01)

Verified via `php artisan tinker` with `Http::fake()` for Flask.

### Test A — Happy path

```json
POST /api/sensor-data
X-API-Key: buzzyhive-iot-key-2026

{"device_id":"NODE-001","hive_id":1,"temp":33.5,"humidity":70,"mq2_value":250,"mq3_value":200,"mq5_value":180,"mq135_value":220}
```

**Response:** `201 {"status":"ok"}`

**DB verification:**

| Layer | Result |
|-------|--------|
| `sensor_logs` id=413 | hive_id=1, device_id=1, temp=33.5, humidity=70, mq2=250, mq3=200, mq5=180, mq135=220, record_timestamp set ✅ |
| `sensor_log_thresholds` | 9 rows linked to sensor_log_id=413 (temp/humidity/mq2/mq3/mq5/mq135 all matched normal band) ✅ |
| `predictions` | sensor_log_id=413, readiness_level=not_ready, hri_value=0.25, confidence_score=0.8 ✅ |
| `hri_summary` | hive_id=1, summary_date=2026-05-01, avg_temperature=33.5, avg_humidity=70, avg_mq2=250, avg_hri_value=0.25, latest_readiness_level=not_ready ✅ |

### Tests B–E

| Test | Scenario | Expected | Result |
|------|----------|----------|--------|
| B | Wrong API key | 401 | ✅ 401 |
| C | No API key | 401 | ✅ 401 |
| D | Unknown device_id | 404 | ✅ 404 |
| E | Flask down (real connection) | 201, sensor_log saved, no prediction | ✅ 201, +1 sensor_log, predictions unchanged |

---

## ScrollArea Component

File: `resources/js/components/core/scroll-area.tsx`

Reusable wrapper with custom amber-styled webkit scrollbar. Supports `vertical`, `horizontal`, and `both` directions.

```tsx
import { ScrollArea } from '@/components/core/scroll-area';

<ScrollArea direction="horizontal" className="pb-3">
    {/* scrollable content */}
</ScrollArea>
```

Used in `admin/sensors.tsx` to display all 4 MQ gas sensor cards in a horizontal scroll row on mobile.

---

## Commits

| Hash | Description |
|------|-------------|
| `95616be` | fix: SensorController — device_status, device_id, record_timestamp bugs + threshold matching |
| `1765bf8` | fix: MlPredictionService — readiness_level check + HriSummary updateOrCreate |
| `4fd727c` | fix: remove stale hive() BelongsTo from Prediction model |
| `500df6b` | feat: SensorDashboardController — expose mq3, mq5, mq135 readings |
| `7bd6989` | feat: seeders — mq3/mq5/mq135 thresholds, sensor log values, hri summary_date |
| `cceabc8` | test: full rewrite of SensorIngestTest — 9 tests covering new pipeline |
| `57064c8` | feat: ScrollArea component + sensors dashboard — all 4 MQ sensors with custom scrollbar |
| `be282a6` | fix: guard all fix migrations against fresh-schema column/table conflicts |
