# Reporting Module — BuzzyHive 2.0

## Overview

The Reporting module is split across two surfaces:

| Surface | Route | Audience | Controller |
|---------|-------|----------|------------|
| Beekeeper Reporting | `GET /reporting` | Beekeeper only | `ReportingController` |
| Admin Dashboard (M6 sections) | `GET /admin` | Admin only | `Admin\DashboardController` |

---

## Routes

```
GET /reporting          → ReportingController@index        name: reporting.index
GET /admin              → Admin\DashboardController@index  name: admin.dashboard
```

Middleware:
- `/reporting` → `auth`, `verified`, `beekeeper`
- `/admin` → `auth`, `verified`, `admin`

---

## Backend

### Admin\DashboardController

Extracted from the inline closure that previously lived in `routes/admin.php`.

**Methods:**

| Method | Description |
|--------|-------------|
| `index()` | Returns stats + liveHiveMonitor + productivityRanking + crossSiteComparison to `admin/dashboard` |
| `liveHiveMonitor()` | All hives with latest sensor_log + latest prediction per hive (3 queries) |
| `productivityRanking()` | Hives ordered by `SUM(harvests.weight) DESC` |
| `crossSiteComparison()` | Raw join: hives + master_sites + hri_summary + harvests, grouped by site |
| `deriveStatus()` | Maps `PREDICTION.readiness_level` → `HiveData.status` string |

**Status derivation:**
```
'Ready to Harvest' → 'ready'
'Nearly Ready'     → 'growing'
'Approaching'      → 'growing'
'Not Ready'        → 'alert'
null               → 'offline'
```

### ReportingController

**Methods:**

| Method | Description |
|--------|-------------|
| `index()` | Returns hriGauges + readinessTrends to `reporting` |
| `hriGauges()` | Latest PREDICTION per beekeeper hive via sensor_logs join |
| `readinessTrends()` | HRI_SUMMARY 30-day window, scoped to beekeeper's hive IDs |

---

## Prop Shapes

### Admin Dashboard (`admin/dashboard`)

```ts
stats: { total: number; pending: number; active: number }

hives: HiveData[]
// HiveData = { id, beekeeper, species, weight, temp, humidity, co2, readiness, status }

productivityRanking: Array<{
    hive_name: string;
    beekeeper: string;
    total_weight: number;   // kg, sum of all harvests
    harvest_count: number;
}>

crossSiteComparison: Array<{
    site_name: string;
    avg_hri_pct: number;    // AVG(hri_summary.avg_hri_value) * 100
    total_weight: number;   // SUM(harvests.weight)
    hive_count: number;
}>
```

### Beekeeper Reporting (`reporting`)

```ts
hriGauges: Array<{
    hive_id: number;
    hive_name: string;
    site_name: string | null;
    readiness_level: string | null;   // raw PREDICTION.readiness_level
    hri_value: number | null;         // 0.25 / 0.50 / 0.75 / 1.00
    confidence_pct: number | null;    // confidence_score * 100, rounded
}>

readinessTrends: Array<{
    hive_id: number;
    hive_name: string;
    date: string;           // 'May 01' format
    avg_hri_pct: number;    // avg_hri_value * 100, rounded
}>
```

---

## Frontend

### Admin Dashboard (`resources/js/pages/admin/dashboard.tsx`)

- Action cards: alertCount + readyCount derived from `hives` prop (no longer from mock)
- Live Hive Monitor: real hives, empty state if none
- P6.3 ProductivityRankingChart: horizontal BarChart (Recharts), layout=vertical, amber fill
- P6.4 CrossSiteChart: grouped BarChart, dual Y-axis (HRI % left, harvest kg right)
- Charts rendered only after `mounted=true` (SSR-safe)

### Beekeeper Reporting (`resources/js/pages/reporting.tsx`)

- P6.1 HriGaugeGrid: card per hive, readiness badge + confidence progress bar
- P6.2 ReadinessTrendChart: AreaChart (30-day), hive selector `<select>` when >1 hive
- Charts rendered only after `mounted=true` (SSR-safe)

**Badge colors:**
```
Not Ready        → red-100 / red-800
Approaching      → yellow-100 / yellow-800
Nearly Ready     → amber-100 / amber-800
Ready to Harvest → green-100 / green-800
```

---

## Tests

| File | Tests | Coverage |
|------|-------|----------|
| `tests/Feature/ReportingTest.php` | 5 | guest redirect, beekeeper 200, admin blocked, props shape, own-hive scoping |
| `tests/Feature/Admin/DashboardTest.php` | 5 | admin 200, beekeeper blocked, guest blocked, props shape, real hive count |

Total suite: 102 tests, 334 assertions — all passing.

---

## Notes

- `co2` in HiveData is mapped from `mq135_value` (MQ135 = VOC/CO₂ sensor). Column header changed from "CO₂" to "MQ135" in the table.
- `weight` in HiveData is `SUM(harvests.weight)` — total lifetime harvest weight per hive.
- `MOCK_HIVES` and `MOCK_ACTIVITY` constants removed from admin dashboard after M6 wiring.
- No new admin tab added — M6 sections append below Live Hive Monitor in the existing `/admin` page.
