# ML Benchmark Report

- `scikit-learn` version: `1.8.0`
- Stress-test dataset: `C:\Users\taufi\Documents\Degree\Year 3 sem 2\FYP 1\buzzyhive\ml\datasets\synthetic_readiness_stress_test_v1.csv`
- Feature order: `mq2_value, mq3_value, mq5_value, mq135_value, temp, humidity`

## Dataset: `legacy`

- Source: `C:\Users\taufi\Documents\Degree\Year 3 sem 2\FYP 1\buzzyhive\ml\dataset.csv`
- Rows: `200`
- Class counts: `{"not_ready": 50, "approaching": 50, "nearly_ready": 50, "ready": 50}`
- Highest macro-F1 candidate: `random_forest`
- Highest macro-F1 score: `1.0`
- Recommended candidate: `random_forest`
- Recommended candidate blocked for deployment: `true`
- Recommendation note: All candidates remained too optimistic on the stress dataset, so deployment should stay blocked.

| Candidate | CV Macro F1 | CV Precision | CV Recall | Holdout Acc | Stress Mean Max Prob | Stress Optimistic Rate | Stress Ready Rate |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| `knn_k3_uniform` | 1.0000 | 1.0000 | 1.0000 | 1.0000 | 0.9933 | 1.0000 | 0.9517 |
| `knn_k5_uniform` | 1.0000 | 1.0000 | 1.0000 | 1.0000 | 0.9913 | 1.0000 | 0.9517 |
| `knn_k7_uniform` | 1.0000 | 1.0000 | 1.0000 | 1.0000 | 0.9829 | 1.0000 | 0.9517 |
| `knn_k3_distance` | 1.0000 | 1.0000 | 1.0000 | 1.0000 | 0.9935 | 1.0000 | 0.9517 |
| `knn_k5_distance` | 1.0000 | 1.0000 | 1.0000 | 1.0000 | 0.9915 | 1.0000 | 0.9517 |
| `knn_k7_distance` | 1.0000 | 1.0000 | 1.0000 | 1.0000 | 0.9836 | 1.0000 | 0.9517 |
| `logistic_regression` | 1.0000 | 1.0000 | 1.0000 | 1.0000 | 0.9065 | 1.0000 | 0.9417 |
| `random_forest` | 1.0000 | 1.0000 | 1.0000 | 1.0000 | 0.8046 | 0.9967 | 0.8767 |

## Dataset: `synthetic_flat`

- Source: `C:\Users\taufi\Documents\Degree\Year 3 sem 2\FYP 1\buzzyhive\ml\datasets\synthetic_readiness_training_flat_v1.csv`
- Rows: `1600`
- Class counts: `{"not_ready": 400, "approaching": 400, "nearly_ready": 400, "ready": 400}`
- Highest macro-F1 candidate: `knn_k7_distance`
- Highest macro-F1 score: `0.8581`
- Recommended candidate: `knn_k7_distance`
- Recommended candidate blocked for deployment: `false`
- Recommendation note: At least one candidate stayed below the stress optimism safety threshold.

| Candidate | CV Macro F1 | CV Precision | CV Recall | Holdout Acc | Stress Mean Max Prob | Stress Optimistic Rate | Stress Ready Rate |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| `knn_k3_uniform` | 0.8426 | 0.8437 | 0.8431 | 0.8281 | 0.8500 | 0.0467 | 0.0033 |
| `knn_k5_uniform` | 0.8521 | 0.8534 | 0.8525 | 0.8469 | 0.8173 | 0.0567 | 0.0067 |
| `knn_k7_uniform` | 0.8560 | 0.8579 | 0.8562 | 0.8281 | 0.8071 | 0.0583 | 0.0100 |
| `knn_k3_distance` | 0.8407 | 0.8417 | 0.8413 | 0.8281 | 0.8514 | 0.0517 | 0.0050 |
| `knn_k5_distance` | 0.8513 | 0.8525 | 0.8519 | 0.8469 | 0.8184 | 0.0583 | 0.0067 |
| `knn_k7_distance` | 0.8581 | 0.8599 | 0.8588 | 0.8406 | 0.8091 | 0.0600 | 0.0100 |
| `logistic_regression` | 0.5939 | 0.5907 | 0.6044 | 0.6000 | 0.6437 | 0.2900 | 0.2767 |
| `random_forest` | 0.8359 | 0.8362 | 0.8363 | 0.8281 | 0.5791 | 0.0600 | 0.0017 |

