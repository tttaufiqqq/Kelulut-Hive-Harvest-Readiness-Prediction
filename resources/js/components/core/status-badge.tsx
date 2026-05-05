import { cn } from '@/lib/utils';

type StatusBadgeTone = 'active' | 'inactive' | 'pending' | 'deactivated';

export interface StatusBadgeProps {
    status: string;
    className?: string;
    label?: string;
    tone?: StatusBadgeTone;
}

const TONE_STYLES: Record<StatusBadgeTone, string> = {
    active: 'bg-emerald-100 text-emerald-700',
    inactive: 'bg-rose-100 text-rose-600',
    pending: 'bg-amber-100 text-amber-700',
    deactivated: 'bg-gray-100 text-gray-500',
};

function normalizeStatus(status: string) {
    return status
        .trim()
        .toLowerCase()
        .replace(/[\s_]+/g, '-');
}

function resolveTone(
    normalizedStatus: string,
    tone?: StatusBadgeTone,
): StatusBadgeTone {
    if (tone) {
        return tone;
    }

    if (normalizedStatus === 'pending') {
        return 'pending';
    }

    if (normalizedStatus === 'active') {
        return 'active';
    }

    if (normalizedStatus === 'deactivated' || normalizedStatus === 'disabled') {
        return 'deactivated';
    }

    return 'inactive';
}

function resolveLabel(
    normalizedStatus: string,
    resolvedTone: StatusBadgeTone,
    label?: string,
) {
    if (label) {
        return label;
    }

    if (normalizedStatus === 'pending') {
        return 'Pending';
    }

    if (normalizedStatus === 'active') {
        return 'Active';
    }

    if (resolvedTone === 'deactivated') {
        return 'Deactivated';
    }

    return 'Inactive';
}

export function StatusBadge({
    status,
    className,
    label,
    tone,
}: StatusBadgeProps) {
    const normalizedStatus = normalizeStatus(status);
    const resolvedTone = resolveTone(normalizedStatus, tone);
    const resolvedLabel = resolveLabel(normalizedStatus, resolvedTone, label);

    return (
        <span
            className={cn(
                'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-bold',
                TONE_STYLES[resolvedTone],
                className,
            )}
        >
            {resolvedLabel}
        </span>
    );
}
