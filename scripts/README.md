# Sensor Simulation Scripts

This folder contains local PowerShell helpers for simulating sensor traffic against:

- `POST http://127.0.0.1:8000/api/sensor-data`

They are meant for local realtime testing while the admin sensors page and live predictions page are open.

## Files

- `send-sensor-intervals.ps1`
  - replays a fixed sequence of payloads
  - useful when you want a predictable timeline
- `send-sensor-drift.ps1`
  - generates a random walk around a starting value
  - useful when you want the page to behave like a live drifting sensor
- `sensor-payloads.sample.json`
  - sample payload timeline for the fixed-sequence script

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
