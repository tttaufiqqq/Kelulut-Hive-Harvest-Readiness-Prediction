# ML Release Criteria

This document defines the acceptance criteria used before replacing the active workspace ML artifacts.

## Prototype Baseline Refresh Criteria

The local workspace baseline can be replaced when all of the following are true:

1. The API contract stays compatible with the Laravel integration.
2. Phase 1 guardrails remain active for OOD and threshold conflicts.
3. The selected candidate is not deployment-blocked by the Phase 2 stress-optimism gate.
4. Warning metadata survives the Flask response, Laravel persistence, and predictions UI.
5. Benchmark and safety behavior are documented in repo-tracked reports.

## Production-Grade Criteria

The model should only be treated as production-trusted when all of the following are true:

1. A real labeled validation set exists with expert review, harvest outcome linkage, or lab-backed labels.
2. Recent real-data test windows pass the release target without relying on synthetic labels alone.
3. Guardrail warning rates are reviewed on live traffic and do not mask systemic model drift.
4. High-temperature, high-gas, and combined-stress readings are represented in the labeled real evaluation set.
5. The team signs off on threshold policy, UX wording, and operational fallback behavior.

## Current Decision

- Approved: replace the legacy local workspace baseline with the `synthetic_flat + knn_k7_distance` classifier.
- Not yet approved: treat the model as fully production-validated harvest-readiness intelligence.
