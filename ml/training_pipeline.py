from __future__ import annotations

import csv
import json
from dataclasses import dataclass
from pathlib import Path
from typing import Any

import numpy as np
from sklearn import __version__ as sklearn_version
from sklearn.ensemble import RandomForestClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import classification_report, confusion_matrix
from sklearn.model_selection import StratifiedKFold, cross_validate, train_test_split
from sklearn.neighbors import KNeighborsClassifier
from sklearn.pipeline import make_pipeline
from sklearn.preprocessing import MinMaxScaler

from runtime import FEATURES, HRI_MAP


BASE = Path(__file__).resolve().parent
DEFAULT_SEED = 42
CLASS_ORDER = ['not_ready', 'approaching', 'nearly_ready', 'ready']

DATASET_PRESETS = {
    'legacy': BASE / 'dataset.csv',
    'synthetic_flat': BASE / 'datasets' / 'synthetic_readiness_training_flat_v1.csv',
}

STRESS_TEST_DATASET = BASE / 'datasets' / 'synthetic_readiness_stress_test_v1.csv'


@dataclass(frozen=True)
class CandidateSpec:
    key: str
    family: str
    params: dict[str, Any]


BENCHMARK_CANDIDATES = [
    CandidateSpec('knn_k3_uniform', 'knn', {'n_neighbors': 3, 'weights': 'uniform'}),
    CandidateSpec('knn_k5_uniform', 'knn', {'n_neighbors': 5, 'weights': 'uniform'}),
    CandidateSpec('knn_k7_uniform', 'knn', {'n_neighbors': 7, 'weights': 'uniform'}),
    CandidateSpec('knn_k3_distance', 'knn', {'n_neighbors': 3, 'weights': 'distance'}),
    CandidateSpec('knn_k5_distance', 'knn', {'n_neighbors': 5, 'weights': 'distance'}),
    CandidateSpec('knn_k7_distance', 'knn', {'n_neighbors': 7, 'weights': 'distance'}),
    CandidateSpec(
        'logistic_regression',
        'logistic_regression',
        {'max_iter': 2000, 'random_state': DEFAULT_SEED, 'solver': 'lbfgs'},
    ),
    CandidateSpec(
        'random_forest',
        'random_forest',
        {'n_estimators': 300, 'random_state': DEFAULT_SEED, 'min_samples_leaf': 1},
    ),
]

SAFETY_OPTIMISM_THRESHOLD = 0.15


def resolve_dataset(dataset: str) -> Path:
    return DATASET_PRESETS.get(dataset, Path(dataset)).resolve()


def load_labeled_dataset(path: Path) -> tuple[np.ndarray, np.ndarray]:
    rows: list[list[float]] = []
    labels: list[str] = []

    with path.open(newline='', encoding='utf-8') as handle:
        reader = csv.DictReader(handle)
        for row in reader:
            rows.append([float(row[feature]) for feature in FEATURES])
            labels.append(row['label'])

    return np.array(rows, dtype=float), np.array(labels, dtype=object)


def load_stress_test_dataset(path: Path) -> tuple[np.ndarray, np.ndarray]:
    rows: list[list[float]] = []
    labels: list[str] = []

    with path.open(newline='', encoding='utf-8') as handle:
        reader = csv.DictReader(handle)
        for row in reader:
            rows.append([float(row[feature]) for feature in FEATURES])
            labels.append(row['readiness_level'])

    return np.array(rows, dtype=float), np.array(labels, dtype=object)


def dataset_summary(path: Path) -> dict[str, Any]:
    X, y = load_labeled_dataset(path)
    feature_bounds = {
        feature: {
            'min': round(float(X[:, index].min()), 4),
            'max': round(float(X[:, index].max()), 4),
        }
        for index, feature in enumerate(FEATURES)
    }

    class_counts = {
        label: int((y == label).sum())
        for label in CLASS_ORDER
    }

    return {
        'path': str(path),
        'rows': int(len(X)),
        'class_counts': class_counts,
        'feature_bounds': feature_bounds,
    }


def build_estimator(spec: CandidateSpec):
    if spec.family == 'knn':
        return KNeighborsClassifier(**spec.params)
    if spec.family == 'logistic_regression':
        return LogisticRegression(**spec.params)
    if spec.family == 'random_forest':
        return RandomForestClassifier(**spec.params)
    raise ValueError(f'Unsupported candidate family: {spec.family}')


def fit_scaled_model(
    spec: CandidateSpec,
    X_train: np.ndarray,
    y_train: np.ndarray,
) -> tuple[MinMaxScaler, Any]:
    scaler = MinMaxScaler()
    X_train_scaled = scaler.fit_transform(X_train)
    estimator = build_estimator(spec)
    estimator.fit(X_train_scaled, y_train)
    return scaler, estimator


def score_candidate(
    spec: CandidateSpec,
    X: np.ndarray,
    y: np.ndarray,
    stress_X: np.ndarray,
    seed: int = DEFAULT_SEED,
) -> dict[str, Any]:
    X_train, X_test, y_train, y_test = train_test_split(
        X,
        y,
        test_size=0.2,
        random_state=seed,
        stratify=y,
    )

    cv = StratifiedKFold(n_splits=5, shuffle=True, random_state=seed)
    estimator = make_pipeline(MinMaxScaler(), build_estimator(spec))

    cv_scores = cross_validate(
        estimator,
        X,
        y,
        cv=cv,
        scoring={
            'macro_f1': 'f1_macro',
            'precision_macro': 'precision_macro',
            'recall_macro': 'recall_macro',
        },
        n_jobs=None,
    )

    scaler, fitted = fit_scaled_model(spec, X_train, y_train)
    X_test_scaled = scaler.transform(X_test)
    y_pred = fitted.predict(X_test_scaled)

    report = classification_report(
        y_test,
        y_pred,
        labels=CLASS_ORDER,
        output_dict=True,
        zero_division=0,
    )
    matrix = confusion_matrix(y_test, y_pred, labels=CLASS_ORDER)

    stress_scaled = scaler.transform(stress_X)
    stress_pred = fitted.predict(stress_scaled)
    stress_proba = fitted.predict_proba(stress_scaled)
    stress_max_proba = np.max(stress_proba, axis=1)

    optimistic_mask = np.isin(stress_pred, ['nearly_ready', 'ready'])
    ready_mask = stress_pred == 'ready'

    return {
        'candidate': spec.key,
        'family': spec.family,
        'params': spec.params,
        'cv_macro_f1_mean': round(float(np.mean(cv_scores['test_macro_f1'])), 4),
        'cv_macro_f1_std': round(float(np.std(cv_scores['test_macro_f1'])), 4),
        'cv_precision_macro_mean': round(float(np.mean(cv_scores['test_precision_macro'])), 4),
        'cv_recall_macro_mean': round(float(np.mean(cv_scores['test_recall_macro'])), 4),
        'holdout_accuracy': round(float(np.mean(y_pred == y_test)), 4),
        'holdout_confusion_matrix': {
            actual: {
                predicted: int(matrix[row_index][column_index])
                for column_index, predicted in enumerate(CLASS_ORDER)
            }
            for row_index, actual in enumerate(CLASS_ORDER)
        },
        'holdout_per_class': {
            label: {
                'precision': round(float(report[label]['precision']), 4),
                'recall': round(float(report[label]['recall']), 4),
                'f1_score': round(float(report[label]['f1-score']), 4),
                'support': int(report[label]['support']),
            }
            for label in CLASS_ORDER
        },
        'stress_mean_max_probability': round(float(np.mean(stress_max_proba)), 4),
        'stress_p95_max_probability': round(float(np.percentile(stress_max_proba, 95)), 4),
        'stress_ready_rate': round(float(np.mean(ready_mask)), 4),
        'stress_optimistic_rate': round(float(np.mean(optimistic_mask)), 4),
    }


def choose_recommended_candidate(results: list[dict[str, Any]]) -> dict[str, Any]:
    eligible = [
        result
        for result in results
        if result['stress_optimistic_rate'] <= SAFETY_OPTIMISM_THRESHOLD
    ]

    deployment_blocked = not eligible
    candidate_pool = eligible if eligible else results
    selected = sorted(
        candidate_pool,
        key=lambda item: (
            -item['cv_macro_f1_mean'],
            item['stress_mean_max_probability'],
            item['stress_ready_rate'],
        ),
    )[0]

    reason = (
        'At least one candidate stayed below the stress optimism safety threshold.'
        if eligible
        else 'All candidates remained too optimistic on the stress dataset, so deployment should stay blocked.'
    )

    return {
        'deployment_blocked': deployment_blocked,
        'stress_optimism_threshold': SAFETY_OPTIMISM_THRESHOLD,
        'reason': reason,
        'candidate': selected,
    }


def choose_best_candidate(results: list[dict[str, Any]]) -> dict[str, Any]:
    return sorted(
        results,
        key=lambda item: (
            -item['cv_macro_f1_mean'],
            item['stress_optimistic_rate'],
            item['stress_mean_max_probability'],
        ),
    )[0]


def benchmark_all_datasets(seed: int = DEFAULT_SEED) -> dict[str, Any]:
    stress_X, _ = load_stress_test_dataset(STRESS_TEST_DATASET)
    datasets: dict[str, Any] = {}

    for dataset_name, dataset_path in DATASET_PRESETS.items():
        X, y = load_labeled_dataset(dataset_path)
        results = [
            score_candidate(spec, X, y, stress_X, seed=seed)
            for spec in BENCHMARK_CANDIDATES
        ]
        datasets[dataset_name] = {
            'summary': dataset_summary(dataset_path),
            'results': results,
            'best_macro_f1_candidate': choose_best_candidate(results),
            'recommended_candidate': choose_recommended_candidate(results),
        }

    return {
        'sklearn_version': sklearn_version,
        'features': FEATURES,
        'class_order': CLASS_ORDER,
        'stress_test_dataset': str(STRESS_TEST_DATASET),
        'datasets': datasets,
    }


def build_report_markdown(report: dict[str, Any]) -> str:
    lines = [
        '# ML Benchmark Report',
        '',
        f"- `scikit-learn` version: `{report['sklearn_version']}`",
        f"- Stress-test dataset: `{report['stress_test_dataset']}`",
        f"- Feature order: `{', '.join(report['features'])}`",
        '',
    ]

    for dataset_name, payload in report['datasets'].items():
        summary = payload['summary']
        best = payload['best_macro_f1_candidate']
        recommended = payload['recommended_candidate']
        recommended_candidate = recommended['candidate']

        lines.extend(
            [
                f'## Dataset: `{dataset_name}`',
                '',
                f"- Source: `{summary['path']}`",
                f"- Rows: `{summary['rows']}`",
                f"- Class counts: `{json.dumps(summary['class_counts'])}`",
                f"- Highest macro-F1 candidate: `{best['candidate']}`",
                f"- Highest macro-F1 score: `{best['cv_macro_f1_mean']}`",
                f"- Recommended candidate: `{recommended_candidate['candidate']}`",
                f"- Recommended candidate blocked for deployment: `{str(recommended['deployment_blocked']).lower()}`",
                f"- Recommendation note: {recommended['reason']}",
                '',
                '| Candidate | CV Macro F1 | CV Precision | CV Recall | Holdout Acc | Stress Mean Max Prob | Stress Optimistic Rate | Stress Ready Rate |',
                '| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |',
            ]
        )

        for result in payload['results']:
            lines.append(
                '| '
                f"`{result['candidate']}` | "
                f"{result['cv_macro_f1_mean']:.4f} | "
                f"{result['cv_precision_macro_mean']:.4f} | "
                f"{result['cv_recall_macro_mean']:.4f} | "
                f"{result['holdout_accuracy']:.4f} | "
                f"{result['stress_mean_max_probability']:.4f} | "
                f"{result['stress_optimistic_rate']:.4f} | "
                f"{result['stress_ready_rate']:.4f} |"
            )

        lines.append('')

    return '\n'.join(lines) + '\n'


def train_and_save_model(
    *,
    dataset: str,
    candidate_key: str,
    output_model: Path,
    output_scaler: Path,
    output_metadata: Path,
    seed: int = DEFAULT_SEED,
) -> dict[str, Any]:
    dataset_path = resolve_dataset(dataset)
    X, y = load_labeled_dataset(dataset_path)

    candidate = next(
        spec for spec in BENCHMARK_CANDIDATES if spec.key == candidate_key
    )
    scaler, model = fit_scaled_model(candidate, X, y)

    output_model.parent.mkdir(parents=True, exist_ok=True)
    output_scaler.parent.mkdir(parents=True, exist_ok=True)
    output_metadata.parent.mkdir(parents=True, exist_ok=True)

    import pickle

    with output_model.open('wb') as model_handle:
        pickle.dump(model, model_handle)
    with output_scaler.open('wb') as scaler_handle:
        pickle.dump(scaler, scaler_handle)

    feature_bounds = {
        feature: {
            'min': round(float(X[:, index].min()), 4),
            'max': round(float(X[:, index].max()), 4),
        }
        for index, feature in enumerate(FEATURES)
    }

    metadata = {
        'model_version': f'{candidate.key}-{dataset_path.stem}-sklearn-{sklearn_version}',
        'training_dataset': str(dataset_path),
        'training_rows': int(len(X)),
        'feature_order': FEATURES,
        'feature_bounds': feature_bounds,
        'label_mapping': HRI_MAP,
        'model_family': candidate.family,
        'model_params': candidate.params,
        'training_seed': seed,
        'scaler': 'MinMaxScaler',
        'sklearn_version': sklearn_version,
    }

    output_metadata.write_text(json.dumps(metadata, indent=2) + '\n', encoding='utf-8')
    return metadata
