# ML Training Workflow

This document replaces the old notebook-only flow in `ml/train.ipynb` with repeatable scripts.

## Legacy Workflow Reconstruction

The notebook-generated baseline did the following:

- synthesized `ml/dataset.csv` from class anchor distributions
- used the feature order `mq2_value, mq3_value, mq5_value, mq135_value, temp, humidity`
- fit `MinMaxScaler`
- selected KNN from a notebook experiment and persisted `model.pkl` and `scaler.pkl`

The legacy artifacts reflected that old design. The current deployed model was rebuilt via `ml/train_model.py`:

- model family: `KNeighborsClassifier`
- hyperparameters: `n_neighbors=7`, `weights='distance'`
- dataset: `synthetic_flat` (`ml/datasets/synthetic_readiness_training_flat_v1.csv`)
- scaler: `MinMaxScaler`
- artifacts rebuilt to eliminate the `scikit-learn 1.4.2 → 1.8.0` pickle compatibility risk

## Script Entry Points

- `ml/benchmark_models.py`
  - runs cross-validation and holdout benchmarking for the legacy dataset and the synthetic flat dataset
  - compares `k=3`, `k=5`, and `k=7` KNN variants with both uniform and distance weighting
  - benchmarks logistic regression and random forest
  - writes repo-tracked reports to `ml/reports/model_benchmark_report.json` and `ml/reports/model_benchmark_report.md`

- `ml/train_model.py`
  - trains one chosen candidate from a dataset preset or CSV path
  - saves `model.pkl`, `scaler.pkl`, and `model_metadata.json` to an output directory

## Example Commands

```powershell
python ml/benchmark_models.py
python ml/train_model.py --dataset legacy --candidate knn_k5_distance
python ml/train_model.py --dataset synthetic_flat --candidate random_forest
```

## Why This Rebuild Matters

- preprocessing is now explicit instead of buried in a notebook
- feature order and label handling are fixed in one shared pipeline
- model comparisons are reproducible across both the legacy and synthetic flat datasets
- probability behavior on the synthetic stress-test dataset is now part of the benchmark output
