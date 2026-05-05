# BuzzyHive 2.0 — User Profiles Module (M2)

*Version: 1.0 | Date: 2026-05-01 | Status: Complete*

---

## Overview

The User Profiles Module handles identity, authentication, and user management across two roles: Admin and Beekeeper. It covers four core processes — login via Laravel Auth/Fortify, profile view/edit, password change, and admin-only beekeeper registration via an invite-based flow. All 39 tests pass across 5 test files.

---

## Flow of Events

### P2.1 — Authenticate User (Laravel Auth)

Both Admin and Beekeeper log in with `email` + `password`. Laravel Fortify handles session creation, rate limiting, and optional 2FA challenge. On success the authenticated user ID is stored in the session and becomes available to all downstream processes.

```
POST /login → Fortify validates credentials → session created
→ Admin: redirect /admin
→ Beekeeper: redirect /dashboard
```

### P2.2 — Manage Profile (View / Edit)

Any authenticated user can view and edit their own profile. The authenticated user record (including Spatie role) is shared globally via the Inertia middleware on every page load. On update, `ProfileUpdateRequest` validates name, email (unique-ignore-self), and `telegram_id` (nullable string 100). If email changes, `email_verified_at` is nullified.

```
GET  /settings/profile → ProfileController::edit()   → Inertia: settings/profile
PATCH /settings/profile → ProfileController::update() → fill(validated) → save
```

Fields editable: `name`, `email`, `telegram_id`

### P2.3 — Change Password

Authenticated + verified users can update their password. `PasswordUpdateRequest` validates `current_password` (using Laravel's `current_password` rule against the DB hash) and `password` (with `Password::default()` + `confirmed`). The `password` cast on User auto-hashes on save. Route is throttled at 6 requests per minute.

```
PUT /settings/password → SecurityController::update()
→ PasswordUpdateRequest validates current_password + new password (confirmed)
→ user->update(['password' => $request->password])  ← auto-hashed via cast
→ back()
```

### P2.4 — Register Beekeeper (Admin only)

Admin-only. Creates a new user with `status='pending'`, assigns the `beekeeper` role via Spatie, then dispatches a `BeekeeperInviteNotification` containing a 7-day signed URL. Additional admin operations: update details, toggle active/deactivated status, resend invite (pending only), delete.

```
POST /admin/beekeepers → BeekeeperController::store()
→ StoreBeekeeperRequest: name (regex), email (unique), phone (MY format, nullable)
→ User::create(status=pending, invited_by=admin_id)
→ assignRole('beekeeper')  ← Spatie
→ URL::temporarySignedRoute('invite.accept', 7 days)
→ notify(BeekeeperInviteNotification)
→ redirect admin.beekeepers.index
```

### P2.5 — Accept Invite (Signed URL)

Not in the original DFD — implemented via `AcceptInviteController`. The beekeeper receives a signed invite URL by email. On GET the invite form is shown (only if user status is `pending`). On POST the beekeeper sets their password; the controller activates the account and logs them in.

```
GET  /invite/accept/{user}?signature → AcceptInviteController::show()
→ guard: isPending() else redirect login
→ Inertia: auth/accept-invite

POST /invite/accept/{user}?signature → AcceptInviteController::store()
→ guard: isPending() else redirect login
→ validate: password (confirmed, Password::defaults())
→ user->update(password, status=active, email_verified_at=now())
→ auth()->login($user)
→ redirect dashboard
```

---

## Architecture

### Backend

| Layer | File | Responsibility |
|-------|------|----------------|
| Auth | Laravel Fortify (built-in) | Login, logout, 2FA, rate limiting |
| Controller | `app/Http/Controllers/Auth/AcceptInviteController.php` | Invite acceptance — show form, set password, activate, auto-login |
| Controller | `app/Http/Controllers/Settings/ProfileController.php` | Profile view, update (name/email/telegram_id), account delete |
| Controller | `app/Http/Controllers/Settings/SecurityController.php` | Password change, optional 2FA management |
| Controller | `app/Http/Controllers/Admin/BeekeeperController.php` | Beekeeper CRUD: invite, update, toggle status, resend, delete |
| Request | `app/Http/Requests/Settings/ProfileUpdateRequest.php` | name + email (unique-ignore-self) + telegram_id (nullable, max 100) |
| Request | `app/Http/Requests/Settings/PasswordUpdateRequest.php` | current_password + password (confirmed, Password::default()) |
| Request | `app/Http/Requests/Admin/StoreBeekeeperRequest.php` | name (regex unicode), email (unique), phone (MY format, nullable) |
| Request | `app/Http/Requests/Admin/UpdateBeekeeperRequest.php` | Same as Store but email unique-ignore-self |
| Concern | `app/Concerns/ProfileValidationRules.php` | Shared name + email rules (used by ProfileUpdateRequest) |
| Concern | `app/Concerns/PasswordValidationRules.php` | Shared current_password + password rules |
| Notification | `app/Notifications/BeekeeperInviteNotification.php` | Sends signed invite URL + admin name to beekeeper email |
| Model | `app/Models/User.php` | fillable: name, email, password, phone, invited_by, status, telegram_id. Casts: password=hashed. Appends: role (via Spatie getRoleNames). Relations: invitedBy, invitees, harvests |

### Frontend

| File | Responsibility |
|------|----------------|
| `resources/js/pages/settings/profile.tsx` | Profile form — name, email, telegram_id fields |
| `resources/js/pages/settings/security.tsx` | Password change form + optional 2FA toggle |
| `resources/js/pages/admin/beekeepers/index.tsx` | Beekeeper list — stats cards, invite modal, toggle/delete actions |
| `resources/js/pages/auth/accept-invite.tsx` | Invite acceptance form — password + confirm |

### Tables

| Table | Purpose |
|-------|---------|
| `users` | id, name, email, password (hashed), phone, telegram_id, status (pending/active/deactivated), invited_by FK, email_verified_at, created_at, updated_at |
| `model_has_roles` | Spatie junction — maps user_id to role_id |
| `roles` | Spatie roles — admin, beekeeper |

---

## Route Map

| Method | URI | Controller | Middleware |
|--------|-----|------------|------------|
| GET | `/settings/profile` | `ProfileController::edit` | `auth` |
| PATCH | `/settings/profile` | `ProfileController::update` | `auth` |
| DELETE | `/settings/profile` | `ProfileController::destroy` | `auth`, `verified` |
| GET | `/settings/security` | `SecurityController::edit` | `auth`, `verified` |
| PUT | `/settings/password` | `SecurityController::update` | `auth`, `verified`, `throttle:6,1` |
| GET | `/invite/accept/{user}` | `AcceptInviteController::show` | `signed` |
| POST | `/invite/accept/{user}` | `AcceptInviteController::store` | `signed` |
| GET | `/admin/beekeepers` | `BeekeeperController::index` | `auth`, `verified`, `admin` |
| POST | `/admin/beekeepers` | `BeekeeperController::store` | `auth`, `verified`, `admin` |
| PATCH | `/admin/beekeepers/{user}` | `BeekeeperController::update` | `auth`, `verified`, `admin` |
| PATCH | `/admin/beekeepers/{user}/toggle-status` | `BeekeeperController::toggleStatus` | `auth`, `verified`, `admin` |
| POST | `/admin/beekeepers/{user}/resend-invite` | `BeekeeperController::resendInvite` | `auth`, `verified`, `admin` |
| DELETE | `/admin/beekeepers/{user}` | `BeekeeperController::destroy` | `auth`, `verified`, `admin` |

---

## Tests

### P2.1 — Authentication (`tests/Feature/Auth/AuthenticationTest.php`)

| # | Test | Assertion |
|---|------|-----------|
| 1 | Login screen renders | 200 |
| 2 | Valid credentials authenticate | session authenticated, redirect dashboard |
| 3 | 2FA redirect when enabled | redirect two-factor.login, session has login.id |
| 4 | Invalid password rejected | guest |
| 5 | Logout | guest, redirect home |
| 6 | Rate limited after 5 attempts | 429 |

### P2.2 — Manage Profile (`tests/Feature/Settings/ProfileUpdateTest.php`)

| # | Test | Assertion |
|---|------|-----------|
| 1 | Profile page displays | 200 |
| 2 | Name + email updated | DB reflects new values, redirect profile.edit |
| 3 | Email unchanged → email_verified_at preserved | email_verified_at not null |
| 4 | Account deleted | user gone, guest, redirect home |
| 5 | Wrong password on delete | session error, user still exists |
| 6 | telegram_id updated | DB reflects new telegram_id |
| 7 | telegram_id cleared to null | DB telegram_id is null |
| 8 | Unauthenticated redirect | redirect login |

### P2.3 — Change Password (`tests/Feature/Settings/SecurityTest.php`)

| # | Test | Assertion |
|---|------|-----------|
| 1 | Security page displays with 2FA props | 200, Inertia props correct |
| 2 | Password confirmation required when 2FA confirmPassword=true | redirect password.confirm |
| 3 | Security page without confirmation when disabled | 200 |
| 4 | Security page without 2FA feature | 200, canManageTwoFactor=false, no twoFactorEnabled |
| 5 | Password updated | new password hashed correctly in DB |
| 6 | Wrong current_password rejected | session error current_password |
| 7 | Unauthenticated redirect | redirect login |

### P2.4 — Register Beekeeper (`tests/Feature/Admin/BeekeeperManagementTest.php`)

| # | Test | Assertion |
|---|------|-----------|
| 1 | Admin views beekeeper list | 200 |
| 2 | Beekeeper blocked from list | redirect dashboard |
| 3 | Admin invites beekeeper | user created, status=pending, role=beekeeper |
| 4 | Duplicate email rejected | session error email |
| 5 | Invite notification sent | Notification::assertSentTo beekeeper |
| 6 | Admin deactivates active beekeeper | status=deactivated |
| 7 | Admin reactivates deactivated beekeeper | status=active |
| 8 | Admin deletes beekeeper | user gone |
| 9 | Beekeeper cannot delete another user | redirect dashboard, target still exists |
| 10 | Admin resends invite to pending beekeeper | notification sent |
| 11 | Admin cannot resend invite to active beekeeper | redirect with error, no notification |
| 12 | Admin updates beekeeper details | DB reflects new name + email |
| 13 | Non-admin cannot update beekeeper | redirect dashboard, name unchanged |

### P2.5 — Accept Invite (`tests/Feature/Auth/AcceptInviteTest.php`)

| # | Test | Assertion |
|---|------|-----------|
| 1 | Invite page shown to pending user | 200 |
| 2 | Invite page redirects if already active | redirect login |
| 3 | Beekeeper accepts invite — sets password, activates, logs in | status=active, email_verified_at set, authenticated, redirect dashboard |
| 4 | Cannot accept invite twice (already active) | redirect login, guest |
| 5 | Unsigned invite URL rejected | 403 |

**Total: 39 tests, 142 assertions — all pass.**

```bash
php artisan test tests/Feature/Auth/AuthenticationTest.php \
                 tests/Feature/Auth/AcceptInviteTest.php \
                 tests/Feature/Settings/ProfileUpdateTest.php \
                 tests/Feature/Settings/SecurityTest.php \
                 tests/Feature/Admin/BeekeeperManagementTest.php
```

---

## DFD Corrections (vs original diagram)

The original `BuzzyHive-2.0-DFD-M2-UserProfiles.drawio` had several inaccuracies. Corrected in `BuzzyHive-2.0-DFD-M2-UserProfiles-corrected.drawio`:

| Item | Original | Corrected |
|------|----------|-----------|
| f3 source | P2.1 → D1 (read user+role) | P2.2 → D1 (P2.2 is the one reading profile data) |
| f4 target | D1 → floating (no target) | D1 → P2.2 (user record flows back to P2.2 for display) |
| f6 label | update name / telegram_id | update name, email, telegram_id (email is also editable) |
| f9 label (Admin→P2.4) | id, role | name, email, phone (role is hardcoded as beekeeper) |
| f10 label/target | assign role (via Spatie) → D1 roles | create pending user + assign beekeeper role (Spatie) → D1 users |
| P2.3 label | Change Password | Change Password (current_password verified) |
| P2.5 | Missing entirely | Added: Accept Invite (Signed URL) |
| P2.4 → Beekeeper | Missing | Added: invite email (signed URL) — dashed flow |
| Beekeeper → P2.5 | Missing | Added: password (via signed URL) |
| P2.5 → D1 | Missing | Added: set password + activate user |
