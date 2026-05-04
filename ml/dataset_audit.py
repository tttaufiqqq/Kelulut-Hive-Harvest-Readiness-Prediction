#!/usr/bin/env python3
from __future__ import annotations

import csv
import json
from pathlib import Path
from typing import Any

from runtime import FEATURES


BASE = Path(__file__).resolve().parent
REPORT_DIR = BASE / 'reports'

DATASET_SPECS = [
    {
        'name': 'legacy_baseline',
        'path': BASE / 'dataset.csv',
        'label_column': 'label',
        'source_type': 'synthetic_legacy',
        'intended_role': 'archived baseline comparison only',
        'label_provenance': 'notebook-generated Gaussian anchors per class',
    },
    {
        'name': 'synthetic_balanced_v1',
        'path': BASE / 'datasets' / 'synthetic_readiness_balanced_v1.csv',
        'label_column': 'readiness_level',
        'source_type': 'synthetic_balanced',
        'intended_role': 'fair prototyping and class-balanced evaluation',
        'label_provenance': 'synthetic readiness rules from latent maturity and stress variables',
    },
    {
        'name': 'synthetic_training_flat_v1',
        'path': BASE / 'datasets' / 'synthetic_readiness_training_flat_v1.csv',
        'label_column': 'label',
        'source_type': 'synthetic_training',
        'intended_role': 'API-compatible retraining experiments',
        'label_provenance': 'flattened export of the balanced synthetic dataset',
    },
    {
        'name': 'synthetic_timeseries_v1',
        'path': BASE / 'datasets' / 'synthetic_readiness_timeseries_v1.csv',
        'label_column': 'readiness_level',
        'source_type': 'synthetic_timeseries',
        'intended_role': 'sequence stability, drift, and UI playback checks',
        'label_provenance': 'synthetic readiness rules with time continuity',
    },
    {
        'name': 'synthetic_stress_test_v1',
        'path': BASE / 'datasets' / 'synthetic_readiness_stress_test_v1.csv',
        'label_column': 'readiness_level',
        'source_type': 'synthetic_stress_test',
        'intended_role': 'OOD, anomaly, and safety validation only',
        'label_provenance': 'synthetic stress scenarios and explicit outlier cases',
    },
]

REPO_LIVE_LIKE_RANGE = {
    'name': 'repo_seeded_live_like_sensor_logs',
    'source_type': 'development_seed_data',
    'reference': 'database/seeders/SensorLogSeeder.php',
    'intended_role': 'UI/demo realism and live-like range comparison only',
    'feature_bounds': {
        'mq2_value': {'min': 160.0, 'max': 450.0},
        'mq3_value': {'min': 160.0, 'max': 450.0},
        'mq5_value': {'min': 160.0, 'max': 450.0},
        'mq135_value': {'min': 160.0, 'max': 450.0},
        'temp': {'min': 31.2, 'max': 36.8},
        'humidity': {'min': 65.2, 'max': 76.8},
    },
    'notes': 'These are generated development values, not validated harvest-readiness labels.',
}

INGEST_LIMITS = {
    'name': 'sensor_ingest_validation_limits',
    'source_type': 'api_acceptance_range',
    'reference': 'app/Http/Controllers/SensorController.php',
    'intended_role': 'hard API bounds for accepted live payloads',
    'feature_bounds': {
        'mq2_value': {'min': 0.0, 'max': 4095.0},
        'mq3_value': {'min': 0.0, 'max': 4095.0},
        'mq5_value': {'min': 0.0, 'max': 4095.0},
        'mq135_value': {'min': 0.0, 'max': 4095.0},
        'temp': {'min': -10.0, 'max': 60.0},
        'humidity': {'min': 0.0, 'max': 100.0},
    },
    'notes': 'These are acceptance limits, not evidence-backed training ranges.',
}


def summarize_csv_dataset(spec: dict[str, Any]) -> dict[str, Any]:
    path = spec['path']
    bounds = {
        feature: {'min': float('inf'), 'max': float('-inf')}
        for feature in FEATURES
    }
    label_counts: dict[str, int] = {}
    rows = 0

    with path.open(newline='', encoding='utf-8') as handle:
        reader = csv.DictReader(handle)
        for row in reader:
            rows += 1
            label = row[spec['label_column']]
            label_counts[label] = label_counts.get(label, 0) + 1
            for feature in FEATURES:
                value = float(row[feature])
                bounds[feature]['min'] = min(bounds[feature]['min'], value)
                bounds[feature]['max'] = max(bounds[feature]['max'], value)

    return {
        'name': spec['name'],
        'path': str(path),
        'source_type': spec['source_type'],
        'intended_role': spec['intended_role'],
        'label_provenance': spec['label_provenance'],
        'rows': rows,
        'label_counts': label_counts,
        'feature_bounds': bounds,
    }


def format_range(lower: float, upper: float) -> str:
    return f'{lower:.1f} to {upper:.1f}'


def compare_with_live_like(feature_bounds: dict[str, dict[str, float]]) -> dict[str, str]:
    comparisons: dict[str, str] = {}

    for feature in FEATURES:
        dataset_max = feature_bounds[feature]['max']
        live_like_max = REPO_LIVE_LIKE_RANGE['feature_bounds'][feature]['max']
        if dataset_max < live_like_max:
            comparisons[feature] = 'under-covers upper live-like range'
        else:
            comparisons[feature] = 'covers or exceeds seeded live-like upper range'

    return comparisons


def build_report_markdown(summary: dict[str, Any]) -> str:
    lines = [
        '# Dataset Audit Report',
        '',
        '## Source Catalog',
        '',
        '| Source | Type | Intended Role | Label Provenance |',
        '| --- | --- | --- | --- |',
    ]

    for dataset in summary['datasets']:
        lines.append(
            '| '
            f"`{dataset['name']}` | "
            f"{dataset['source_type']} | "
            f"{dataset['intended_role']} | "
            f"{dataset['label_provenance']} |"
        )

    lines.extend(
        [
            '',
            '## Coverage Comparison',
            '',
            '| Source | MQ2 | MQ3 | MQ5 | MQ135 | Temp | Humidity |',
            '| --- | --- | --- | --- | --- | --- | --- |',
        ]
    )

    for dataset in summary['datasets']:
        bounds = dataset['feature_bounds']
        lines.append(
            '| '
            f"`{dataset['name']}` | "
            f"{format_range(bounds['mq2_value']['min'], bounds['mq2_value']['max'])} | "
            f"{format_range(bounds['mq3_value']['min'], bounds['mq3_value']['max'])} | "
            f"{format_range(bounds['mq5_value']['min'], bounds['mq5_value']['max'])} | "
            f"{format_range(bounds['mq135_value']['min'], bounds['mq135_value']['max'])} | "
            f"{format_range(bounds['temp']['min'], bounds['temp']['max'])} | "
            f"{format_range(bounds['humidity']['min'], bounds['humidity']['max'])} |"
        )

    for reference in summary['reference_ranges']:
        bounds = reference['feature_bounds']
        lines.append(
            '| '
            f"`{reference['name']}` | "
            f"{format_range(bounds['mq2_value']['min'], bounds['mq2_value']['max'])} | "
            f"{format_range(bounds['mq3_value']['min'], bounds['mq3_value']['max'])} | "
            f"{format_range(bounds['mq5_value']['min'], bounds['mq5_value']['max'])} | "
            f"{format_range(bounds['mq135_value']['min'], bounds['mq135_value']['max'])} | "
            f"{format_range(bounds['temp']['min'], bounds['temp']['max'])} | "
            f"{format_range(bounds['humidity']['min'], bounds['humidity']['max'])} |"
        )

    lines.extend(
        [
            '',
            '## Key Findings',
            '',
            '- `ml/dataset.csv` is not real field data; it is a notebook-generated synthetic baseline and should be treated as an archived comparison set.',
            '- The repo contains no expert-labeled real harvest-readiness dataset. Current readiness labels in committed ML datasets are synthetic-rule labels, while seeded Laravel predictions are heuristic timeline labels.',
            '- The legacy dataset materially under-covers the upper gas and temperature ranges represented by the repo-seeded live-like sensor logs, which explains the strong out-of-distribution pressure seen in Phase 1 and Phase 2.',
            '- `synthetic_readiness_stress_test_v1.csv` should stay evaluation-only, because it intentionally contains anomaly and outlier cases that would distort normal training.',
            '- `synthetic_readiness_timeseries_v1.csv` should stay sequence-evaluation-only for stability and drift checks instead of being randomly mixed into flat training.',
        ]
    )

    return '\n'.join(lines) + '\n'


def main() -> None:
    datasets = [summarize_csv_dataset(spec) for spec in DATASET_SPECS]
    summary = {
        'datasets': datasets,
        'reference_ranges': [REPO_LIVE_LIKE_RANGE, INGEST_LIMITS],
        'live_like_comparisons': {
            dataset['name']: compare_with_live_like(dataset['feature_bounds'])
            for dataset in datasets
        },
    }

    REPORT_DIR.mkdir(parents=True, exist_ok=True)
    json_path = REPORT_DIR / 'dataset_audit_report.json'
    md_path = REPORT_DIR / 'dataset_audit_report.md'

    json_path.write_text(json.dumps(summary, indent=2) + '\n', encoding='utf-8')
    md_path.write_text(build_report_markdown(summary), encoding='utf-8')

    print(f'json_report={json_path}')
    print(f'markdown_report={md_path}')


if __name__ == '__main__':
    main()
