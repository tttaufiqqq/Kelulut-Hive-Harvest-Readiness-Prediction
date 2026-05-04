# Readiness Score Prototype Report

## Recommended Direction

- Best score-model candidate: `knn_regressor_k5_distance`
- Best classification baseline: `knn_classifier_k7_distance`
- Recommendation: keep hard threshold guardrails separate from the ML estimate, but carry a continuous readiness score forward as the next prototype target because it can be mapped back to UX labels while remaining smoother over time.

## Regression Candidates

| Candidate | CV MAE | CV RMSE | Holdout MAE | Holdout RMSE | Holdout Label Macro F1 | Stress Optimistic Rate | Stress Ready Rate | Timeseries Mean Step Delta |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| `knn_regressor_k5_distance` | 0.0375 | 0.0521 | 0.0392 | 0.0550 | 0.8434 | 0.0450 | 0.0017 | 0.0293 |
| `knn_regressor_k7_distance` | 0.0381 | 0.0526 | 0.0391 | 0.0546 | 0.8188 | 0.0533 | 0.0017 | 0.0287 |
| `random_forest_regressor` | 0.0428 | 0.0577 | 0.0429 | 0.0599 | 0.8090 | 0.0617 | 0.0000 | 0.0322 |
| `gradient_boosting_regressor` | 0.0506 | 0.0658 | 0.0507 | 0.0644 | 0.7626 | 0.0567 | 0.0000 | 0.0336 |

## Classification Baselines

| Candidate | CV Macro F1 | Holdout Label Macro F1 | Stress Optimistic Rate | Stress Ready Rate | Timeseries Mean Step Delta |
| --- | ---: | ---: | ---: | ---: | ---: |
| `knn_classifier_k7_distance` | 0.8581 | 0.8405 | 0.0600 | 0.0100 | 0.0283 |
| `random_forest_classifier` | 0.8359 | 0.8284 | 0.0600 | 0.0017 | 0.0325 |
