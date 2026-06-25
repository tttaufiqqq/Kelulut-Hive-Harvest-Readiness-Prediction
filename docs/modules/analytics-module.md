# BuzzyHive 2.0 — Analytics Module (M4)

*Version: 1.0 | Date: 2026-05-02 | Status: Complete*

---

## Overview

The Analytics Module provides beekeepers with a per-hive intelligence dashboard. It aggregates sensor readings, ML predictions, HRI trends, and harvest records into a single read-only view. Access is strictly scoped — a beekeeper can only view analytics for hives assigned to them (403 on foreign hive IDs). The module covers DFD process P7 (Dashboard/Reports) and consists of one controller, one page, and four feature tests. Full suite: 168 tests — all pass.

---

## Flow of Events

### P7 — View Hive Analytics (Beekeeper)

Beekeeper clicks the Analytics button on the dashboard hive detail panel. The controller runs five queries in sequence and returns an Inertia page with all props populated.

```
GET /hives/{hive}/analytics → AnalyticsController::show()
→ abort_if(hive->beekeeper_id !== auth()->id(), 403)
→ Q1: HRI trend — Prediction JOIN sensor_logs, last 30 days, grouped by date (avg hri_value per day)
→ Q2: Sensor readings — SensorLog, today only, grouped by hour (avg per sensor per hour)
→ Q3: Latest prediction — most recent Prediction row for this hive
→ Q4: Harvest history — all Harvest rows for this hive, desc order
→ Q5: Hive summary — HriSummary row + total harvest count + last harvest date
→ Inertia::render('analytics', [hive, hriTrend, sensorReadings, latestPrediction, harvestHistory])
```

### Navigation

Beekeeper enters the analytics page from the dashboard hive detail panel (Analytics button). The page has a back button (circular amber `ArrowLeft`) and a breadcrumb trail:

```
Home / My Hives / {hive.id} / Analytics
```

Back button navigates to `/dashboard`.

---

## Architecture

### Backend

| Layer | File | Responsibility |
|-------|------|----------------|
| Controller | `app/Http/Controllers/AnalyticsController.php` | Single `show()` method — 5 queries, 403 guard, Inertia render |
| Model (read) | `app/Models/Prediction.php` | HRI trend + latest prediction queries |
| Model (read) | `app/Models/SensorLog.php` | Hourly sensor averages (SQLite/MySQL dual expr) |
| Model (read) | `app/Models/Harvest.php` | Harvest history + count + last date |
| Model (read) | `app/Models/HriSummary.php` (via `$hive->summary`) | Avg HRI value, latest readiness level |

No form requests — the module is entirely read-only.

### Query Detail

**Q1 — HRI Trend (30 days)**

Joins `predictions` → `sensor_logs` on `sensor_log_id`, filters by `hive_id` and `prediction_timestamp >= now()-30d`. Groups by `DATE(prediction_timestamp)`, returns `date`, `hri_score` (avg * 100, rounded), and `avg_7d` (flat 7-day average appended to every row for the dashed reference line).

**Q2 — Sensor Readings (today)**

Filters `sensor_logs` by `hive_id` and `whereDate(today)`. Groups by hour using a driver-aware expression (`DATE_FORMAT` for MySQL, `strftime` for SQLite). Returns `time`, `temp`, `humidity`, `mq2`, `mq3`, `mq5`, `mq135`.

**Q3 — Latest Prediction**

Joins `predictions` → `sensor_logs`, orders by `prediction_timestamp DESC`, takes first row. Returns `readiness_level`, `hri_value`, `confidence_score`, `prediction_timestamp` (formatted `d M Y, H:i`).

**Q4 — Harvest History**

All `Harvest` rows for the hive with `color` and `flavor` relations eager-loaded. Returns `date` (formatted `M d`), `weight`, `color`, `flavor`.

**Q5 — Hive Summary**

Reads `HriSummary` via `$hive->summary` eager relation. Computes `avg_hri_pct`, `avg_hri_7d_pct`, `total_harvests`, `last_harvest_date`.

### Frontend

| File | Responsibility |
|------|----------------|
| `resources/js/pages/analytics.tsx` | Full analytics page — 5 sub-components, breadcrumb, back button |
| `resources/js/pages/dashboard.tsx` | Hive list + detail panel — links to analytics, shows readiness summary |

### analytics.tsx Sub-components

| Component | Chart Type | Data Source |
|-----------|------------|-------------|
| `HriScoreCard` | Stat card | `hive.avg_hri_pct`, `hive.avg_hri_7d_pct`, `hive.latest_readiness_level` |
| `HriTrendChart` | AreaChart + dashed Line | `hriTrend[]` — 30-day daily HRI + 7d avg reference |
| `SensorChart` | LineChart (6 series) | `sensorReadings[]` — temp, humidity, mq2, mq3, mq5, mq135 per hour |
| `LatestPredictionCard` | Stat card + progress bar | `latestPrediction` — readiness label, confidence %, HRI value, timestamp |
| `HarvestBar` | BarChart | `harvestHistory[]` — harvest weight per date |

All `ResponsiveContainer` instances use `minWidth={0}` to suppress the Recharts dimension warning during Inertia page swaps.

### Readiness Label Maps

Both `analytics.tsx` and `dashboard.tsx` use the same snake_case → human-readable map. The DB stores `not_ready`, `approaching`, `nearly_ready`, `ready` — the UI displays "Not Ready", "Approaching", "Nearly Ready", "Ready to Harvest".

```ts
const READINESS_LABELS: Record<string, string> = {
    not_ready:    'Not Ready',
    approaching:  'Approaching',
    nearly_ready: 'Nearly Ready',
    ready:        'Ready to Harvest',
};
```

### Tables (read-only)

| Table | Used for |
|-------|----------|
| `predictions` | HRI trend, latest prediction |
| `sensor_logs` | Hourly sensor averages |
| `hri_summary` | Avg HRI, readiness level |
| `harvests` | Harvest history, count, last date |
| `master_honey_colors` | Color name on harvest records |
| `master_honey_flavors` | Flavor name on harvest records |

---

## Route Map

| Method | URI | Controller | Middleware |
|--------|-----|------------|------------|
| GET | `/hives/{hive}/analytics` | `AnalyticsController::show` | `auth`, `verified`, `beekeeper` |

---

## Dashboard Enhancements (shipped with M4)

Changes made to `dashboard.tsx` and `DashboardController` as part of completing the analytics integration:

| Item | Change |
|------|--------|
| Readiness enum display | `not_ready` → "Not Ready" — `READINESS_LABELS` map added, applied to hero badge and `ReadinessBadge` component |
| Auto-select first hive | `useState(null)` → `useState(() => hives[0] ?? null)` — panel loads immediately |
| Latest Prediction card | Enriched with "Full Analytics" `Link` button — no longer a redundant badge repeat |
| MQ2 unit label | `250` → `250 ADC` — raw ADC value now labelled for context |

---

## Tests

### Analytics (`tests/Feature/AnalyticsTest.php`)

| # | Test | Assertion |
|---|------|-----------|
| 1 | Beekeeper can view analytics for own hive | 200 |
| 2 | Beekeeper cannot view analytics for another beekeeper's hive | 403 |
| 3 | Admin cannot access beekeeper analytics route | redirect |
| 4 | Analytics response contains correct Inertia props | `hive`, `hriTrend`, `sensorReadings`, `latestPrediction`, `harvestHistory` all present |

**4 tests — all pass. Full suite (168 tests / 842 assertions) — all pass.**

```bash
php artisan test tests/Feature/AnalyticsTest.php
php artisan test
```

---

## DFD Reference

Implements **P7 — Dashboard/Reports** from `BuzzyHive-2.0-DFD-L0-Context.drawio`.

Data stores read: D3 (PREDICTION), D4 (SENSOR_LOG), D5 (HRI_SUMMARY), D6 (HARVEST).
No writes — this process is pure read/aggregate.
