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
