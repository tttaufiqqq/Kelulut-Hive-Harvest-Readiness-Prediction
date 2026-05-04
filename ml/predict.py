#!/usr/bin/env python3
import sys
import json
import pickle
from pathlib import Path

from runtime import FEATURES, build_prediction_response, load_model_metadata, to_feature_array

BASE = Path(__file__).parent

try:
    model  = pickle.load(open(BASE / 'model.pkl',  'rb'))
    scaler = pickle.load(open(BASE / 'scaler.pkl', 'rb'))
    metadata = load_model_metadata(BASE)

    data = json.loads(sys.argv[1])

    missing = [f for f in FEATURES if f not in data]
    if missing:
        print(json.dumps({'error': f'Missing fields: {missing}'}))
        sys.exit(1)

    X        = to_feature_array(data)
    X_scaled = scaler.transform(X)

    raw_label  = model.predict(X_scaled)[0]
    proba      = model.predict_proba(X_scaled)[0]
    confidence = float(max(proba))

    print(json.dumps(
        build_prediction_response(
            data=data,
            raw_label=raw_label,
            confidence=confidence,
            feature_bounds=metadata['feature_bounds'],
        )
    ))

except Exception as e:
    print(json.dumps({'error': str(e)}))
    sys.exit(1)
