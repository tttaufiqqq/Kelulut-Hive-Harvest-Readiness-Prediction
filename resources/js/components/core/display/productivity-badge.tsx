import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

const PRODUCTIVITY_STYLES: Record<string, string> = {
    low: 'bg-rose-100 text-rose-700',
    medium: 'bg-amber-100 text-amber-700',
    high: 'bg-emerald-100 text-emerald-700',
};

export interface ProductivityBadgeProps {
    level: string | null;
    className?: string;
    label?: string;
    emptyLabel?: ReactNode;
}

export function ProductivityBadge({
    level,
    className,
    label,
    emptyLabel = '—',
}: ProductivityBadgeProps) {
    if (!level) {
        return (
            <span className={cn('text-amber-900/30', className)}>
                {emptyLabel}
            </span>
        );
    }

    const normalizedLevel = level.trim().toLowerCase();
    const resolvedLabel =
        label ??
        normalizedLevel.charAt(0).toUpperCase() + normalizedLevel.slice(1);

    return (
        <span
            className={cn(
                'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-bold',
                PRODUCTIVITY_STYLES[normalizedLevel] ??
                    'bg-gray-100 text-gray-500',
                className,
            )}
        >
            {resolvedLabel}
        </span>
    );
}
