import type { ReactNode } from 'react';
import { Progress } from '@/components/core/feedback/feedback';
import { cn } from '@/lib/utils';

export interface ConfidenceBarProps {
    value: number | null;
    className?: string;
    barClassName?: string;
    label?: ReactNode;
    emptyLabel?: ReactNode;
    showValue?: boolean;
    formatter?: (value: number) => ReactNode;
}

export function ConfidenceBar({ value, className, barClassName, label = 'Confidence', emptyLabel = '—', showValue = true, formatter }: ConfidenceBarProps) {
    const safeValue = value ?? 0;
    const displayValue = formatter ? formatter(safeValue) : `${Math.round(safeValue)}%`;

    return (
        <div className={cn(className)}>
            <div className="mb-1.5 flex justify-between">
                <p className="text-xs font-bold tracking-widest text-amber-900/40 uppercase">{label}</p>
                {showValue && <span className="text-xs font-bold text-amber-900">{value !== null ? displayValue : emptyLabel}</span>}
            </div>
            <Progress value={safeValue} className="h-2 w-full overflow-hidden rounded-full bg-yellow-100" barColor={cn('bg-amber-400', barClassName)} />
        </div>
    );
}
