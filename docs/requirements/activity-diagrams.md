# BuzzyHive 2.0 — Activity Diagrams

*Version: 1.0 | Date: 2026-04-29*

---

## Diagram 1: ESP32 Sensor Ingestion + ML Prediction

**Actors/Swimlanes:** ESP32 | SensorController | MlPredictionService | Flask ML | Telegram Bot

```
ESP32                  SensorController           MlPredictionService       Flask ML        Telegram Bot
  |                           |                           |                     |                  |
  |                           |                           |                     |                  |
  |--POST /api/sensor-data--->|                           |                     |                  |
  |   (X-API-Key header)      |                           |                     |                  |
  |                           |                           |                     |                  |
  |                     [Check X-API-Key]                 |                     |                  |
  |                           |                           |                     |                  |
  |                     [Invalid key?]                    |                     |                  |
  |<------401 Unauthorized----|                           |                     |                  |
  |                           |                           |                     |                  |
  |                     [Valid key]                       |                     |                  |
  |                           |                           |                     |                  |
  |                     [Validate payload]                |                     |                  |
  |                     (temp, humidity,                  |                     |                  |
  |                      mq2/3/5/135 ranges)              |                     |                  |
  |                           |                           |                     |                  |
  |                     [Validation fails?]               |                     |                  |
  |<------422 Unprocessable---|                           |                     |                  |
  |                           |                           |                     |                  |
  |                     [Valid payload]                   |                     |                  |
  |                           |                           |                     |                  |
  |                     [Resolve IoT node]                |                     |                  |
  |                     (device_id + hive_id,             |                     |                  |
  |                      status = active)                 |                     |                  |
  |                           |                           |                     |                  |
  |                     [Node not found?]                 |                     |                  |
  |<------404 Not Found-------|                           |                     |                  |
  |                           |                           |                     |                  |
  |                     [Node found]                      |                     |                  |
  |                           |                           |                     |                  |
  |                     [SensorLog::create()]             |                     |                  |
  |                     (store all 6 readings             |                     |                  |
  |                      + recorded_at = now())           |                     |                  |
  |                           |                           |                     |                  |
  |<------201 { status: ok }--|                           |                     |                  |
  |                           |                           |                     |                  |
  |                     [Call predict($log)]------------->|                     |                  |
  |                           |                           |                     |                  |
  |                           |                     [POST /predict]----------->|                  |
  |                           |                     (mq2/3/5/135,              |                  |
  |                           |                      temp, humidity)           |                  |
  |                           |                           |                     |                  |
  |                           |                     [Flask unavailable?]       |                  |
  |                           |                           |                     |                  |
  |                           |                     [Log::warning()]           |                  |
  |                           |                     [return null]              |                  |
  |                           |                           |  (silent skip)      |                  |
  |                           |                           |                     |                  |
  |                           |                     [Flask responds OK]        |                  |
  |                           |                           |<---{ readiness_level, hri_value,       |
  |                           |                           |     confidence_score }                 |
  |                           |                           |                     |                  |
  |                           |                     [Prediction::create()]     |                  |
  |                           |                     (store prediction record)  |                  |
  |                           |                           |                     |                  |
  |                           |                     [readiness_level = ready?] |                  |
  |                           |                           |                     |                  |
  |                           |                     [Yes: send Telegram]-------------------------------->|
  |                           |                     (hive name, level,         |                  |      |
  |                           |                      confidence, timestamp)    |                  | [Alert sent]
  |                           |                           |                     |                  |
  |                           |                     [No: end]                  |                  |
  |                           |                           |                     |                  |
(end)                        (end)                      (end)                 (end)             (end)
```

---

## Diagram 2: Beekeeper Onboarding (Invite Flow)

**Actors/Swimlanes:** Admin | BeekeeperController | Email Service | Beekeeper | AcceptInviteController

```
Admin               BeekeeperController          Email Service      Beekeeper      AcceptInviteController
  |                         |                          |                |                    |
  |--POST /admin/beekeepers>|                          |                |                    |
  |  (name, email, phone)   |                          |                |                    |
  |                         |                          |                |                    |
  |                   [Validate input]                 |                |                    |
  |                   (name, email, phone required)    |                |                    |
  |                         |                          |                |                    |
  |                   [Validation fails?]              |                |                    |
  |<------422 Unprocessable-|                          |                |                    |
  |                         |                          |                |                    |
  |                   [Valid input]                    |                |                    |
  |                         |                          |                |                    |
  |                   [User::create()]                 |                |                    |
  |                   (status = pending,               |                |                    |
  |                    no password set)                |                |                    |
  |                         |                          |                |                    |
  |                   [Assign beekeeper role]          |                |                    |
  |                   (via Spatie Permission)          |                |                    |
  |                         |                          |                |                    |
  |                   [Generate signed URL]            |                |                    |
  |                   (/invite/accept/{user}           |                |                    |
  |                    expires in 7 days)              |                |                    |
  |                         |                          |                |                    |
  |                   [Send invite email]------------->|                |                    |
  |<------201 Created-------|                          |--invite link-->|                    |
  |                         |                          |                |                    |
  |                         |                          |          [Click invite link]         |
  |                         |                          |                |--GET /invite/accept>|
  |                         |                          |                |                    |
  |                         |                          |          [Check: URL expired?]       |
  |                         |                          |                |<------403 Forbidden-|
  |                         |                          |                |                    |
  |                         |                          |          [URL valid]                 |
  |                         |                          |                |                    |
  |                         |                          |          [Check: status = pending?]  |
  |                         |                          |                |<------403 Forbidden-|
  |                         |                          |                | (already accepted)  |
  |                         |                          |                |                    |
  |                         |                          |          [Show password setup form]  |
  |                         |                          |                |<-----render form----|
  |                         |                          |                |                    |
  |                         |                          |          [Submit password]           |
  |                         |                          |                |--POST /invite/accept>|
  |                         |                          |                |                    |
  |                         |                          |          [Validate password]         |
  |                         |                          |                | (min 8 chars,       |
  |                         |                          |                |  confirmed)         |
  |                         |                          |                |                    |
  |                         |                          |          [Set password (hashed)]     |
  |                         |                          |          [status = active]           |
  |                         |                          |          [email_verified_at = now()] |
  |                         |                          |          [Login user]                |
  |                         |                          |                |<--redirect /dashboard|
  |                         |                          |                |                    |
(end)                      (end)                     (end)           (arrives at dashboard) (end)
```

---

## Diagram 3: Harvest Recording

**Actors/Swimlanes:** Beekeeper | HarvestController | DB (harvests) | DB (hive_summary)

```
Beekeeper            HarvestController          DB: harvests          DB: hive_summary
    |                        |                        |                       |
    |--POST /hives/{id}/harvests->|                   |                       |
    |  (date, weight,         |                        |                       |
    |   color_id, flavor_id,  |                        |                       |
    |   productivity_level,   |                        |                       |
    |   notes)                |                        |                       |
    |                         |                        |                       |
    |                   [Authorize: owns hive?]        |                       |
    |<------403 Forbidden-----|                        |                       |
    |                         |                        |                       |
    |                   [Validate input]               |                       |
    |                   (date, weight required;        |                       |
    |                    color_id, flavor_id           |                       |
    |                    must exist in master tables)  |                       |
    |<------422 Unprocessable-|                        |                       |
    |                         |                        |                       |
    |                   [Valid input]                  |                       |
    |                         |                        |                       |
    |                   [Harvest::create()]----------->|                       |
    |                   (hive_id, beekeeper_id,        |                       |
    |                    harvest_date, weight,         |                       |
    |                    color_id, flavor_id,          |                       |
    |                    productivity_level, notes)    |                       |
    |                         |<--harvest saved--------|                       |
    |                         |                        |                       |
    |                   [Update HiveSummary]---------------------------------->|
    |                   (last_harvest_date = today,    |                       |
    |                    total_harvests += 1)          |                       |
    |                         |                        |               [Summary updated]
    |<------201 Created-------|                        |                       |
    |                         |                        |                       |
  (end)                      (end)                   (end)                   (end)
```

---

## Diagram 4: Inspection Logging

**Actors/Swimlanes:** Beekeeper | InspectionController | DB (inspections) | DB (junction tables)

```
Beekeeper            InspectionController       DB: inspections      DB: junctions
    |                        |                        |               (weather + flora)
    |--POST /hives/{id}/inspections->|               |                       |
    |  (date, notes,          |                        |                       |
    |   blooming_status,      |                        |                       |
    |   vegetation_density,   |                        |                       |
    |   nectar_source,        |                        |                       |
    |   structural_damage,    |                        |                       |
    |   food_source,          |                        |                       |
    |   weather_ids[],        |                        |                       |
    |   flora_ids[])          |                        |                       |
    |                         |                        |                       |
    |                   [Authorize: owns hive?]        |                       |
    |<------403 Forbidden-----|                        |                       |
    |                         |                        |                       |
    |                   [Validate input]               |                       |
    |                   (date required;                |                       |
    |                    weather_ids must exist        |                       |
    |                    in master_weather_conditions; |                       |
    |                    flora_ids must exist          |                       |
    |                    in master_flora_types)        |                       |
    |<------422 Unprocessable-|                        |                       |
    |                         |                        |                       |
    |                   [Valid input]                  |                       |
    |                         |                        |                       |
    |                   [Inspection::create()]-------->|                       |
    |                   (hive_id, beekeeper_id,        |                       |
    |                    all observation fields)       |                       |
    |                         |<--inspection saved-----|                       |
    |                         |                        |                       |
    |                   [Write weather junctions]-------------------------------->|
    |                   (inspection_id + each          |                       |
    |                    weather_condition_id)         |               [Junction rows written]
    |                         |                        |                       |
    |                   [Write flora junctions]--------------------------------->|
    |                   (inspection_id + each          |                       |
    |                    flora_type_id)               |               [Junction rows written]
    |                         |                        |                       |
    |<------201 Created-------|                        |                       |
    |                         |                        |                       |
  (end)                      (end)                   (end)                   (end)
```

---

## Diagram 5: Analytics Viewing

**Actors/Swimlanes:** Beekeeper | AnalyticsController | Database | React (analytics.tsx)

```
Beekeeper            AnalyticsController              Database               React analytics.tsx
    |                        |                             |                          |
    |--GET /hives/{id}/analytics->|                        |                          |
    |                         |                             |                          |
    |                   [Authorize: owns hive?]             |                          |
    |<------403 Forbidden-----|                             |                          |
    |                         |                             |                          |
    |                   [Hive exists?]                      |                          |
    |<------404 Not Found-----|                             |                          |
    |                         |                             |                          |
    |                   [Execute 5 queries in parallel]     |                          |
    |                         |                             |                          |
    |                         |--Q1: HRI trend (30d)------->|                          |
    |                         |    (predictions grouped     |                          |
    |                         |     by day, last 30 days,   |                          |
    |                         |     7-day rolling avg)      |                          |
    |                         |                             |                          |
    |                         |--Q2: Hourly sensors (today)->|                         |
    |                         |    (sensor_logs grouped     |                          |
    |                         |     by hour, today only,    |                          |
    |                         |     all 6 sensor cols)      |                          |
    |                         |                             |                          |
    |                         |--Q3: Score components------>|                          |
    |                         |    (latest prediction       |                          |
    |                         |     readiness breakdown)    |                          |
    |                         |                             |                          |
    |                         |--Q4: Harvest history------->|                          |
    |                         |    (all harvests ordered    |                          |
    |                         |     by date DESC)           |                          |
    |                         |                             |                          |
    |                         |--Q5: Hive summary---------->|                          |
    |                         |    (latest_readiness,       |                          |
    |                         |     avg_hri_7d/30d,         |                          |
    |                         |     last_harvest, total)    |                          |
    |                         |                             |                          |
    |                         |<--all results---------------|                          |
    |                         |                             |                          |
    |                   [Inertia::render()]                 |                          |
    |                   (pass all data as props)            |                          |
    |                         |------------------------------------------------->|    |
    |                         |                             |             [Render HRI trend chart]
    |                         |                             |             [Render hourly sensor chart]
    |                         |                             |             [Render score components]
    |                         |                             |             [Render harvest table]
    |                         |                             |             [Render hive summary card]
    |<--page displayed--------|                             |                          |
    |                         |                             |                          |
  (end)                      (end)                        (end)                      (end)
```
