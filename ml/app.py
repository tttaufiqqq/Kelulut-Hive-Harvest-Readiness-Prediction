from flask import Flask, request, jsonify
import pickle
import numpy as np
from pathlib import Path
import sys
import logging

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

HRI_MAP = {
    'not_ready':    0.25,
    'approaching':  0.50,
    'nearly_ready': 0.75,
    'ready':        1.00,
}

FEATURES = ['mq2_value', 'mq3_value', 'mq5_value', 'mq135_value', 'temp', 'humidity']


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
        X = np.array([[data[f] for f in FEATURES]])
        X_scaled = scaler.transform(X)

        label = model.predict(X_scaled)[0]
        proba = model.predict_proba(X_scaled)[0]
        confidence = float(max(proba))

        app.logger.info(f"Prediction: {label}, confidence {confidence}")
        return jsonify({
            'readiness_level':  label,
            'hri_value':        HRI_MAP[label],
            'confidence_score': round(confidence, 4),
        })
    except Exception as e:
        app.logger.exception("Prediction failed")
        return jsonify({'error': str(e)}), 500


# Passenger requires 'application' object
application = app

if __name__ == '__main__':
    # Local dev only; Passenger ignores this block
    app.run(host='0.0.0.0', port=5000, debug=True)
