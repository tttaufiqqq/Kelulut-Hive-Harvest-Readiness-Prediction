#!/usr/bin/env python3
from __future__ import annotations

import csv
import json
from pathlib import Path
from typing import Any

import numpy as np
from sklearn.ensemble import GradientBoostingRegressor, RandomForestClassifier, RandomForestRegressor
from sklearn.metrics import f1_score, mean_absolute_error, mean_squared_error
from sklearn.model_selection import KFold, StratifiedKFold, cross_validate, train_test_split
from sklearn.neighbors import KNeighborsClassifier, KNeighborsRegressor
from sklearn.pipeline import make_pipeline
from sklearn.preprocessing import MinMaxScaler

from runtime import FEATURES


BASE = Path(__file__).resolve().parent
REPORT_DIR = BASE / 'reports'
CLASS_ORDER = ['not_ready', 'approaching', 'nearly_ready', 'ready']


def classify_score(score: float) -> str:
    if score < 0.35:
        return 'not_ready'
    if score < 0.60:
        return 'approaching'
    if score < 0.80:
        return 'nearly_ready'
    return 'ready'


def load_score_dataset(path: Path) -> dict[str, Any]:
    rows: list[list[float]] = []
    scores: list[float] = []
    labels: list[str] = []
    hive_ids: list[str] = []

    with path.open(newline='', encoding='utf-8') as handle:
        reader = csv.DictReader(handle)
        for row in reader:
            rows.append([float(row[feature]) for feature in FEATURES])
            scores.append(float(row['readiness_score']))
            labels.append(row['readiness_level'])
            hive_ids.append(row.get('hive_id', 'unknown'))

    return {
        'X': np.array(rows, dtype=float),
        'score': np.array(scores, dtype=float),
        'label': np.array(labels, dtype=object),
        'hive_id': np.array(hive_ids, dtype=object),
    }


def load_flat_classifier_dataset(path: Path) -> dict[str, Any]:
    rows: list[list[float]] = []
    labels: list[str] = []

    with path.open(newline='', encoding='utf-8') as handle:
        reader = csv.DictReader(handle)
        for row in reader:
            rows.append([float(row[feature]) for feature in FEATURES])
            labels.append(row['label'])

    return {
        'X': np.array(rows, dtype=float),
        'label': np.array(labels, dtype=object),
    }


REGRESSION_CANDIDATES = [
    ('knn_regressor_k5_distance', KNeighborsRegressor(n_neighbors=5, weights='distance')),
    ('knn_regressor_k7_distance', KNeighborsRegressor(n_neighbors=7, weights='distance')),
    ('random_forest_regressor', RandomForestRegressor(n_estimators=300, random_state=42)),
    ('gradient_boosting_regressor', GradientBoostingRegressor(random_state=42)),
]

CLASSIFICATION_BASELINES = [
    ('knn_classifier_k7_distance', KNeighborsClassifier(n_neighbors=7, weights='distance')),
    ('random_forest_classifier', RandomForestClassifier(n_estimators=300, random_state=42)),
]


def score_smoothness(values: np.ndarray, hive_ids: np.ndarray) -> float:
    total_delta = 0.0
    total_steps = 0

    for hive_id in np.unique(hive_ids):
        hive_values = values[hive_ids == hive_id]
        if len(hive_values) < 2:
            continue
        deltas = np.abs(np.diff(hive_values))
        total_delta += float(np.sum(deltas))
        total_steps += len(deltas)

    if total_steps == 0:
        return 0.0
    return total_delta / total_steps


def benchmark_regression_models() -> dict[str, Any]:
    train_dataset = load_score_dataset(BASE / 'datasets' / 'synthetic_readiness_balanced_v1.csv')
    timeseries_dataset = load_score_dataset(BASE / 'datasets' / 'synthetic_readiness_timeseries_v1.csv')
    stress_dataset = load_score_dataset(BASE / 'datasets' / 'synthetic_readiness_stress_test_v1.csv')
    flat_classifier_dataset = load_flat_classifier_dataset(
        BASE / 'datasets' / 'synthetic_readiness_training_flat_v1.csv'
    )

    X_train = train_dataset['X']
    y_score = train_dataset['score']
    y_label = train_dataset['label']

    holdout_X_train, holdout_X_test, holdout_y_train, holdout_y_test = train_test_split(
        X_train,
        y_score,
        test_size=0.2,
        random_state=42,
    )

    regression_results: list[dict[str, Any]] = []
    for name, estimator in REGRESSION_CANDIDATES:
        pipeline = make_pipeline(MinMaxScaler(), estimator)
        cv = KFold(n_splits=5, shuffle=True, random_state=42)
        scores = cross_validate(
            pipeline,
            X_train,
            y_score,
            cv=cv,
            scoring={
                'neg_mae': 'neg_mean_absolute_error',
                'neg_rmse': 'neg_root_mean_squared_error',
            },
        )

        pipeline.fit(holdout_X_train, holdout_y_train)
        holdout_predictions = pipeline.predict(holdout_X_test)
        holdout_label_predictions = np.array([classify_score(value) for value in holdout_predictions])
        holdout_true_labels = np.array([classify_score(value) for value in holdout_y_test])

        stress_predictions = pipeline.predict(stress_dataset['X'])
        stress_labels = np.array([classify_score(value) for value in stress_predictions])

        timeseries_predictions = pipeline.predict(timeseries_dataset['X'])

        regression_results.append(
            {
                'candidate': name,
                'cv_mae_mean': round(float(-np.mean(scores['test_neg_mae'])), 4),
                'cv_rmse_mean': round(float(-np.mean(scores['test_neg_rmse'])), 4),
                'holdout_mae': round(float(mean_absolute_error(holdout_y_test, holdout_predictions)), 4),
                'holdout_rmse': round(float(np.sqrt(mean_squared_error(holdout_y_test, holdout_predictions))), 4),
                'holdout_label_macro_f1': round(
                    float(f1_score(holdout_true_labels, holdout_label_predictions, average='macro')),
                    4,
                ),
                'stress_optimistic_rate': round(
                    float(np.mean(np.isin(stress_labels, ['nearly_ready', 'ready']))),
                    4,
                ),
                'stress_ready_rate': round(float(np.mean(stress_labels == 'ready')), 4),
                'timeseries_mean_step_delta': round(
                    float(score_smoothness(timeseries_predictions, timeseries_dataset['hive_id'])),
                    4,
                ),
            }
        )

    classification_results: list[dict[str, Any]] = []
    classifier_X = flat_classifier_dataset['X']
    classifier_y = flat_classifier_dataset['label']
    holdout_classifier_X_train, holdout_classifier_X_test, holdout_classifier_y_train, holdout_classifier_y_test = train_test_split(
        classifier_X,
        classifier_y,
        test_size=0.2,
        random_state=42,
        stratify=classifier_y,
    )

    for name, estimator in CLASSIFICATION_BASELINES:
        pipeline = make_pipeline(MinMaxScaler(), estimator)
        cv = StratifiedKFold(n_splits=5, shuffle=True, random_state=42)
        scores = cross_validate(
            pipeline,
            classifier_X,
            classifier_y,
            cv=cv,
            scoring={'macro_f1': 'f1_macro'},
        )

        pipeline.fit(holdout_classifier_X_train, holdout_classifier_y_train)
        holdout_predictions = pipeline.predict(holdout_classifier_X_test)

        stress_predictions = pipeline.predict(stress_dataset['X'])
        timeseries_predictions = pipeline.predict(timeseries_dataset['X'])
        timeseries_scores = np.array(
            [
                {'not_ready': 0.25, 'approaching': 0.50, 'nearly_ready': 0.75, 'ready': 1.0}[label]
                for label in timeseries_predictions
            ]
        )

        classification_results.append(
            {
                'candidate': name,
                'cv_macro_f1_mean': round(float(np.mean(scores['test_macro_f1'])), 4),
                'holdout_label_macro_f1': round(
                    float(f1_score(holdout_classifier_y_test, holdout_predictions, average='macro')),
                    4,
                ),
                'stress_optimistic_rate': round(
                    float(np.mean(np.isin(stress_predictions, ['nearly_ready', 'ready']))),
                    4,
                ),
                'stress_ready_rate': round(float(np.mean(stress_predictions == 'ready')), 4),
                'timeseries_mean_step_delta': round(
                    float(score_smoothness(timeseries_scores, timeseries_dataset['hive_id'])),
                    4,
                ),
            }
        )

    best_regressor = sorted(
        regression_results,
        key=lambda item: (
            -item['holdout_label_macro_f1'],
            item['stress_optimistic_rate'],
            item['timeseries_mean_step_delta'],
        ),
    )[0]

    best_classifier = sorted(
        classification_results,
        key=lambda item: (
            -item['holdout_label_macro_f1'],
            item['stress_optimistic_rate'],
            item['timeseries_mean_step_delta'],
        ),
    )[0]

    return {
        'regression_results': regression_results,
        'classification_baselines': classification_results,
        'recommended_regressor': best_regressor,
        'recommended_classifier': best_classifier,
    }


def build_markdown(report: dict[str, Any]) -> str:
    lines = [
        '# Readiness Score Prototype Report',
        '',
        '## Recommended Direction',
        '',
        f"- Best score-model candidate: `{report['recommended_regressor']['candidate']}`",
        f"- Best classification baseline: `{report['recommended_classifier']['candidate']}`",
        '- Recommendation: keep hard threshold guardrails separate from the ML estimate, but carry a continuous readiness score forward as the next prototype target because it can be mapped back to UX labels while remaining smoother over time.',
        '',
        '## Regression Candidates',
        '',
        '| Candidate | CV MAE | CV RMSE | Holdout MAE | Holdout RMSE | Holdout Label Macro F1 | Stress Optimistic Rate | Stress Ready Rate | Timeseries Mean Step Delta |',
        '| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |',
    ]

    for result in report['regression_results']:
        lines.append(
            '| '
            f"`{result['candidate']}` | "
            f"{result['cv_mae_mean']:.4f} | "
            f"{result['cv_rmse_mean']:.4f} | "
            f"{result['holdout_mae']:.4f} | "
            f"{result['holdout_rmse']:.4f} | "
            f"{result['holdout_label_macro_f1']:.4f} | "
            f"{result['stress_optimistic_rate']:.4f} | "
            f"{result['stress_ready_rate']:.4f} | "
            f"{result['timeseries_mean_step_delta']:.4f} |"
        )

    lines.extend(
        [
            '',
            '## Classification Baselines',
            '',
            '| Candidate | CV Macro F1 | Holdout Label Macro F1 | Stress Optimistic Rate | Stress Ready Rate | Timeseries Mean Step Delta |',
            '| --- | ---: | ---: | ---: | ---: | ---: |',
        ]
    )

    for result in report['classification_baselines']:
        lines.append(
            '| '
            f"`{result['candidate']}` | "
            f"{result['cv_macro_f1_mean']:.4f} | "
            f"{result['holdout_label_macro_f1']:.4f} | "
            f"{result['stress_optimistic_rate']:.4f} | "
            f"{result['stress_ready_rate']:.4f} | "
            f"{result['timeseries_mean_step_delta']:.4f} |"
        )

    return '\n'.join(lines) + '\n'


def main() -> None:
    report = benchmark_regression_models()
    REPORT_DIR.mkdir(parents=True, exist_ok=True)

    json_path = REPORT_DIR / 'readiness_score_prototype_report.json'
    md_path = REPORT_DIR / 'readiness_score_prototype_report.md'

    json_path.write_text(json.dumps(report, indent=2) + '\n', encoding='utf-8')
    md_path.write_text(build_markdown(report), encoding='utf-8')

    print(f"recommended_regressor={report['recommended_regressor']['candidate']}")
    print(f"recommended_classifier={report['recommended_classifier']['candidate']}")
    print(f"json_report={json_path}")
    print(f"markdown_report={md_path}")


if __name__ == '__main__':
    main()
