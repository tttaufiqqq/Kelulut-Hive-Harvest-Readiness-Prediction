from flask import Flask, request, jsonify
import pickle
from pathlib import Path
import sys
import logging

from runtime import FEATURES, build_prediction_response, load_model_metadata, to_feature_array

app = Flask(__name__)

# Configure logging to stderr so Passenger logs capture it
logging.basicConfig(
    stream=sys.stderr,
    level=logging.DEBUG,
    format="%(asctime)s [%(levelname)s] %(message)s"
)

BASE = Path(__file__).parent

# Load model and scaler
model = pickle.load(open(BASE / 'model.pkl', 'rb'))
scaler = pickle.load(open(BASE / 'scaler.pkl', 'rb'))
metadata = load_model_metadata(BASE)


@app.route('/health', methods=['GET'])
def health():
    app.logger.info("Health check endpoint called")
    return jsonify({'status': 'ok', 'model': 'KNN'})


@app.route('/predict', methods=['POST'])
def predict():
    data = request.get_json(silent=True)
    if not data:
        app.logger.error("Invalid JSON body received")
        return jsonify({'error': 'Invalid JSON body'}), 400

    missing = [f for f in FEATURES if f not in data]
    if missing:
        app.logger.error(f"Missing fields: {missing}")
        return jsonify({'error': f'Missing fields: {missing}'}), 400

    try:
        X = to_feature_array(data)
        X_scaled = scaler.transform(X)

        raw_label = model.predict(X_scaled)[0]
        proba = model.predict_proba(X_scaled)[0]
        confidence = float(max(proba))
        response = build_prediction_response(
            data=data,
            raw_label=raw_label,
            confidence=confidence,
            feature_bounds=metadata['feature_bounds'],
            metadata=metadata,
        )

        app.logger.info(
            "Prediction raw=%s guarded=%s confidence=%.4f ood=%s action=%s",
            raw_label,
            response['readiness_level'],
            confidence,
            response['out_of_distribution'],
            response['guardrail_action'],
        )
        return jsonify(response)
    except Exception as e:
        app.logger.exception("Prediction failed")
        return jsonify({'error': str(e)}), 500


# Passenger requires 'application' object
application = app

if __name__ == '__main__':
    # Local dev only; Passenger ignores this block
    app.run(host='0.0.0.0', port=5000, debug=True)
