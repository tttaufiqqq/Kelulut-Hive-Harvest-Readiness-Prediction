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

Thin controller. All business logic extracted to `app/Services/Admin/DashboardDataService.php`.

**Methods:**

| Method | Description |
|--------|-------------|
| `index()` | Stats + delegates to `DashboardDataService::execute()` → returns hives, productivityRanking, crossSiteComparison, fleetHriTrend to `admin/dashboard` |
| `readinessSnapshot()` | JSON endpoint — readiness distribution counts for a given date (used by fleet donut date picker) |
| `hiveMonitorSnapshot()` | JSON endpoint — full HiveData array for a given date (used by live hive monitor date picker) |

### DashboardDataService

`app/Services/Admin/DashboardDataService.php`

**Prediction lookup (critical):** Uses `MAX(predictions.id)` per hive per date, keyed by `hive_id` — not `MAX(sensor_log_id)`. This ensures the latest prediction is found even when the IoT device sends new unpredicted sensor logs after the prediction was stored (which would advance `MAX(sensor_log_id)` past the predicted log).

**Status derivation priority (in order):**

```
no sensor log today                            → 'no_data'
prediction.readiness_level === 'ready'         → 'ready'   ← takes priority over alerts
hive has threshold violations today            → 'alert'
prediction exists (non-ready)                  → 'growing'
no prediction                                  → 'offline'
```

`'ready'` takes priority over threshold alerts because a hive can simultaneously breach a sensor threshold AND be classified as ready for harvest. Alerts still appear in the "Need Attention" counter on the admin dashboard, so they are not suppressed — only the hive's individual status card shows 'ready' instead of 'alert'.

**Productivity ranking:** `vw_harvest_summary_per_hive` view, ordered by `total_weight * total_harvests` DESC.

**Cross-site comparison:** Joins hives + master_sites + hri_summary + harvests, grouped by site, returning avg HRI %, total weight, hive count.

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
// HiveData = {
//   id, hive_name, beekeeper, species,
//   weight,       // total lifetime harvest weight (kg)
//   temp,         // latest sensor reading for target date (°C)
//   humidity,     // latest sensor reading for target date (%)
//   co2,          // mq135_value from latest sensor reading
//   mq2, mq3, mq5,
//   readiness,    // confidence_score * 100 (integer %)
//   status,       // 'no_data' | 'ready' | 'alert' | 'growing' | 'offline'
//   last_reading, // ISO8601 timestamp of the most recent sensor log ever
// }

productivityRanking: Array<{
    hive_name: string;
    beekeeper: string;
    total_weight: number;   // kg, sum of all harvests
    harvest_count: number;
}>

crossSiteComparison: Array<{
    site_name: string;
    avg_hri_pct: number;    // AVG(hri_summary.avg_hri_value) * 100
    total_weight: number;   // SUM(harvests.weight) in kg
    hive_count: number;
}>

fleetHriTrend: FleetTrendItem[]  // 30-day daily HRI trend across all hives
```

### Beekeeper Reporting (`reporting`)

```ts
hriGauges: Array<{
    hive_id: number;
    hive_name: string;
    site_name: string | null;
    readiness_level: string | null;   // raw PREDICTION.readiness_level
    hri_value: number | null;         // continuous 0–1 from ML API
    confidence_pct: number | null;    // confidence_score * 100, rounded
}>

readinessTrends: Array<{
    hive_id: number;
    hive_name: string;
    date: string;           // 'May 01' format
    avg_hri_pct: number;    // avg_hri_value * 100, rounded
}>
```

### Beekeeper Dashboard (`dashboard`)

The beekeeper My Hives page uses `DashboardController::index()`. It also queries `MAX(predictions.id)` per hive today to get the `hri_value` from the same prediction as the badge's `readiness_level`. This prevents the 25% / "Ready to Harvest" contradiction that arises when the badge comes from `latest_readiness_level` (latest prediction) but the % comes from `avg_hri_value` (daily average across all predictions).

```ts
// hive prop on /dashboard includes:
hri_value:       // latest today's prediction hri_value (falls back to avg_hri_value if no today prediction)
readiness_level: // hri_summary.latest_readiness_level (most recent prediction label)
```

---

## Frontend

### Admin Dashboard (`resources/js/pages/admin/dashboard.tsx`)

- **Action cards:** "Need Attention" and "Ready to Harvest" cards open the `HiveMonitorModal` for the first matching hive (not a route navigation). Clicking "Need Attention" jumps to the first `status === 'alert'` hive; "Ready to Harvest" jumps to the first `status === 'ready'` hive.
- **Live Hive Monitor:** real hives, sorted by readiness %, supports date picker for historical view
- **Fleet Readiness donut:** date-switchable — fetches from `/admin/dashboard/readiness-snapshot?date=` on date change
- **P6.3 ProductivityRankingTable:** data from `vw_harvest_summary_per_hive` view
- **P6.4 CrossSiteComparisonChart:** grouped BarChart, dual Y-axis (HRI % left, harvest kg right)
- **FleetHriLineChart:** 30-day fleet-wide HRI trend
- Charts rendered only after `mounted=true` (SSR-safe)
- `admin/dashboard.tsx` is split into sub-components under `resources/js/pages/admin/dashboard/`

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

Total suite: 168 tests, 842 assertions — all passing.

---

## Notes

- `co2` in HiveData is mapped from `mq135_value` (MQ135 = VOC/CO₂ sensor).
- `weight` in HiveData is `SUM(harvests.weight)` — total lifetime harvest weight per hive (kg).
- `MOCK_HIVES` and `MOCK_ACTIVITY` constants removed from admin dashboard after M6 wiring.
- No new admin tab added — M6 sections append below Live Hive Monitor in the existing `/admin` page.
- `readiness` in HiveData is `confidence_score * 100` (integer %) — not hri_value. It is used as the sort key for `sortedHives` on the frontend.
- Status `'no_data'` is distinct from `'offline'`: `no_data` means no sensor log exists for the selected date; `offline` means a sensor log exists but no prediction has been made yet.
- The admin "Need Attention" and "Ready to Harvest" counts always read from the live `hives` prop (server-rendered) regardless of which date the monitor date picker is set to.
