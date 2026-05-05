# ML Safety Guardrails

This document defines the Phase 1 trust layer for the current BuzzyHive readiness model.

## Active Training Dataset Bounds

The currently deployed baseline model was trained from `ml/dataset.csv`, which contains `200` rows with a balanced `50` rows per readiness label.

| Feature | Min | Max |
| --- | ---: | ---: |
| `mq2_value` | 37.0 | 167.0 |
| `mq3_value` | 30.0 | 185.0 |
| `mq5_value` | 99.0 | 253.0 |
| `mq135_value` | 148.0 | 293.0 |
| `temp` | 25.3 | 33.6 |
| `humidity` | 60.4 | 81.8 |

Any live reading outside these bounds is now flagged as out-of-distribution, because the legacy `KNeighborsClassifier(n_neighbors=1)` was only trained inside this narrow feature window.

## Guardrail Policy

The prediction API now separates the raw model output from the guarded result.

- `out_of_distribution = true` when any feature falls outside the active training min/max range.
- `out_of_distribution_features` lists the exact features, observed values, and training bounds.
- `prediction_warning` provides a readable explanation of why trust should be reduced.
- `raw_readiness_level` and `raw_hri_value` preserve the original model output for debugging.
- `readiness_level` and `hri_value` return the guarded result that the application should trust.

Threshold severity is aligned to the Laravel threshold tables:

- `critical` threshold conflicts with optimistic ML outputs (`ready` or `nearly_ready`) trigger a downgrade.
- `critical` threshold conflicts plus out-of-distribution input trigger suppression to `not_ready`.
- `warning` threshold conflicts annotate optimistic ML outputs without overriding them.
- Out-of-distribution `ready` predictions downgrade to `nearly_ready` even without a critical threshold.

## Verification Cases

Use `ml/verify_prediction_guardrails.py` to run scripted checks for:

- a baseline in-range reading
- a critical plus out-of-distribution conflict case
- an out-of-distribution case without a critical threshold

The current legacy model now visibly demonstrates the reliability gap the guardrail is covering:

- a normal in-range case still returns `ready`
- an extreme out-of-range case still produces raw `ready` with `1.0` confidence, but the guardrail suppresses it to `not_ready`
- a milder out-of-range case can still produce raw `ready`, but the guardrail downgrades it to `nearly_ready`

Manual spot checks can also be run through `ml/predict.py` by passing JSON on the command line.
