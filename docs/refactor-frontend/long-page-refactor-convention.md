# Long Page Refactor Convention

Last updated: 2026-05-05

## Resolver Audit

`resources/js/app.tsx` and `resources/js/ssr.tsx` currently resolve Inertia pages with:

```ts
resolvePageComponent(
    `./pages/${name}.tsx`,
    import.meta.glob('./pages/**/*.tsx'),
)
```

Because the resolver still targets `pages/<name>.tsx`, the default safe strategy is:

- Keep the existing route entry file path unchanged.
- Make the entry file thin by re-exporting or delegating to a page-local module.
- Defer any resolver expansion for `pages/<name>/index.tsx` until there is a dedicated migration for that change.

## Page Module Pattern

Use page-local folders only for long or high-churn pages:

```text
resources/js/pages/
  predictions.tsx
  predictions/
    PredictionsPage.tsx
    components/
    hooks/
    constants.ts
    utils.ts
    types.ts

  inspections/
    index.tsx
    InspectionsPage.tsx
    components/
    hooks/
    constants.ts
    utils.ts
    types.ts
```

## Extraction Rules

- First pass is structural only. Preserve JSX, class names, copy, render order, and behavior.
- Keep Inertia props, form state, router actions, modal state, and orchestration in the main page module until extracted UI is stable.
- Extract in this order:
  1. constants
  2. pure helpers
  3. presentational components
  4. page-specific hooks
- Prefer `PageNamePage.tsx` for the main page-local module and `components/SectionName.tsx` for extracted sections.
- Keep extracted modules page-local unless at least two pages genuinely share the same abstraction.
- Keep file naming consistent within a page folder:
  - `types.ts` for page-local interfaces and discriminated unions
  - `constants.ts` for options, labels, thresholds, and static chart config
  - `utils.ts` for pure formatting and mapping helpers
  - `hooks/useThing.ts` for page-specific stateful logic
  - `components/Thing.tsx` for extracted presentational sections

## Manual Verification Checklist

- `npm run build` passes.
- The page loads without console or hydration errors.
- Layout and spacing match the pre-refactor page.
- Filters and search controls still work.
- Tables, row actions, and pagination still work.
- Create, edit, view, and delete modal flows still work.
- Forms submit successfully and flash messages still appear.
- Keyboard interactions still work where previously supported.

## First-Wave Targets

Refactor these pages first because their size makes them the biggest maintenance risk:

- `resources/js/pages/predictions.tsx`
- `resources/js/pages/inspections/index.tsx`
- `resources/js/pages/harvests/index.tsx`
- `resources/js/pages/admin/sensors.tsx`
- `resources/js/pages/admin/hives/index.tsx`
- `resources/js/pages/admin/beekeepers/index.tsx`

## Current Status

- Resolver audit completed.
- Convention documented.
- Page-local constants and helpers extracted for predictions, inspections, and harvests.
- Thin-entry modules now back these route entries:
  - `predictions`
  - `inspections/index`
  - `harvests/index`
  - `admin/sensors`
  - `admin/dashboard`
  - `admin/hives/index`
  - `admin/beekeepers/index`
  - `admin/devices/index`
  - `admin/sites/index`
  - `admin/inspections/index`
  - `admin/harvests/index`
  - `dashboard`
  - `analytics`
  - `LandingPage`
- Latest automated verification: `npm run build` passed on 2026-05-05 after the full modularization sweep.
