# UX Nav Fixes — BuzzyHive 2.0

## Overview

Post-M6 UX polish pass. Two gaps identified after the Reporting module merge:

1. Beekeeper desktop navigation — `/reporting` was unreachable on desktop (bottom nav is `md:hidden`)
2. Admin action cards — Need Attention and Ready to Harvest were not clickable

---

## Changes

### Beekeeper Tab Bar (`BeekeeperTabs`)

**File:** `resources/js/components/core/beekeeper-tabs.tsx`

Added `Reporting` as the fourth tab. Active prop type updated to include `'reporting'`.

| Tab | Route |
|-----|-------|
| My Hives | `/dashboard` |
| Harvests | `/harvests` |
| Inspections | `/inspections` |
| Reporting | `/reporting` |

`BeekeeperTabs` is used in:
- `pages/dashboard.tsx` → `active="dashboard"`
- `pages/harvests/index.tsx` → `active="harvests"`
- `pages/inspections/index.tsx` → `active="inspections"`
- `pages/reporting.tsx` → `active="reporting"` (newly added)

---

### Admin Action Card Navigation

**File:** `resources/js/pages/admin/dashboard.tsx`

All three action cards now navigate on click:

| Card | Destination | Route name |
|------|-------------|------------|
| Need Attention | `/admin/sensors` | `admin.sensors.index` |
| Ready to Harvest | `/admin/sensors` | `admin.sensors.index` |
| Pending Invites | `/admin/beekeepers` | `admin.beekeepers.index` |

Note: Ready to Harvest routes to the sensor dashboard (not harvest history) — the sensor page shows live hive status including which hives are ready, which is the actionable destination.

Mobile fix: action card grid changed from `grid-cols-3` to `grid-cols-1 sm:grid-cols-3` to prevent overflow on small screens.

---

### Breadcrumb Fixes

**Reporting page** (`pages/reporting.tsx`): added `Home` as parent crumb.
```
Home / Reporting
```

**Analytics page** (`pages/analytics.tsx`): replaced raw hive ID with hive name in crumb trail.
```
My Hives / [Hive Name] / Analytics
```

---

### Reporting Page — Readiness Label Fix

**File:** `resources/js/pages/reporting.tsx`

Backend returns `readiness_level` as snake_case. Added `READINESS_LABEL` map to convert before display:

| Raw value | Display label |
|-----------|---------------|
| `not_ready` | Not Ready |
| `approaching` | Approaching |
| `nearly_ready` | Nearly Ready |
| `ready` | Ready to Harvest |

`BADGE_CLASS` keys also updated to snake_case to match.

---

## Files Modified

| File | Change |
|------|--------|
| `resources/js/components/core/beekeeper-tabs.tsx` | Added Reporting tab, updated active type |
| `resources/js/pages/reporting.tsx` | Added BeekeeperTabs, breadcrumb parent, readiness label map |
| `resources/js/pages/analytics.tsx` | Breadcrumb uses hive name instead of hive ID |
| `resources/js/pages/admin/dashboard.tsx` | Action card onClick + mobile grid fix |
| `resources/js/layouts/authenticated-layout.tsx` | Removed layout-level desktop tab bar (nav moved to BeekeeperTabs) |

No new routes, controllers, migrations, or tests.
