# BuzzyHive 2.0 — Hive Management Module (M3)

*Version: 1.0 | Date: 2026-05-01 | Status: Complete*

---

## Overview

The Hive Management Module transfers hive ownership from beekeepers to admins. Previously beekeepers could create, edit, and delete their own hives. M3 enforces the correct role model: admins register and manage hives, beekeepers monitor assigned hives read-only. The module covers two DFD processes — P3.1 Register Hive and P3.2 Update Hive Identity — plus admin-managed Sites (master_sites CRUD). All 10 tests pass.

---

## Role Split

```
Admin   → P3.1 Register Hive        → D2 hive (create — assigns to a beekeeper)
Admin   → P3.2 Update Identity      → D2 hive (update name, beekeeper, site, species, status, image)
Beekpr  → P3.3 Track Colony (read)  → D2 hive (read hive_id for inspections/harvests)
```

Beekeepers no longer have write access to hives. Their dashboard shows assigned hives read-only.

---

## Flow of Events

### P3.1 — Register Hive (Admin)

Admin selects a beekeeper, enters hive name, optionally sets species, site, status, and uploads an image. On submit, the hive is created with `beekeeper_id` pointing to the chosen beekeeper and the hive immediately appears on that beekeeper's dashboard.

```
POST /admin/hives → Admin\HiveController::store()
→ StoreHiveRequest: name (required), beekeeper_id (required, exists:users), species_id (nullable),
  site_id (nullable), status (nullable, defaults to 'active'), image (nullable, image, max:2048)
→ image stored at hives/{filename} on public disk if provided
→ Hive::create(validated + image_path + status default)
→ redirect admin.hives.index with success
```

### P3.2 — Update Hive Identity (Admin)

Admin can update any field including reassigning the hive to a different beekeeper. If a new image is uploaded, the old image is deleted from storage before storing the new one.

```
PATCH /admin/hives/{hive} → Admin\HiveController::update()
→ UpdateHiveRequest: same rules as store + status required (active|inactive)
→ if new image: Storage::disk('public')->delete(old) → store new
→ $hive->update(validated + image_path if new)
→ redirect admin.hives.index with success
```

### P3.3 — Beekeeper Dashboard (Read-Only)

Beekeeper dashboard stripped of all write actions. Hives are loaded via `DashboardController` filtered by `beekeeper_id = auth()->id()`. No forms, modals, or action dropdowns are rendered.

```
GET /dashboard → DashboardController::index()
→ Hive::where('beekeeper_id', auth()->id())->with(['species','site','summary'])->get()
→ Inertia: dashboard (hives only — no species_list or sites_list)
```

### Sites Management (Admin)

Admin-managed deployment sites. The `master_sites` table is deployment-specific and cannot be fully pre-seeded. Admin can add, rename, and delete sites. Deleting a site that has hives assigned is blocked (UI disables the button + backend guard).

```
GET    /admin/sites          → SiteController::index()    → renders admin/sites/index
POST   /admin/sites          → SiteController::store()    → create site (unique name)
PATCH  /admin/sites/{site}   → SiteController::update()   → update name/description
DELETE /admin/sites/{site}   → SiteController::destroy()  → blocked if site has hives
```

---

## Architecture

### Backend

| Layer | File | Responsibility |
|-------|------|----------------|
| Controller | `app/Http/Controllers/Admin/HiveController.php` | Hive CRUD: index (with stats), store, update, destroy, toggleStatus |
| Controller | `app/Http/Controllers/Admin/SiteController.php` | Site CRUD: index (with hive_count), store, update, destroy |
| Controller | `app/Http/Controllers/DashboardController.php` | Beekeeper dashboard — hives read-only (species_list/sites_list removed) |
| Request | `app/Http/Requests/Hive/StoreHiveRequest.php` | admin role, beekeeper_id required, image nullable |
| Request | `app/Http/Requests/Hive/UpdateHiveRequest.php` | admin role, beekeeper_id required, status required, image nullable |
| Request | `app/Http/Requests/Admin/StoreSiteRequest.php` | admin role, name required + unique, description nullable |
| Request | `app/Http/Requests/Admin/UpdateSiteRequest.php` | admin role, name unique-ignore-self, description nullable |
| Factory | `database/factories/HiveFactory.php` | Test factory: beekeeper_id via UserFactory, name, status=active |
| Migration | `2026_05_01_000001_cleanup_master_table_duplicates.php` | Deletes duplicate master table rows inserted by re-running seeder |

### Seeder Fix

`MasterDataSeeder` converted all plain `insert()` blocks to `updateOrInsert()` keyed on `name`. Safe to re-run — row counts stay at 3/5/7/7/7/10 (sites/species/colors/flavors/weather/flora).

### Frontend

| File | Responsibility |
|------|----------------|
| `resources/js/pages/admin/hives/index.tsx` | Hive table (Name, Beekeeper, Site, Species, Status, Age) + register/edit/delete/toggle modals |
| `resources/js/pages/admin/sites/index.tsx` | Sites table (Name, Description, Hive count) + add/edit/delete modals |
| `resources/js/pages/dashboard.tsx` | Read-only beekeeper hive view — all write forms and modals removed |
| `resources/js/layouts/admin-layout.tsx` | Added Hives + Sites tabs to admin navigation |

### Image Handling

All hive forms use `forceFormData: true`. Images stored at `storage/app/public/hives/`. On hive update, old image is deleted before new one is stored. On hive delete, image is cleaned up from disk.

### Tables

| Table | Change |
|-------|--------|
| `hives` | No schema change — `beekeeper_id`, `site_id`, `species_id`, `image_path`, `status` already existed |
| `master_sites` | Duplicate rows removed by migration. Seeder now idempotent. |
| All other master tables | Same — duplicates removed, seeders idempotent. |

---

## Route Map

| Method | URI | Controller | Middleware |
|--------|-----|------------|------------|
| GET | `/admin/hives` | `Admin\HiveController::index` | `auth`, `verified`, `admin` |
| POST | `/admin/hives` | `Admin\HiveController::store` | `auth`, `verified`, `admin` |
| PATCH | `/admin/hives/{hive}` | `Admin\HiveController::update` | `auth`, `verified`, `admin` |
| DELETE | `/admin/hives/{hive}` | `Admin\HiveController::destroy` | `auth`, `verified`, `admin` |
| PATCH | `/admin/hives/{hive}/toggle-status` | `Admin\HiveController::toggleStatus` | `auth`, `verified`, `admin` |
| GET | `/admin/sites` | `SiteController::index` | `auth`, `verified`, `admin` |
| POST | `/admin/sites` | `SiteController::store` | `auth`, `verified`, `admin` |
| PATCH | `/admin/sites/{site}` | `SiteController::update` | `auth`, `verified`, `admin` |
| DELETE | `/admin/sites/{site}` | `SiteController::destroy` | `auth`, `verified`, `admin` |
| GET | `/dashboard` | `DashboardController::index` | `auth`, `verified`, `beekeeper` |

**Removed routes** (previously under beekeeper middleware):

| Method | URI | Reason |
|--------|-----|--------|
| POST | `/hives` | Moved to admin — beekeepers cannot create hives |
| PATCH | `/hives/{hive}` | Moved to admin |
| DELETE | `/hives/{hive}` | Moved to admin |
| PATCH | `/hives/{hive}/toggle-status` | Moved to admin |

---

## Tests

### P3 — Hive Management (`tests/Feature/Admin/HiveManagementTest.php`)

| # | Test | Assertion |
|---|------|-----------|
| 1 | Admin can view hive management page | 200 |
| 2 | Admin can create hive with valid beekeeper and name | redirect admin.hives.index, DB has hive |
| 3 | Admin create fails without beekeeper_id | session error beekeeper_id |
| 4 | Admin create fails without name | session error name |
| 5 | Admin can update a hive | redirect admin.hives.index, DB has updated name |
| 6 | Admin can delete a hive | redirect admin.hives.index, DB missing hive |
| 7 | Admin can toggle hive status | redirect admin.hives.index, status flipped to inactive |
| 8 | Beekeeper cannot access admin hives page | redirect dashboard |
| 9 | Beekeeper cannot POST to admin hives store | redirect dashboard |
| 10 | Unauthenticated user redirected to login | redirect login |

**10 tests — all pass. Full suite (168 tests / 842 assertions) — all pass.**

```bash
php artisan test tests/Feature/Admin/HiveManagementTest.php
php artisan test
```

---

## DFD Corrections (vs original diagram)

Original `BuzzyHive-2.0-DFD-M3-HiveManagement.drawio` had three inaccuracies. Corrected version saved as `BuzzyHive-2.0-DFD-M3-HiveManagement-corrected.drawio`:

| Item | Original | Corrected |
|------|----------|-----------|
| f5 | Beekeeper → P3.1 (beekeeper could register hives) | Removed — admin is the sole registrant |
| f2 | P3.1 → D2 labelled "beekeeper creates hive" | Rerouted: Admin → P3.1 → D2 (admin assigns beekeeper_id on create) |
| f10 | Missing | Added: Admin → P3.2 → D2 (admin controls site_id — P3.4 Set GPS/Site collapsed into P3.2) |
