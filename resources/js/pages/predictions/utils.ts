import type { PredictionEntry } from './types';

export const TRUST_STYLES: Record<string, string> = {
    normal: 'bg-emerald-100 text-emerald-700',
    warning: 'bg-amber-100 text-amber-800',
    critical: 'bg-rose-100 text-rose-700',
};

export const ROW_TONE_STYLES: Record<string, string> = {
    normal: 'hover:bg-yellow-50/30',
    warning: 'bg-amber-50/35 hover:bg-amber-50/60',
    critical: 'bg-rose-50/45 hover:bg-rose-50/70',
};

export const TRUST_ALERT_STYLES: Record<string, { container: string }> = {
    normal: { container: 'border-amber-200 bg-amber-50/80 text-amber-900' },
    warning: { container: 'border-amber-300 bg-amber-50 text-amber-950' },
    critical: { container: 'border-rose-300 bg-rose-50 text-rose-950' },
};

export const READINESS_BAR_STYLES: Record<string, string> = {
    not_ready: 'bg-rose-400',
    approaching: 'bg-amber-400',
    nearly_ready: 'bg-yellow-400',
    ready: 'bg-emerald-400',
};

export const TOOLTIP_STYLE = {
    backgroundColor: '#FFFBEB',
    border: '1px solid #FEF3C7',
    borderRadius: '12px',
    fontSize: '12px',
    fontWeight: 'bold',
    color: '#78350F',
};

const SENSOR_LEVEL_CLASSES: Record<string, string> = {
    critical: 'text-red-600',
    warning: 'text-amber-600',
};

export function formatAnimatedReading(value: number, maxFractionDigits = 1): string {
    return value.toFixed(maxFractionDigits).replace(/\.0$/, '');
}

export function formatSensorReading(value: number | null, suffix = '', maxFractionDigits = 0): string {
    if (value === null) {
return '—';
}

    return `${formatAnimatedReading(value, maxFractionDigits)}${suffix}`;
}

export function formatRawConfidence(score: number): string {
    if (score >= 0.9995) {
return 'Approx. 99.9%+';
}

    return `${(score * 100).toFixed(1)}%`;
}

export function getTrustLabel(prediction: PredictionEntry): string {
    if (prediction.warning_state === 'critical') {
return 'Low trust';
}

    if (prediction.warning_state === 'warning') {
return 'Use caution';
}

    return 'Trusted';
}

export function getTrustStyle(state: string): string {
    return TRUST_STYLES[state] ?? 'bg-stone-100 text-stone-700';
}

export function getRowToneStyle(state: string): string {
    return ROW_TONE_STYLES[state] ?? 'hover:bg-yellow-50/30';
}

export function getTrustAlertStyle(state: string): { container: string } {
    return TRUST_ALERT_STYLES[state] ?? { container: 'border-amber-200 bg-amber-50/80 text-amber-900' };
}

export function formatPredictionTime(prediction: PredictionEntry): string {
    return prediction.prediction_timestamp_label ?? prediction.prediction_timestamp ?? 'N/A';
}

export function formatCapturedTime(prediction: PredictionEntry): string {
    return prediction.record_timestamp_label ?? prediction.record_timestamp ?? 'N/A';
}

export function sensorLevelClass(sensorType: string, thresholdMap: Record<string, string>): string {
    const level = thresholdMap[sensorType];

    return SENSOR_LEVEL_CLASSES[level] ?? 'text-amber-900';
}

export function formatSecondsAgo(secondsAgo: number): string {
    if (secondsAgo < 60) {
return 'Just now';
}

    if (secondsAgo < 3600) {
return `${Math.floor(secondsAgo / 60)} min ago`;
}

    if (secondsAgo < 86400) {
return `${Math.floor(secondsAgo / 3600)} hr ago`;
}

    return `${Math.floor(secondsAgo / 86400)} days ago`;
}
