# ML Dataset Strategy

This document closes the Phase 3 dataset governance questions for the current repo state.

## Current Dataset Truth

- `ml/dataset.csv` is a legacy synthetic baseline created by the old notebook flow, not a real sensor dataset.
- `ml/datasets/synthetic_readiness_*` files are synthetic prototype assets generated from scenario rules and hidden maturity/stress variables.
- `database/seeders/SensorLogSeeder.php` creates live-like sensor logs for development realism, but those rows do not carry validated harvest-readiness labels.
- `database/seeders/PredictionSeeder.php` and `database/seeders/HarvestSeeder.php` create heuristic timeline labels and seeded harvest events for demos, not biological ground truth.
- No committed file in the repo is an expert-annotated, lab-measured, or harvest-outcome-verified real readiness training dataset.
- The local MySQL workspace currently contains a real sensor-log snapshot with `427` collected `sensor_logs`, but only `10` persisted `predictions`, so coverage exists before trustworthy labels do.

## Source Separation

The ML workspace now documents sources explicitly under `ml/data_sources/`:

- `real/`: currently only collection guidance and provenance notes, because no committed real labeled dataset exists yet
- `synthetic/`: prototype training and evaluation assets
- `stress_test/`: anomaly and OOD validation assets that should stay out of normal training

## Intended Role Of Each Synthetic Dataset

- `ml/datasets/synthetic_readiness_balanced_v1.csv`: balanced prototyping and fair model comparison
- `ml/datasets/synthetic_readiness_training_flat_v1.csv`: API-compatible flat retraining experiments
- `ml/datasets/synthetic_readiness_timeseries_v1.csv`: time-ordered stability, drift, and sequence-behavior checks
- `ml/datasets/synthetic_readiness_stress_test_v1.csv`: anomaly, OOD, and safety validation only

## Training vs Evaluation Decision

- Use `synthetic_readiness_training_flat_v1.csv` and the balanced synthetic dataset as training-only assets for prototype model selection.
- Use `synthetic_readiness_timeseries_v1.csv` and `synthetic_readiness_stress_test_v1.csv` as evaluation-only assets.
- Keep `ml/dataset.csv` as an archived baseline comparison asset, not the default future training source.
- Do not treat any synthetic dataset as production-ready evidence on its own.

## Coverage And Label Findings

- `ml/reports/dataset_audit_report.md` contains the current range comparison between the legacy dataset, synthetic datasets, repo-seeded live-like logs, and API ingest limits.
- `ml/reports/real_sensor_coverage_snapshot.md` captures the current live database snapshot, including high-temperature, high-gas, and combined-stress cases already present in the workspace.
- The legacy dataset under-covers the upper gas and temperature ranges already implied by repo-seeded live-like sensor logs.
- Current ML labels are synthetic-rule labels. The repo does not yet contain readiness labels derived from expert annotation, harvest outcomes, or lab measurements.

## Split Strategy

Use a staged split policy instead of random row sampling only:

1. Synthetic development split:
   Train on `synthetic_readiness_training_flat_v1.csv`.
   Validate on held-out synthetic hives or scenario families.
   Test on `synthetic_readiness_timeseries_v1.csv` and `synthetic_readiness_stress_test_v1.csv`.
2. Early real-data split:
   Keep a chronological holdout by hive and by date.
   Avoid mixing readings from the same hive cycle across train and test.
3. Release-candidate split:
   Require a final test window made of recent real labeled readings that were never used in tuning.

## Real Data Backlog

Collect additional real sensor readings with outcome linkage for:

- high-temperature periods above the legacy dataset ceiling
- high-gas periods across MQ2, MQ3, MQ5, and MQ135
- combined stress conditions where temperature, humidity, and gas rise together
- confirmed harvest outcomes, expert inspections, or lab checks so labels can move beyond synthetic rules

Current local DB snapshot already contains:

- `133` sensor logs above the legacy temperature ceiling of `33.6°C`
- `14` sensor logs above at least one legacy gas ceiling
- `3` gas-critical logs above the threshold critical bands
- `1` combined critical log with both `temp >= 40.1°C` and at least one gas sensor above a critical threshold

## Migration Path

1. Keep the Phase 1 guardrails active for all live predictions.
2. Use synthetic datasets only to shortlist safer model families and candidate hyperparameters.
3. Log and review unlabeled real sensor coverage gaps before trusting any synthetic-trained model in production.
4. Build a labeled real dataset tied to expert review, harvest outcomes, or lab measurement.
5. Shift model selection authority from synthetic benchmark wins toward real-data validation results.
6. Only retire the synthetic-heavy prototype workflow after a real-data test set consistently passes the release criteria.
