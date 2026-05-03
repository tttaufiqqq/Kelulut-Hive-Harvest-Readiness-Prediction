#!/usr/bin/env python3
import sys
import json
import pickle
import numpy as np
from pathlib import Path

BASE = Path(__file__).parent

HRI_MAP = {
    'not_ready':    0.25,
    'approaching':  0.50,
    'nearly_ready': 0.75,
    'ready':        1.00,
}

FEATURES = ['mq2_value', 'mq3_value', 'mq5_value', 'mq135_value', 'temp', 'humidity']

try:
    model  = pickle.load(open(BASE / 'model.pkl',  'rb'))
    scaler = pickle.load(open(BASE / 'scaler.pkl', 'rb'))

    data = json.loads(sys.argv[1])

    missing = [f for f in FEATURES if f not in data]
    if missing:
        print(json.dumps({'error': f'Missing fields: {missing}'}))
        sys.exit(1)

    X        = np.array([[data[f] for f in FEATURES]])
    X_scaled = scaler.transform(X)

    label      = model.predict(X_scaled)[0]
    proba      = model.predict_proba(X_scaled)[0]
    confidence = float(max(proba))

    print(json.dumps({
        'readiness_level':  label,
        'hri_value':        HRI_MAP[label],
        'confidence_score': round(confidence, 4),
    }))

except Exception as e:
    print(json.dumps({'error': str(e)}))
    sys.exit(1)
