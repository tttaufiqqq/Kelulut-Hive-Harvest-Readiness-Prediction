# BuzzyHive 2.0 — Inspection Module

*Version: 1.0 | Date: 2026-05-01 | Status: Complete*

---

## Overview

The Inspection Module allows beekeepers to log environmental and structural observations of their kelulut hives during site visits. It supports multi-select junction data (weather conditions, flora types), full CRUD with ownership enforcement, and an admin read-only view across all beekeepers.

---

## Architecture

### Backend

| Layer | File | Responsibility |
|-------|------|----------------|
| Model | `app/Models/Inspection.php` | INSPECTION table, 4 relationships, date cast |
| Model | `app/Models/MasterWeatherCondition.php` | master_weather_conditions, inverse junction |
| Model | `app/Models/MasterFloraType.php` | master_flora_types, inverse junction |
| Request | `app/Http/Requests/Inspection/StoreInspectionRequest.php` | Beekeeper auth, all fields required, enum + junction validation |
| Request | `app/Http/Requests/Inspection/UpdateInspectionRequest.php` | Same as Store minus hive_id |
| Controller | `app/Http/Controllers/InspectionController.php` | index (paginate + hive filter), store, update, destroy |
| Controller | `app/Http/Controllers/Admin/InspectionController.php` | index only — all beekeepers |

### Routes

**`routes/web.php`** — beekeeper middleware:

```
GET    /inspections                  inspections.index
POST   /inspections                  inspections.store
PATCH  /inspections/{inspection}     inspections.update
DELETE /inspections/{inspection}     inspections.destroy
```

**`routes/admin.php`** — admin middleware:

```
GET    /admin/inspections            admin.inspections.index
```

### Junction Tables

| Table | Columns | Cascade |
|-------|---------|---------|
| `inspection_weather` | `inspection_id`, `weather_id` | Delete inspection → rows removed |
| `inspection_flora` | `inspection_id`, `flora_id` | Delete inspection → rows removed |

Foreign key column names differ from Laravel convention — explicit keys declared in all `belongsToMany()` calls.

### Junction Sync Pattern

```php
// store
$inspection = Inspection::create([...$validated, 'beekeeper_id' => auth()->id()]);
$inspection->weatherConditions()->sync($request->weather_ids ?? []);
$inspection->floraTypes()->sync($request->flora_ids ?? []);

// update
$inspection->update($validated);
$inspection->weatherConditions()->sync($request->weather_ids ?? []);
$inspection->floraTypes()->sync($request->flora_ids ?? []);
```

---

## Frontend

### Component

| File | Purpose |
|------|---------|
| `resources/js/components/core/multi-select-field.tsx` | Multi-select dropdown — portal + AnimatePresence, toggle-on-click, stays open, Check icon for selected |
| `resources/js/components/core/beekeeper-tabs.tsx` | Shared tab bar (My Hives / Harvests / Inspections) — single source of truth for all beekeeper pages |

### Types

`resources/js/types/inspection.ts`:
- `MasterWeatherCondition` — `{ id, name }`
- `MasterFloraType` — `{ id, name }`
- `Inspection` — all DB columns + optional relations (`hive`, `beekeeper`, `weather_conditions`, `flora_types`)
- `PaginatedInspections` — standard paginated wrapper

Exported from `resources/js/types/index.ts`.

### Pages

**`resources/js/pages/inspections/index.tsx`** (beekeeper):
- BeekeeperTabs with Inspections active
- Hive filter (SelectField → `router.get` with `?hive_id=`)
- Table: Hive / Date / Blooming badge / Weather pills / action Dropdown
- 4 modals: Create, View, Edit, Delete
- Create/Edit form layout: `2xl` modal, 2–3 column grid on desktop, single column on mobile
- MultiSelectField state (`createWeatherIds`, `editWeatherIds`) managed outside `useForm`, merged via `transform()` before submit

**`resources/js/pages/admin/inspections/index.tsx`** (admin):
- AdminLayout — Inspections tab in admin nav
- Stats card (total inspections)
- Read-only table: Hive / Beekeeper / Date / Blooming / Weather pills
- Pagination

### Navigation

- `authenticated-layout.tsx` — ClipboardList icon + Inspections added to beekeeper bottom nav
- `admin-layout.tsx` — Inspections tab added between Harvests and Thesis
- `beekeeper-tabs.tsx` — single shared tab bar used by dashboard, harvests, inspections

---

## Validation Rules

All fields are required on both store and update.

| Field | Rule |
|-------|------|
| `hive_id` | required, integer, exists in beekeeper's own hives |
| `inspection_date` | required, date, before_or_equal:today |
| `blooming_status` | required, in: pre_bloom, early_bloom, peak_bloom, post_bloom, dormant |
| `vegetation_density` | required, in: sparse, moderate, dense |
| `nectar_source_availability` | required, in: scarce, moderate, abundant |
| `structural_damage` | required, in: none, minor, moderate, severe |
| `food_source_observation` | required, string, max:2000 |
| `notes` | required, string, max:2000 |
| `weather_ids` | required, array, min:1 |
| `flora_ids` | required, array, min:1 |

---

## Seeded Master Data

Run via `php artisan db:seed --class=MasterDataSeeder`.

**master_weather_conditions** (7): Sunny, Cloudy, Rainy, Windy, Humid, Stormy, Foggy

**master_flora_types** (10): Gelam, Tualang, Durian, Rambutan, Longan, Kelapa, Getah (Rubber), Belimbing, Acacia, Akasia Mangium

---

## Verification

All 7 checks passed on 2026-05-01:

- [x] `php artisan route:list | grep inspection` — 5 routes confirmed
- [x] Beekeeper visits `/inspections` — empty state loads, Add button visible
- [x] Create inspection with weather + flora — record saved, table shows blooming badge + weather pills
- [x] Edit inspection, change weather selection — `inspection_weather` rows synced correctly
- [x] Delete inspection — cascade removes `inspection_weather` and `inspection_flora` rows
- [x] Admin visits `/admin/inspections` — all beekeepers' records visible
- [x] Hive filter on beekeeper page — list filters, URL updates with `?hive_id=`

---

## Commit

`37f4703` — feat: Inspection module — full-stack implementation
