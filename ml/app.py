from flask import Flask, request, jsonify
import pickle
import numpy as np
from pathlib import Path

app = Flask(__name__)

BASE = Path(__file__).parent

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
    return jsonify({'status': 'ok', 'model': 'KNN'})


@app.route('/predict', methods=['POST'])
def predict():
    data = request.get_json(silent=True)
    if not data:
        return jsonify({'error': 'Invalid JSON body'}), 400

    missing = [f for f in FEATURES if f not in data]
    if missing:
        return jsonify({'error': f'Missing fields: {missing}'}), 400

    try:
        X = np.array([[data[f] for f in FEATURES]])
        X_scaled = scaler.transform(X)

        label = model.predict(X_scaled)[0]
        proba = model.predict_proba(X_scaled)[0]
        confidence = float(max(proba))

        return jsonify({
            'readiness_level':  label,
            'hri_value':        HRI_MAP[label],
            'confidence_score': round(confidence, 4),
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500


if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
