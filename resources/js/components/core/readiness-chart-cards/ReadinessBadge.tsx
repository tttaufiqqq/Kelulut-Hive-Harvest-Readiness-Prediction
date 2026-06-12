import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { READINESS_SOFT_STYLES, getReadinessColor, getReadinessLabel } from './constants';

export interface ReadinessBadgeProps {
    level: string | null;
    className?: string;
    emptyLabel?: ReactNode;
    size?: 'sm' | 'md';
    appearance?: 'soft' | 'solid';
}

export function ReadinessBadge({ level, className, emptyLabel = 'Awaiting Data', size = 'md', appearance = 'soft' }: ReadinessBadgeProps) {
    const label = level ? getReadinessLabel(level) : emptyLabel;
    const sizeStyles = { sm: 'px-3 py-1 text-xs font-bold', md: 'px-3.5 py-1.5 text-sm font-bold' };

    if (appearance === 'solid') {
        return (
            <span className={cn('inline-flex items-center rounded-full text-white shadow-sm', sizeStyles[size], className)} style={{ backgroundColor: getReadinessColor(level) }}>
                {label}
            </span>
        );
    }

    return (
        <span className={cn('inline-flex items-center rounded-full shadow-sm', READINESS_SOFT_STYLES[level ?? ''] ?? 'bg-stone-100 text-stone-700', sizeStyles[size], className)}>
            {label}
        </span>
    );
}
