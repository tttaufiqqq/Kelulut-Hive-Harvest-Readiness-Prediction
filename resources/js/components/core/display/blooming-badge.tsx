import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

const BLOOMING_STYLES: Record<string, string> = {
    pre_bloom: 'bg-sky-100 text-sky-700',
    early_bloom: 'bg-lime-100 text-lime-700',
    peak_bloom: 'bg-emerald-100 text-emerald-700',
    post_bloom: 'bg-amber-100 text-amber-700',
    dormant: 'bg-gray-100 text-gray-500',
};

const BLOOMING_LABELS: Record<string, string> = {
    pre_bloom: 'Pre-Bloom',
    early_bloom: 'Early Bloom',
    peak_bloom: 'Peak Bloom',
    post_bloom: 'Post-Bloom',
    dormant: 'Dormant',
};

export interface BloomingBadgeProps {
    status: string | null;
    className?: string;
    label?: string;
    emptyLabel?: ReactNode;
}

export function BloomingBadge({
    status,
    className,
    label,
    emptyLabel = '—',
}: BloomingBadgeProps) {
    if (!status) {
        return (
            <span className={cn('text-amber-900/30', className)}>
                {emptyLabel}
            </span>
        );
    }

    return (
        <span
            className={cn(
                'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-bold',
                BLOOMING_STYLES[status] ?? 'bg-gray-100 text-gray-500',
                className,
            )}
        >
            {label ?? BLOOMING_LABELS[status] ?? status}
        </span>
    );
}
