#!/usr/bin/env python3
from __future__ import annotations

import json
import pickle
from pathlib import Path

from runtime import build_prediction_response, load_model_metadata, to_feature_array


BASE = Path(__file__).resolve().parent

MODEL = pickle.load(open(BASE / 'model.pkl', 'rb'))
SCALER = pickle.load(open(BASE / 'scaler.pkl', 'rb'))
METADATA = load_model_metadata(BASE)

CASES = [
    {
        'name': 'baseline_in_range',
        'payload': {
            'mq2_value': 145,
            'mq3_value': 160,
            'mq5_value': 235,
            'mq135_value': 280,
            'temp': 31.2,
            'humidity': 76.0,
        },
    },
    {
        'name': 'critical_and_ood_conflict',
        'payload': {
            'mq2_value': 175,
            'mq3_value': 190,
            'mq5_value': 540,
            'mq135_value': 610,
            'temp': 41.6,
            'humidity': 95.0,
        },
    },
    {
        'name': 'ood_without_critical_threshold',
        'payload': {
            'mq2_value': 170,
            'mq3_value': 188,
            'mq5_value': 250,
            'mq135_value': 295,
            'temp': 34.2,
            'humidity': 79.5,
        },
    },
]


def run_case(case: dict[str, object]) -> dict[str, object]:
    payload = case['payload']
    features = to_feature_array(payload)
    scaled = SCALER.transform(features)
    raw_label = MODEL.predict(scaled)[0]
    probabilities = MODEL.predict_proba(scaled)[0]
    confidence = float(max(probabilities))

    response = build_prediction_response(
        data=payload,
        raw_label=raw_label,
        confidence=confidence,
        feature_bounds=METADATA['feature_bounds'],
    )

    return {
        'name': case['name'],
        'payload': payload,
        'response': response,
    }


def main() -> None:
    results = [run_case(case) for case in CASES]
    print(json.dumps(results, indent=2))


if __name__ == '__main__':
    main()
