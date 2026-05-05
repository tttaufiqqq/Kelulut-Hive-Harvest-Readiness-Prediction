# BuzzyHive Realtime Broadcasting Rollout

Reference note for the local Pusher-based realtime implementation that replaced polling on the admin sensors page and the live predictions page.

## What Changed

### Broadcast foundation

- `resources/js/app.tsx`
  - Echo is configured explicitly for Pusher using `VITE_PUSHER_*` environment variables.
  - If the frontend build does not have the required Pusher values, Echo falls back to a null broadcaster instead of crashing.
- `.env.example`
  - Added `PUSHER_*` and `VITE_PUSHER_*` variables required for local and production realtime setup.
- `README.md`
  - Added local environment notes for broadcasting configuration.
- `docs/cicd-pipeline.md`
  - Documented the split between server runtime `PUSHER_*` values and GitHub Actions build-time `VITE_PUSHER_*` values.

### Secure private channels

- `routes/channels.php`
  - Added private channel authorization for:
    - `hive.{hiveId}.sensors`
    - `hive.{hiveId}.predictions`
  - Access rules:
    - admins can subscribe to any hive
    - beekeepers can subscribe only to their own hives
- `app/Models/User.php`
  - Added `hives()` relationship for efficient ownership checks.

### Broadcast events

- `app/Events/SensorReadingCreated.php`
  - Broadcasts immediately on `private-hive.{hiveId}.sensors`
  - Event name: `sensor.reading.created`
- `app/Events/PredictionCreated.php`
  - Broadcasts immediately on `private-hive.{hiveId}.predictions`
  - Event name: `prediction.created`
- Payloads are intentionally small:
  - hive id
  - record id
  - timestamp

### Backend dispatch points

- `app/Http/Controllers/SensorController.php`
  - dispatches `SensorReadingCreated` immediately after the sensor log is stored
- `app/Services/MlPredictionService.php`
  - dispatches `PredictionCreated` immediately after the prediction is stored

### Frontend realtime pages

- `resources/js/pages/admin/sensors.tsx`
  - removed interval polling
  - subscribes to `hive.{selectedHiveId}.sensors`
  - reloads only `latest`, `history`, and `last_seen`
  - preserves UI state via `router.reload`
  - guards against duplicate reloads while Inertia navigation is already in progress
  - improved the display so numbers count up or down and gauges drift smoothly instead of fading
- `resources/js/pages/predictions.tsx`
  - removed interval polling
  - subscribes to `hive.{hiveId}.predictions`
  - reloads only `latestPrediction`, `predictionTrends`, and `historyPredictions`
  - keeps the open history modal anchored by prediction id instead of array index

### Tests and verification

- `tests/Feature/PredictionTest.php`
  - updated to match the current Inertia response contract:
    - `latestPrediction`
    - `historyPredictions`
    - `predictionTrends`
- Verified locally:
  - `npm run lint:check`
  - `npm run types:check`
  - `./vendor/bin/pest`

## Local Runtime Notes

### Required services

For a full local realtime pass, run:

1. Laravel app
2. Vite dev server
3. Flask ML API
4. Optional queue worker for queued jobs such as Telegram alerts

### PHP CA bundle issue

Local PHP was previously pointing to an invalid CA certificate path from another project, which broke outbound HTTPS requests to Pusher and Telegram.

Local fix applied outside the repo:

- `C:\php-8.3.12\php.ini`
  - `curl.cainfo = C:\php-8.3.12\extras\ssl\cacert.pem`
  - `openssl.cafile = C:\php-8.3.12\extras\ssl\cacert.pem`

Important:

- restart `php artisan serve` after changing `php.ini`
- otherwise the old PHP process continues using stale certificate settings

## Manual Verification Checklist

### Sensor ingestion

- send `POST /api/sensor-data`
- confirm the response is `201` with `{"status":"ok"}`
- confirm `sensor_logs` receives new rows

### Broadcast auth

- open browser devtools
- check `POST /broadcasting/auth`
- confirm it returns `200`
- confirm it does not throw `500` or `403`

### Admin sensors page

- open `/admin/sensors`
- keep one hive selected
- send multiple sensor payloads
- confirm:
  - latest numbers change
  - charts refresh
  - `last_seen` updates
  - number displays count toward the new reading
  - gauge arc and needle drift smoothly

### Live predictions page

- open `/hives/{hive}/predictions/live`
- send multiple sensor payloads
- confirm:
  - latest prediction changes
  - trend charts refresh
  - history updates
  - open prediction detail modal remains stable when new data arrives

## Operational Note

When no page is open:

- the backend still stores the reading
- still calls the ML service
- still sends the broadcast event to Pusher

When a realtime page is open:

- all of the above still happens
- plus the browser remains subscribed
- plus the page issues partial Inertia reloads after each event

This means the heavier load happens while viewers are actively connected, not from idle pages that are closed.
