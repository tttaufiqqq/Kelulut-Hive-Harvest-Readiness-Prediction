# Scripts

This folder contains:

- local PowerShell helpers for simulating sensor traffic
- a production smoke-test helper for Laravel + ML deployments

## Files

- `send-sensor-intervals.ps1`
  - local replay script for a fixed sequence of sensor payloads
- `send-sensor-drift.ps1`
  - local random-walk sensor simulator
- `send-sensor-realistic.ps1`
  - smoother and more correlated sensor simulator
  - better for realistic live prediction testing in prod
- `sensor-payloads.sample.json`
  - sample payload timeline for local replay testing
- `test-prod.ps1`
  - production smoke test for:
    - Laravel `/up`
    - Laravel `/login`
    - ML `/health`
    - ML `/predict`
    - optional `POST /api/sensor-data`
- `test-prod-telegram-ready.ps1`
  - dev-PC runner for the internal production Telegram diagnostic endpoint
  - supports both real-ML `full_pipeline` checks and forced `synthetic_ready` alert checks
- `test-prod-broadcast.php`
  - server-side broadcast diagnostics for production
  - checks active Laravel Pusher config and whether the built frontend bundle contains the expected Pusher values

---

## Production Smoke Test

### Safe public checks only

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File ".\scripts\test-prod.ps1" -SkipSensorIngest
```

This verifies:

- `https://buzzyhive.urban-alert.com/up`
- `https://buzzyhive.urban-alert.com/login`
- `https://ml.buzzyhive.urban-alert.com/health`
- `https://ml.buzzyhive.urban-alert.com/predict`

### Include real sensor ingest

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File ".\scripts\test-prod.ps1" -ApiKey "<prod-iot-api-key>" -DeviceId "NODE-001" -HiveId 1
```

Use the ingest check only when:

- the `DeviceId` exists in production
- the device is assigned to that `HiveId`
- the IoT API key is the real production key

### Custom domains

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File ".\scripts\test-prod.ps1" -AppUrl "https://buzzyhive.urban-alert.com" -MlUrl "https://ml.buzzyhive.urban-alert.com" -SkipSensorIngest
```

---

## Production Broadcast Diagnostics

Run this on the production server from the Laravel project root:

```bash
php scripts/test-prod-broadcast.php
```

What it checks:

- active Laravel `broadcasting` config is using `pusher`
- `PUSHER_APP_ID`, `PUSHER_APP_KEY`, `PUSHER_APP_SECRET`, `PUSHER_APP_CLUSTER`, `PUSHER_SCHEME`, and `PUSHER_PORT` are present in runtime config
- Laravel can instantiate the Pusher broadcaster
- `public/build` exists and the compiled app bundle contains the active Pusher key and cluster

How to read the result:

- if Laravel config checks fail: production `.env` or config cache is wrong
- if Laravel config passes but bundle checks fail: the frontend was built without `VITE_PUSHER_APP_KEY` and/or `VITE_PUSHER_APP_CLUSTER`
- if both pass: the next place to inspect is `/broadcasting/auth` and the browser websocket connection

---

## Production Telegram Diagnostic

This flow is internal-only and requires the `X-Test-Secret` header backed by `TELEGRAM_TEST_SECRET`.

Run it from a Windows dev PC:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File ".\scripts\test-prod-telegram-ready.ps1" -AppUrl "https://buzzyhive.urban-alert.com" -TestSecret "<telegram-test-secret>" -DeviceId "NODE-001" -HiveId 1 -Mode synthetic_ready
```

Run the real ML path:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File ".\scripts\test-prod-telegram-ready.ps1" -AppUrl "https://buzzyhive.urban-alert.com" -TestSecret "<telegram-test-secret>" -DeviceId "NODE-001" -HiveId 1 -Mode full_pipeline
```

Optional ML override:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File ".\scripts\test-prod-telegram-ready.ps1" -AppUrl "https://buzzyhive.urban-alert.com" -MlUrl "https://ml.buzzyhive.urban-alert.com" -TestSecret "<telegram-test-secret>" -DeviceId "NODE-001" -HiveId 1 -Mode full_pipeline
```

Route behavior:

- `POST /api/internal/test-telegram-ready` always stores a real `sensor_logs` row first so the diagnostic run is traceable.
- `mode=full_pipeline` calls the real ML service, persists the resulting prediction, and returns:
  - `201` when the final guarded `readiness_level` is `ready`
  - `409` when ML runs but the final guarded readiness is not `ready`
  - `503` when ML is unavailable or fails before a prediction can be created
- `mode=synthetic_ready` skips ML, creates a clearly marked synthetic prediction (`prediction_source=synthetic_diagnostic`), and returns `201` after queueing the normal Telegram alert job.

What success means:

- `full_pipeline` success means production ML produced a final guarded `ready` prediction and Laravel queued `SendTelegramAlert`.
- `synthetic_ready` success means the endpoint forced a diagnostic-only ready prediction and Laravel queued `SendTelegramAlert` without relying on ML output.

Important limits:

- These checks verify queued Telegram dispatch only. They do not confirm Telegram delivery receipt from the bot API or the end user's device.
- Production queue worker health still matters. The diagnostic route queues the alert job; it does not send Telegram inline during the HTTP request.
- Synthetic diagnostic predictions are stored intentionally and marked via diagnostic metadata so they can be distinguished from real ML predictions during review.

---

## Realistic Sensor Stream

### Preview the generated payloads only

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File ".\scripts\send-sensor-realistic.ps1" -PreviewOnly -RandomSeed 42
```

### Send a realistic stream to production

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File ".\scripts\send-sensor-realistic.ps1" -ApiUrl "https://buzzyhive.urban-alert.com/api/sensor-data" -ApiKey "<prod-iot-api-key>" -DeviceId "NODE-001" -HiveId 1 -Iterations 12 -IntervalSeconds 8
```

### Tune the baseline for a warmer or calmer hive

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File ".\scripts\send-sensor-realistic.ps1" -ApiUrl "https://buzzyhive.urban-alert.com/api/sensor-data" -ApiKey "<prod-iot-api-key>" -DeviceId "NODE-001" -HiveId 1 -BaseTemp 33.8 -BaseHumidity 71 -BaseMq2 230 -BaseMq3 185 -BaseMq5 198 -BaseMq135 245
```

What makes this script feel more realistic:

- temperature changes smoothly instead of jumping randomly
- humidity moves inversely with temperature
- MQ values drift together instead of independently
- an occasional disturbance spike simulates a transient event

---

## Local Sensor Simulation

## Before Running

Make sure these are running:

1. `php artisan serve`
2. `npm run dev`
3. `cd ml` then `python app.py`

If you recently changed PHP certificate settings in `php.ini`, restart `php artisan serve` before using the scripts.

## Fixed Sequence Script

### Preview only

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File ".\scripts\send-sensor-intervals.ps1" -PreviewOnly
```

### Run with built-in payloads

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File ".\scripts\send-sensor-intervals.ps1"
```

### Run with the JSON payload file

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File ".\scripts\send-sensor-intervals.ps1" -PayloadFile ".\scripts\sensor-payloads.sample.json"
```

### Example with custom timing

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File ".\scripts\send-sensor-intervals.ps1" -PayloadFile ".\scripts\sensor-payloads.sample.json" -Iterations 20 -IntervalSeconds 5
```

## Drift Script

### Preview only

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File ".\scripts\send-sensor-drift.ps1" -PreviewOnly
```

### Run the default drift stream

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File ".\scripts\send-sensor-drift.ps1"
```

### Example with reproducible random values

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File ".\scripts\send-sensor-drift.ps1" -Iterations 10 -IntervalSeconds 2 -RandomSeed 42
```

### Example with a different baseline

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File ".\scripts\send-sensor-drift.ps1" -DeviceId "NODE-001" -HiveId 1 -StartTemp 34.2 -StartHumidity 72 -StartMq2 280 -StartMq3 220 -StartMq5 210 -StartMq135 240
```

## Realistic Script

### Run the default realistic stream

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File ".\scripts\send-sensor-realistic.ps1"
```

### Example with reproducible realistic values

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File ".\scripts\send-sensor-realistic.ps1" -Iterations 10 -IntervalSeconds 2 -RandomSeed 42
```

## Common Parameters

### Both scripts

- `-ApiUrl`
- `-ApiKey`
- `-DeviceId`
- `-HiveId`
- `-IntervalSeconds`
- `-Iterations`
- `-PreviewOnly`

### Drift script only

- `-StartTemp`
- `-StartHumidity`
- `-StartMq2`
- `-StartMq3`
- `-StartMq5`
- `-StartMq135`
- `-RandomSeed`

### Realistic script only

- `-BaseTemp`
- `-BaseHumidity`
- `-BaseMq2`
- `-BaseMq3`
- `-BaseMq5`
- `-BaseMq135`
- `-DisturbanceEvery`
- `-RandomSeed`

## Expected Response

For successful sensor ingestion:

```json
{"status":"ok"}
```

If you get `500` again:

1. inspect `storage/logs/laravel.log`
2. confirm `php artisan serve` was restarted after any `php.ini` change
3. confirm browser channel auth at `/broadcasting/auth` is succeeding if the page is expected to move live

## What To Watch While Running

### Admin sensors page

- latest values should count up or down
- gauge arc and needle should drift smoothly
- humidity meter should slide continuously
- charts should refresh as readings arrive

### Live predictions page

- latest prediction should update after ML completes
- trends should refresh
- history should receive the new prediction
