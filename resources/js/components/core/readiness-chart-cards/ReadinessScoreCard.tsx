import type { ReactNode } from 'react';
import { Card } from '@/components/core/card';
import { cn } from '@/lib/utils';
import { ReadinessBadge } from './ReadinessBadge';

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

export function ReadinessScoreCard({ value, level, className, eyebrow = 'HRI Score', secondaryLabel, secondaryValue, tertiaryLabel, tertiaryValue, description, valueClassName, badgeClassName }: ReadinessScoreCardProps) {
    return (
        <Card className={cn('flex h-full flex-col items-center justify-center gap-2 py-8', className)}>
            <p className="text-[10px] font-black tracking-widest text-amber-900/50 uppercase">{eyebrow}</p>
            <div className={cn('text-7xl font-black tracking-tighter', valueClassName)}>{value}</div>
            <ReadinessBadge level={level} appearance="solid" className={badgeClassName} />
            {(secondaryLabel || secondaryValue) && (
                <div className="mt-4 text-center">
                    {secondaryLabel && <p className="text-[10px] font-bold tracking-wider text-amber-900/40 uppercase">{secondaryLabel}</p>}
                    {secondaryValue && <div className="text-xl font-bold text-amber-900">{secondaryValue}</div>}
                </div>
            )}
            {(tertiaryLabel || tertiaryValue) && (
                <div className="mt-2 text-center">
                    {tertiaryLabel && <p className="text-[10px] font-bold tracking-wider text-amber-900/40 uppercase">{tertiaryLabel}</p>}
                    {tertiaryValue && <div className="text-sm font-bold text-amber-900">{tertiaryValue}</div>}
                </div>
            )}
            {description && <p className="mt-2 text-center text-sm text-amber-700/60">{description}</p>}
        </Card>
    );
}
