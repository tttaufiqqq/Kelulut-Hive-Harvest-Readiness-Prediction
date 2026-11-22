# Docs index

Grouped by topic. Start with Requirements, then the modules, then the rest as you need them.

## Requirements

1. [System requirements](requirements/requirements.md): what BuzzyHive 2.0 must do. Read this first.
2. [Use case diagram](requirements/use-case-diagram.md): actors and use cases.
3. [Flow of events](requirements/flow-of-events.md): step-by-step flow for each use case.
4. [Activity diagrams](requirements/activity-diagrams.md): the same flows as activity diagrams.
5. [Top 3 page wireframes](wireframe/top-3-pages-wireframes.md): ASCII wireframes of the main pages.

## Modules

- [Sensor monitoring](modules/sensor-monitoring-module.md) (M1)
- [User profiles](modules/user-profiles-module.md) (M2)
- [Hive management](modules/hive-management-module.md) (M3)
- [Analytics](modules/analytics-module.md) (M4)
- [Inspection](modules/inspection-module.md)
- [Reporting](modules/reporting-module.md)

## Machine learning

1. [Dataset strategy](ml/ml-dataset-strategy.md)
2. [Training workflow](ml/ml-training-workflow.md)
3. [Decision policy](ml/ml-decision-policy.md)
4. [Safety guardrails](ml/ml-safety-guardrails.md)
5. [Release criteria](ml/ml-release-criteria.md)

## Delivery and operations

- [CI/CD pipelines](ci-cd-pipeline/cicd-pipeline.md): the lint, app deploy and ML deploy workflows. Read before changing anything under `.github/`.
- [Realtime broadcasting rollout](websocket-live-data-reading/realtime-broadcasting-rollout.md): Pusher and Echo live updates.

## Analytics

- [Power BI dashboard](powerbi-dashboard/DASHBOARD.md): the 7-page report, its data model and presentation scripts. Screenshots are in [`powerbi-dashboard/screenshots/`](powerbi-dashboard/screenshots/) and cleaning scripts and sample data in [`powerbi-dashboard/report-assets/`](powerbi-dashboard/report-assets/).

## Frontend refactoring notes

- [Long page refactor convention](refactor-frontend/long-page-refactor-convention.md)
- [Long page refactor checklist](refactor-frontend/long-page-refactor-checklist.md)
- [UX nav fixes](refactor-frontend/ux-nav-fixes.md)

Start at the [repository README](../README.md) if you haven't already. It covers the same ground at a higher level.
