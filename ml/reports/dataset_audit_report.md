# Dataset Audit Report

## Source Catalog

| Source | Type | Intended Role | Label Provenance |
| --- | --- | --- | --- |
| `legacy_baseline` | synthetic_legacy | archived baseline comparison only | notebook-generated Gaussian anchors per class |
| `synthetic_balanced_v1` | synthetic_balanced | fair prototyping and class-balanced evaluation | synthetic readiness rules from latent maturity and stress variables |
| `synthetic_training_flat_v1` | synthetic_training | API-compatible retraining experiments | flattened export of the balanced synthetic dataset |
| `synthetic_timeseries_v1` | synthetic_timeseries | sequence stability, drift, and UI playback checks | synthetic readiness rules with time continuity |
| `synthetic_stress_test_v1` | synthetic_stress_test | OOD, anomaly, and safety validation only | synthetic stress scenarios and explicit outlier cases |

## Coverage Comparison

| Source | MQ2 | MQ3 | MQ5 | MQ135 | Temp | Humidity |
| --- | --- | --- | --- | --- | --- | --- |
| `legacy_baseline` | 37.0 to 167.0 | 30.0 to 185.0 | 99.0 to 253.0 | 148.0 to 293.0 | 25.3 to 33.6 | 60.4 to 81.8 |
| `synthetic_balanced_v1` | 44.0 to 245.0 | 53.0 to 243.0 | 103.0 to 320.0 | 156.0 to 380.0 | 26.3 to 38.5 | 47.9 to 95.0 |
| `synthetic_training_flat_v1` | 44.0 to 245.0 | 53.0 to 243.0 | 103.0 to 320.0 | 156.0 to 380.0 | 26.3 to 38.5 | 47.9 to 95.0 |
| `synthetic_timeseries_v1` | 44.0 to 245.0 | 53.0 to 249.0 | 103.0 to 320.0 | 156.0 to 380.0 | 26.2 to 38.5 | 46.8 to 95.0 |
| `synthetic_stress_test_v1` | 53.0 to 405.0 | 48.0 to 430.0 | 121.0 to 560.0 | 160.0 to 640.0 | 21.3 to 44.0 | 32.1 to 100.0 |
| `repo_seeded_live_like_sensor_logs` | 160.0 to 450.0 | 160.0 to 450.0 | 160.0 to 450.0 | 160.0 to 450.0 | 31.2 to 36.8 | 65.2 to 76.8 |
| `sensor_ingest_validation_limits` | 0.0 to 4095.0 | 0.0 to 4095.0 | 0.0 to 4095.0 | 0.0 to 4095.0 | -10.0 to 60.0 | 0.0 to 100.0 |

## Key Findings

- `ml/dataset.csv` is not real field data; it is a notebook-generated synthetic baseline and should be treated as an archived comparison set.
- The repo contains no expert-labeled real harvest-readiness dataset. Current readiness labels in committed ML datasets are synthetic-rule labels, while seeded Laravel predictions are heuristic timeline labels.
- The legacy dataset materially under-covers the upper gas and temperature ranges represented by the repo-seeded live-like sensor logs, which explains the strong out-of-distribution pressure seen in Phase 1 and Phase 2.
- `synthetic_readiness_stress_test_v1.csv` should stay evaluation-only, because it intentionally contains anomaly and outlier cases that would distort normal training.
- `synthetic_readiness_timeseries_v1.csv` should stay sequence-evaluation-only for stability and drift checks instead of being randomly mixed into flat training.
