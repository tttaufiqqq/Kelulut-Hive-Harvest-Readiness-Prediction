# Long Page Refactor Checklist

Last updated: 2026-05-05

Use this checklist before and after each long-page extraction so behavior stays stable during structural refactors.

## Before Refactor

- Confirm the existing Inertia entry path that must remain resolvable.
- Capture the current route name and the page title shown in `<Head>`.
- Note the page's interaction surfaces:
  - filters and search
  - tables and pagination
  - drawers or modals
  - create, edit, delete, and view flows
  - keyboard navigation
  - charts, live updates, or polling
- Record any page-local constants or helper functions that can move first without changing behavior.

## During Refactor

- Keep the original entry file path and switch it to a thin re-export only when the page module is in place.
- Prefer moving pure constants and helpers before JSX sections.
- Keep render order and prop names unchanged during the first split.
- Avoid introducing shared abstractions until at least two pages need them.
- Check imports after every move to avoid circular references between `Page.tsx`, `components`, `constants`, and `utils`.

## After Refactor

- `npm run build`
- Open the target page and confirm it renders
- Check filters and search inputs
- Check tables, row actions, and pagination
- Check view, create, edit, and delete flows
- Check flash messages and form errors
- Check keyboard navigation where supported
- Check charts, empty states, loading states, and live updates where applicable

## Initial Target Matrix

- `predictions`: chart date filter, history pagination, live updates, confidence/warning states
- `inspections`: hive filter, multi-select form fields, modal keyboard navigation, pagination
- `harvests`: hive filter, CRUD modals, productivity badges, pagination
- `admin/sensors`: hive selector, live chart updates, date/window controls
- `admin/hives`: CRUD, image upload, status toggle, modal keyboard navigation
- `admin/beekeepers`: invite/create, resend invite, activate/deactivate, delete, pagination
- `admin/dashboard`: hive detail modal, rankings, chart rendering
- `admin/devices`: CRUD, device status, maintenance dates, modal keyboard navigation

## Refactor Snapshot

- Completed automated modularization pass:
  - `predictions`
  - `inspections`
  - `harvests`
  - `admin/sensors`
  - `admin/dashboard`
  - `admin/hives`
  - `admin/beekeepers`
  - `admin/devices`
  - `admin/sites`
  - `admin/inspections`
  - `admin/harvests`
  - `dashboard`
  - `analytics`
  - `LandingPage`
- Remaining validation is primarily manual UI smoke testing for page-specific interactions that the build cannot cover.
