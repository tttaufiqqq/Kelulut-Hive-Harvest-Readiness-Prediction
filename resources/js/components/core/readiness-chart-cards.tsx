import type { ReactNode } from 'react';
import { Card } from '@/components/core/card';
import { Progress } from '@/components/core/feedback';
import { cn } from '@/lib/utils';

export const READINESS_LABELS: Record<string, string> = {
    not_ready: 'Not Ready',
    approaching: 'Approaching',
    nearly_ready: 'Nearly Ready',
    ready: 'Ready to Harvest',
};

const READINESS_SOFT_STYLES: Record<string, string> = {
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
};

export interface ReadinessBadgeProps {
    level: string | null;
    className?: string;
    emptyLabel?: ReactNode;
    size?: 'sm' | 'md';
    appearance?: 'soft' | 'solid';
}

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

export function ReadinessBadge({
    level,
    className,
    emptyLabel = 'Awaiting Data',
    size = 'md',
    appearance = 'soft',
}: ReadinessBadgeProps) {
    const label = level ? getReadinessLabel(level) : emptyLabel;
    const sizeStyles = {
        sm: 'px-3 py-1 text-xs font-bold',
        md: 'px-3.5 py-1.5 text-sm font-bold',
    };

    if (appearance === 'solid') {
        return (
            <span
                className={cn(
                    'inline-flex items-center rounded-full text-white shadow-sm',
                    sizeStyles[size],
                    className,
                )}
                style={{ backgroundColor: getReadinessColor(level) }}
            >
                {label}
            </span>
        );
    }

    return (
        <span
            className={cn(
                'inline-flex items-center rounded-full shadow-sm',
                READINESS_SOFT_STYLES[level ?? ''] ??
                    'bg-stone-100 text-stone-700',
                sizeStyles[size],
                className,
            )}
        >
            {label}
        </span>
    );
}

export interface ChartCardProps {
    children: ReactNode;
    className?: string;
    contentClassName?: string;
    eyebrow?: ReactNode;
    title?: ReactNode;
    description?: ReactNode;
    actions?: ReactNode;
}

export function ChartCard({
    children,
    className,
    contentClassName,
    eyebrow,
    title,
    description,
    actions,
}: ChartCardProps) {
    return (
        <Card className={cn('h-full', className)}>
            {(eyebrow || title || description || actions) && (
                <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0 flex-1">
                        {eyebrow && (
                            <p className="text-[11px] font-black tracking-[0.22em] text-amber-900/45 uppercase">
                                {eyebrow}
                            </p>
                        )}
                        {title && (
                            <p className="mt-1 text-lg leading-tight font-black text-amber-950 sm:text-base">
                                {title}
                            </p>
                        )}
                        {description && (
                            <p className="mt-1 max-w-xl text-sm leading-7 text-amber-700 sm:leading-6">
                                {description}
                            </p>
                        )}
                    </div>
                    {actions && (
                        <div className="w-full sm:w-auto sm:flex-shrink-0">
                            {actions}
                        </div>
                    )}
                </div>
            )}
            <div className={cn(contentClassName)}>{children}</div>
        </Card>
    );
}

export interface MetricCardProps {
    label: ReactNode;
    value: ReactNode;
    className?: string;
    icon?: ReactNode;
    subtitle?: ReactNode;
    valueClassName?: string;
    iconWrapperClassName?: string;
}

export function MetricCard({
    label,
    value,
    className,
    icon,
    subtitle,
    valueClassName,
    iconWrapperClassName,
}: MetricCardProps) {
    return (
        <Card
            className={cn(
                'group flex h-full flex-col justify-between border border-amber-100/80 bg-white/95 transition-all duration-200 hover:-translate-y-0.5 hover:border-amber-200 hover:shadow-[0_22px_40px_-34px_rgba(120,53,15,0.75)]',
                className,
            )}
        >
            <div className="mb-4 flex items-start justify-between gap-3">
                {icon ? (
                    <div
                        className={cn(
                            'rounded-2xl bg-amber-50 p-2.5',
                            iconWrapperClassName,
                        )}
                    >
                        {icon}
                    </div>
                ) : (
                    <div />
                )}
                <div className="min-w-0 text-right">
                    <p className="text-xs font-bold tracking-widest text-amber-900/50 uppercase">
                        {label}
                    </p>
                    {subtitle && (
                        <p className="mt-1 text-sm text-amber-900/50">
                            {subtitle}
                        </p>
                    )}
                </div>
            </div>
            <div
                className={cn(
                    'text-3xl font-black text-amber-900',
                    valueClassName,
                )}
            >
                {value}
            </div>
        </Card>
    );
}

export interface ReadinessScoreCardProps {
    value: ReactNode;
    level: string | null;
    className?: string;
    eyebrow?: ReactNode;
    secondaryLabel?: ReactNode;
    secondaryValue?: ReactNode;
    tertiaryLabel?: ReactNode;
    tertiaryValue?: ReactNode;
    description?: ReactNode;
    valueClassName?: string;
    badgeClassName?: string;
}

export function ReadinessScoreCard({
    value,
    level,
    className,
    eyebrow = 'HRI Score',
    secondaryLabel,
    secondaryValue,
    tertiaryLabel,
    tertiaryValue,
    description,
    valueClassName,
    badgeClassName,
}: ReadinessScoreCardProps) {
    return (
        <Card
            className={cn(
                'flex h-full flex-col items-center justify-center gap-2 py-8',
                className,
            )}
        >
            <p className="text-[10px] font-black tracking-widest text-amber-900/50 uppercase">
                {eyebrow}
            </p>
            <div
                className={cn(
                    'text-7xl font-black tracking-tighter',
                    valueClassName,
                )}
            >
                {value}
            </div>
            <ReadinessBadge
                level={level}
                appearance="solid"
                className={badgeClassName}
            />
            {(secondaryLabel || secondaryValue) && (
                <div className="mt-4 text-center">
                    {secondaryLabel && (
                        <p className="text-[10px] font-bold tracking-wider text-amber-900/40 uppercase">
                            {secondaryLabel}
                        </p>
                    )}
                    {secondaryValue && (
                        <div className="text-xl font-bold text-amber-900">
                            {secondaryValue}
                        </div>
                    )}
                </div>
            )}
            {(tertiaryLabel || tertiaryValue) && (
                <div className="mt-2 text-center">
                    {tertiaryLabel && (
                        <p className="text-[10px] font-bold tracking-wider text-amber-900/40 uppercase">
                            {tertiaryLabel}
                        </p>
                    )}
                    {tertiaryValue && (
                        <div className="text-sm font-bold text-amber-900">
                            {tertiaryValue}
                        </div>
                    )}
                </div>
            )}
            {description && (
                <p className="mt-2 text-center text-sm text-amber-700/60">
                    {description}
                </p>
            )}
        </Card>
    );
}

export interface ConfidenceBarProps {
    value: number | null;
    className?: string;
    barClassName?: string;
    label?: ReactNode;
    emptyLabel?: ReactNode;
    showValue?: boolean;
    formatter?: (value: number) => ReactNode;
}

export function ConfidenceBar({
    value,
    className,
    barClassName,
    label = 'Confidence',
    emptyLabel = '—',
    showValue = true,
    formatter,
}: ConfidenceBarProps) {
    const safeValue = value ?? 0;
    const displayValue = formatter
        ? formatter(safeValue)
        : `${Math.round(safeValue)}%`;

    return (
        <div className={cn(className)}>
            <div className="mb-1.5 flex justify-between">
                <p className="text-xs font-bold tracking-widest text-amber-900/40 uppercase">
                    {label}
                </p>
                {showValue && (
                    <span className="text-xs font-bold text-amber-900">
                        {value !== null ? displayValue : emptyLabel}
                    </span>
                )}
            </div>
            <Progress
                value={safeValue}
                className="h-2 w-full overflow-hidden rounded-full bg-yellow-100"
                barColor={cn('bg-amber-400', barClassName)}
            />
        </div>
    );
}

export interface SnapshotGridItem {
    label: ReactNode;
    value: ReactNode;
}

export interface SnapshotGridProps {
    items: SnapshotGridItem[];
    className?: string;
    itemClassName?: string;
}

export function SnapshotGrid({
    items,
    className,
    itemClassName,
}: SnapshotGridProps) {
    return (
        <div
            className={cn(
                'grid grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-6',
                className,
            )}
        >
            {items.map((item, index) => (
                <div
                    key={`${String(item.label)}-${index}`}
                    className={cn(
                        'rounded-xl bg-amber-50 px-3 py-3 text-center',
                        itemClassName,
                    )}
                >
                    <p className="text-[9px] font-bold tracking-wider text-amber-900/40 uppercase">
                        {item.label}
                    </p>
                    <p className="mt-1 text-sm font-bold text-amber-900">
                        {item.value}
                    </p>
                </div>
            ))}
        </div>
    );
}
