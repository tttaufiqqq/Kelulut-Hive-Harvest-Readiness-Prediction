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

export const TRUST_ALERT_STYLES: Record<
    string,
    { container: string; icon: string }
> = {
    normal: {
        container: 'border-amber-200 bg-amber-50/80 text-amber-900',
        icon: 'text-amber-700',
    },
    warning: {
        container: 'border-amber-300 bg-amber-50 text-amber-950',
        icon: 'text-amber-700',
    },
    critical: {
        container: 'border-rose-300 bg-rose-50 text-rose-950',
        icon: 'text-rose-700',
    },
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
