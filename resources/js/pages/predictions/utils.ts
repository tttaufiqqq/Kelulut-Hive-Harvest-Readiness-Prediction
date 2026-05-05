import {
    ROW_TONE_STYLES,
    TRUST_ALERT_STYLES,
    TRUST_STYLES,
} from './constants';
import type { PredictionEntry } from './types';

export function formatAnimatedReading(
    value: number,
    maxFractionDigits = 1,
): string {
    return value.toFixed(maxFractionDigits).replace(/\.0$/, '');
}

export function formatRawConfidence(score: number) {
    if (score >= 0.9995) {
        return 'Approx. 99.9%+';
    }

    return `${(score * 100).toFixed(1)}%`;
}

export function getTrustLabel(prediction: PredictionEntry) {
    if (prediction.warning_state === 'critical') {
        return 'Low trust';
    }

    if (prediction.warning_state === 'warning') {
        return 'Use caution';
    }

    return 'Trusted';
}

export function getTrustStyle(state: string) {
    return TRUST_STYLES[state] ?? 'bg-stone-100 text-stone-700';
}

export function getRowToneStyle(state: string) {
    return ROW_TONE_STYLES[state] ?? 'hover:bg-yellow-50/30';
}

export function getTrustAlertStyle(state: string) {
    return (
        TRUST_ALERT_STYLES[state] ?? {
            container: 'border-amber-200 bg-amber-50/80 text-amber-900',
            icon: 'text-amber-700',
        }
    );
}

export function formatPredictionTime(prediction: PredictionEntry) {
    return (
        prediction.prediction_timestamp_label ??
        prediction.prediction_timestamp ??
        'N/A'
    );
}

export function formatCapturedTime(prediction: PredictionEntry) {
    return (
        prediction.record_timestamp_label ??
        prediction.record_timestamp ??
        'N/A'
    );
}
