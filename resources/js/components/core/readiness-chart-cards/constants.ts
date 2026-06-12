export const READINESS_LABELS: Record<string, string> = {
    not_ready: 'Not Ready',
    approaching: 'Approaching',
    nearly_ready: 'Nearly Ready',
    ready: 'Ready to Harvest',
    no_data: 'No Data',
};

export const READINESS_SOFT_STYLES: Record<string, string> = {
    not_ready: 'bg-rose-100 text-rose-700',
    approaching: 'bg-amber-100 text-amber-700',
    nearly_ready: 'bg-yellow-100 text-yellow-700',
    ready: 'bg-emerald-100 text-emerald-700',
};

export const READINESS_SOLID_COLORS: Record<string, string> = {
    not_ready: '#dc2626',
    approaching: '#d97706',
    nearly_ready: '#ca8a04',
    ready: '#16a34a',
    no_data: '#d6d3d1',
};

export function getReadinessLabel(level: string | null) {
    if (!level) {
return 'Awaiting Data';
}

    return READINESS_LABELS[level] ?? level;
}

export function getReadinessColor(level: string | null) {
    if (!level) {
return '#78716c';
}

    return READINESS_SOLID_COLORS[level] ?? '#d97706';
}
