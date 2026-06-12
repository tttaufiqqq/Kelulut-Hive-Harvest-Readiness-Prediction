import type { ReactNode } from 'react';
import { Card } from '@/components/core/card';
import { cn } from '@/lib/utils';

export interface MetricCardProps {
    label: ReactNode;
    value: ReactNode;
    className?: string;
    icon?: ReactNode;
    subtitle?: ReactNode;
    valueClassName?: string;
    iconWrapperClassName?: string;
}

export function MetricCard({ label, value, className, icon, subtitle, valueClassName, iconWrapperClassName }: MetricCardProps) {
    return (
        <Card className={cn('group flex h-full flex-col justify-between border border-amber-100/80 bg-white/95 transition-all duration-200 hover:-translate-y-0.5 hover:border-amber-200 hover:shadow-[0_22px_40px_-34px_rgba(120,53,15,0.75)]', className)}>
            <div className="mb-4 flex items-start justify-between gap-3">
                {icon ? <div className={cn('rounded-2xl bg-amber-50 p-2.5', iconWrapperClassName)}>{icon}</div> : <div />}
                <div className="min-w-0 text-right">
                    <p className="text-xs font-bold tracking-widest text-amber-900/50 uppercase">{label}</p>
                    {subtitle && <p className="mt-1 text-sm text-amber-900/50">{subtitle}</p>}
                </div>
            </div>
            <div className={cn('text-3xl font-black text-amber-900', valueClassName)}>{value}</div>
        </Card>
    );
}
