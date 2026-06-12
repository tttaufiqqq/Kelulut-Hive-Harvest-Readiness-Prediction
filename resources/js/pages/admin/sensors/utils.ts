export const MQ_GAUGE_MAX = 500;

export function toFiniteNumber(value: unknown): number | null {
    if (typeof value === 'number') return Number.isFinite(value) ? value : null;
    if (typeof value === 'string' && value.trim() !== '') {
        const parsed = Number(value);
        return Number.isFinite(parsed) ? parsed : null;
    }
    return null;
}

export function normalizeMissingReading(value: unknown): number | null {
    const numericValue = toFiniteNumber(value);
    if (numericValue === null || numericValue === 0) return null;
    return numericValue;
}

export function formatAnimatedReading(value: unknown, maxFractionDigits = 1): string {
    const numericValue = toFiniteNumber(value);
    if (numericValue === null) return '—';
    return numericValue.toFixed(maxFractionDigits).replace(/\.0$/, '');
}

export function tempColor(t: number): string {
    if (t > 37) return '#EF4444';
    if (t > 32) return '#F59E0B';
    return '#10B981';
}

export function humidColor(h: number): string {
    if (h > 85) return '#EF4444';
    if (h > 70) return '#F59E0B';
    return '#10B981';
}

export function mqColor(v: number): string {
    if (v > 300) return '#EF4444';
    if (v > 150) return '#F59E0B';
    return '#10B981';
}
