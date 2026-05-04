from __future__ import annotations

import csv
import json
from pathlib import Path
from typing import Any

import numpy as np


FEATURES = ['mq2_value', 'mq3_value', 'mq5_value', 'mq135_value', 'temp', 'humidity']

HRI_MAP = {
    'not_ready': 0.25,
    'approaching': 0.50,
    'nearly_ready': 0.75,
    'ready': 1.00,
}

FEATURE_SENSOR_TYPES = {
    'mq2_value': 'mq2',
    'mq3_value': 'mq3',
    'mq5_value': 'mq5',
    'mq135_value': 'mq135',
    'temp': 'temp',
    'humidity': 'humidity',
}

LABEL_ORDER = {
    'not_ready': 0,
    'approaching': 1,
    'nearly_ready': 2,
    'ready': 3,
}

THRESHOLD_LEVEL_PRIORITY = {
    'normal': 1,
    'warning': 2,
    'critical': 3,
}

THRESHOLD_RULES = [
    {
        'sensor_type': 'temp',
        'min_value': 32.0,
        'max_value': 37.0,
        'level': 'normal',
        'meaning': 'Optimal hive temperature',
        'recommended_action': 'No action needed',
    },
    {
        'sensor_type': 'temp',
        'min_value': 37.1,
        'max_value': 40.0,
        'level': 'warning',
        'meaning': 'Temperature slightly elevated',
        'recommended_action': 'Monitor closely',
    },
    {
        'sensor_type': 'temp',
        'min_value': 40.1,
        'max_value': 99.0,
        'level': 'critical',
        'meaning': 'Dangerously high temperature',
        'recommended_action': 'Inspect hive immediately',
    },
    {
        'sensor_type': 'humidity',
        'min_value': 60.0,
        'max_value': 80.0,
        'level': 'normal',
        'meaning': 'Optimal humidity for honey curing',
        'recommended_action': 'No action needed',
    },
    {
        'sensor_type': 'humidity',
        'min_value': 80.1,
        'max_value': 90.0,
        'level': 'warning',
        'meaning': 'High humidity, risk of fermentation',
        'recommended_action': 'Improve ventilation',
    },
    {
        'sensor_type': 'humidity',
        'min_value': 90.1,
        'max_value': 100.0,
        'level': 'critical',
        'meaning': 'Excessive humidity',
        'recommended_action': 'Urgent ventilation fix',
    },
    {
        'sensor_type': 'mq2',
        'min_value': 0.0,
        'max_value': 300.0,
        'level': 'normal',
        'meaning': 'Normal smoke/gas levels',
        'recommended_action': 'No action needed',
    },
    {
        'sensor_type': 'mq2',
        'min_value': 301.0,
        'max_value': 500.0,
        'level': 'warning',
        'meaning': 'Elevated smoke/gas detected',
        'recommended_action': 'Check surrounding area',
    },
    {
        'sensor_type': 'mq2',
        'min_value': 501.0,
        'max_value': 9999.0,
        'level': 'critical',
        'meaning': 'High smoke/gas, possible threat',
        'recommended_action': 'Inspect hive urgently',
    },
    {
        'sensor_type': 'mq3',
        'min_value': 0.0,
        'max_value': 300.0,
        'level': 'normal',
        'meaning': 'Normal alcohol/gas levels',
        'recommended_action': 'No action needed',
    },
    {
        'sensor_type': 'mq3',
        'min_value': 301.0,
        'max_value': 500.0,
        'level': 'warning',
        'meaning': 'Elevated alcohol/gas detected',
        'recommended_action': 'Check surrounding area',
    },
    {
        'sensor_type': 'mq3',
        'min_value': 501.0,
        'max_value': 9999.0,
        'level': 'critical',
        'meaning': 'High alcohol/gas, possible threat',
        'recommended_action': 'Inspect hive urgently',
    },
    {
        'sensor_type': 'mq5',
        'min_value': 0.0,
        'max_value': 300.0,
        'level': 'normal',
        'meaning': 'Normal LPG/gas levels',
        'recommended_action': 'No action needed',
    },
    {
        'sensor_type': 'mq5',
        'min_value': 301.0,
        'max_value': 500.0,
        'level': 'warning',
        'meaning': 'Elevated LPG/gas detected',
        'recommended_action': 'Check surrounding area',
    },
    {
        'sensor_type': 'mq5',
        'min_value': 501.0,
        'max_value': 9999.0,
        'level': 'critical',
        'meaning': 'High LPG/gas, possible threat',
        'recommended_action': 'Inspect hive urgently',
    },
    {
        'sensor_type': 'mq135',
        'min_value': 0.0,
        'max_value': 300.0,
        'level': 'normal',
        'meaning': 'Normal air quality',
        'recommended_action': 'No action needed',
    },
    {
        'sensor_type': 'mq135',
        'min_value': 301.0,
        'max_value': 500.0,
        'level': 'warning',
        'meaning': 'Degraded air quality detected',
        'recommended_action': 'Check surrounding area',
    },
    {
        'sensor_type': 'mq135',
        'min_value': 501.0,
        'max_value': 9999.0,
        'level': 'critical',
        'meaning': 'Poor air quality, possible threat',
        'recommended_action': 'Inspect hive urgently',
    },
]


def derive_feature_bounds_from_dataset(dataset_path: Path) -> dict[str, dict[str, float]]:
    bounds = {
        feature: {'min': float('inf'), 'max': float('-inf')}
        for feature in FEATURES
    }

    with dataset_path.open(newline='', encoding='utf-8') as handle:
        reader = csv.DictReader(handle)
        for row in reader:
            for feature in FEATURES:
                value = float(row[feature])
                bounds[feature]['min'] = min(bounds[feature]['min'], value)
                bounds[feature]['max'] = max(bounds[feature]['max'], value)

    return bounds


def build_default_metadata(base: Path) -> dict[str, Any]:
    dataset_path = base / 'dataset.csv'
    feature_bounds = derive_feature_bounds_from_dataset(dataset_path)
    return {
        'model_version': 'legacy-knn-baseline-guarded-v1',
        'training_dataset': 'ml/dataset.csv',
        'training_rows': 200,
        'feature_order': FEATURES,
        'feature_bounds': feature_bounds,
        'label_mapping': HRI_MAP,
        'guardrail_policy': {
            'version': 'phase-1',
            'out_of_distribution_rule': 'flag any feature outside the active training min/max bounds',
            'critical_threshold_rule': 'downgrade or suppress optimistic predictions when threshold severity is critical',
            'warning_threshold_rule': 'annotate optimistic predictions when threshold severity is warning',
        },
    }


def load_model_metadata(base: Path) -> dict[str, Any]:
    metadata_path = base / 'model_metadata.json'
    if metadata_path.exists():
        return json.loads(metadata_path.read_text(encoding='utf-8'))
    return build_default_metadata(base)


def to_feature_array(data: dict[str, Any]) -> np.ndarray:
    return np.array([[float(data[feature]) for feature in FEATURES]])


def detect_out_of_distribution(
    data: dict[str, Any],
    feature_bounds: dict[str, dict[str, float]],
) -> list[dict[str, float | str]]:
    out_of_distribution_features: list[dict[str, float | str]] = []

    for feature in FEATURES:
        value = float(data[feature])
        minimum = float(feature_bounds[feature]['min'])
        maximum = float(feature_bounds[feature]['max'])

        if value < minimum or value > maximum:
            out_of_distribution_features.append(
                {
                    'feature': feature,
                    'value': value,
                    'min': minimum,
                    'max': maximum,
                }
            )

    return out_of_distribution_features


def match_threshold_rules(data: dict[str, Any]) -> list[dict[str, Any]]:
    sensor_values = {
        'temp': float(data['temp']),
        'humidity': float(data['humidity']),
        'mq2': float(data['mq2_value']),
        'mq3': float(data['mq3_value']),
        'mq5': float(data['mq5_value']),
        'mq135': float(data['mq135_value']),
    }

    matches: list[dict[str, Any]] = []
    for rule in THRESHOLD_RULES:
        reading = sensor_values[rule['sensor_type']]
        if rule['min_value'] <= reading <= rule['max_value']:
            matches.append({**rule, 'reading': reading})

    return matches


def highest_threshold_level(matches: list[dict[str, Any]]) -> str | None:
    if not matches:
        return None

    return max(
        matches,
        key=lambda match: THRESHOLD_LEVEL_PRIORITY[match['level']],
    )['level']


def build_prediction_warning(
    raw_label: str,
    final_label: str,
    guardrail_action: str,
    out_of_distribution_features: list[dict[str, Any]],
    threshold_level: str | None,
) -> str | None:
    messages: list[str] = []

    if out_of_distribution_features:
        features = ', '.join(item['feature'] for item in out_of_distribution_features)
        messages.append(
            f'Input is outside the training feature bounds for: {features}.'
        )

    if threshold_level == 'critical' and guardrail_action in {'downgrade', 'suppress'}:
        messages.append(
            f'Critical threshold signals override the optimistic raw ML prediction ({raw_label} -> {final_label}).'
        )
    elif guardrail_action == 'downgrade' and raw_label != final_label:
        messages.append(
            f'The low-trust raw ML prediction was downgraded ({raw_label} -> {final_label}).'
        )
    elif threshold_level == 'warning' and LABEL_ORDER[raw_label] >= LABEL_ORDER['nearly_ready']:
        messages.append(
            'Threshold warnings are active, so this optimistic ML output should be treated cautiously.'
        )

    if guardrail_action == 'suppress':
        messages.append('The final readiness state was suppressed to the safest baseline.')

    if not messages:
        return None

    return ' '.join(messages)


def apply_prediction_guardrails(
    raw_label: str,
    out_of_distribution_features: list[dict[str, Any]],
    threshold_matches: list[dict[str, Any]],
) -> dict[str, Any]:
    threshold_level = highest_threshold_level(threshold_matches)
    final_label = raw_label
    guardrail_action = 'none'

    optimistic_prediction = LABEL_ORDER[raw_label] >= LABEL_ORDER['nearly_ready']
    is_ood = bool(out_of_distribution_features)

    if optimistic_prediction and threshold_level == 'critical' and is_ood:
        final_label = 'not_ready'
        guardrail_action = 'suppress'
    elif optimistic_prediction and threshold_level == 'critical':
        final_label = 'approaching' if raw_label == 'ready' else 'not_ready'
        guardrail_action = 'downgrade'
    elif raw_label == 'ready' and is_ood:
        final_label = 'nearly_ready'
        guardrail_action = 'downgrade'
    elif optimistic_prediction and (threshold_level == 'warning' or is_ood):
        guardrail_action = 'annotate'

    prediction_warning = build_prediction_warning(
        raw_label=raw_label,
        final_label=final_label,
        guardrail_action=guardrail_action,
        out_of_distribution_features=out_of_distribution_features,
        threshold_level=threshold_level,
    )

    return {
        'readiness_level': final_label,
        'hri_value': HRI_MAP[final_label],
        'raw_readiness_level': raw_label,
        'raw_hri_value': HRI_MAP[raw_label],
        'guardrail_action': guardrail_action,
        'prediction_warning': prediction_warning,
        'threshold_warning_level': threshold_level,
    }


def build_prediction_response(
    *,
    data: dict[str, Any],
    raw_label: str,
    confidence: float,
    feature_bounds: dict[str, dict[str, float]],
) -> dict[str, Any]:
    out_of_distribution_features = detect_out_of_distribution(data, feature_bounds)
    threshold_matches = [
        match for match in match_threshold_rules(data) if match['level'] != 'normal'
    ]
    guarded_prediction = apply_prediction_guardrails(
        raw_label=raw_label,
        out_of_distribution_features=out_of_distribution_features,
        threshold_matches=threshold_matches,
    )

    return {
        **guarded_prediction,
        'confidence_score': round(float(confidence), 4),
        'out_of_distribution': bool(out_of_distribution_features),
        'out_of_distribution_features': out_of_distribution_features,
        'threshold_matches': threshold_matches,
    }
