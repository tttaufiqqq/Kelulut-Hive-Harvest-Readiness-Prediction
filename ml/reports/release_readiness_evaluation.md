# Release Readiness Evaluation

Evaluation date: `2026-05-05`

## Selected Active Artifact

- Model version: `knn_k7_distance-synthetic_readiness_training_flat_v1-sklearn-1.8.0`
- Model family: `KNeighborsClassifier`
- Training source: `ml/datasets/synthetic_readiness_training_flat_v1.csv`
- Guardrail layer: active in `ml/runtime.py`

## Why This Candidate Replaced The Legacy Baseline

- Phase 2 marked the legacy dataset as deployment-blocked because every candidate stayed dangerously optimistic on the stress set.
- The synthetic-flat `knn_k7_distance` classifier was the highest-macro-F1 non-blocked classification candidate.
- The Phase 5 verification run shows the promoted model no longer turns the critical stress test case into a raw `ready` prediction.
- The Laravel backend now stores warning metadata and the predictions UI surfaces low-trust states instead of hiding them behind a single readiness badge.

## Key Evidence

- Phase 2 report: `ml/reports/model_benchmark_report.md`
- Phase 3 report: `ml/reports/dataset_audit_report.md`
- Real sensor snapshot: `ml/reports/real_sensor_coverage_snapshot.md`
- Phase 4 report: `ml/reports/readiness_score_prototype_report.md`

## Guardrail Verification Snapshot

- Normal in-range sample: guarded result stays `ready`
- Critical stress sample: active model now returns raw `approaching` and surfaces a `critical` warning state
- Moderate formerly-OOD sample: active model now stays in-distribution under the broader synthetic-flat bounds and returns `approaching`

## Decision

- Local workspace baseline refresh: approved
- Production-grade trust claim: still blocked pending real labeled validation
