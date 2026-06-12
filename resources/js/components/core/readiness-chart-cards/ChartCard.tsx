import type { ReactNode } from 'react';
import { Card } from '@/components/core/display/card';
import { cn } from '@/lib/utils';

export interface ChartCardProps {
    children: ReactNode;
    className?: string;
    contentClassName?: string;
    eyebrow?: ReactNode;
    title?: ReactNode;
    description?: ReactNode;
    actions?: ReactNode;
}

export function ChartCard({ children, className, contentClassName, eyebrow, title, description, actions }: ChartCardProps) {
    return (
        <Card className={cn('h-full', className)}>
            {(eyebrow || title || description || actions) && (
                <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0 flex-1">
                        {eyebrow && <p className="text-[11px] font-black tracking-[0.22em] text-amber-900/45 uppercase">{eyebrow}</p>}
                        {title && <p className="mt-1 text-lg leading-tight font-black text-amber-950 sm:text-base">{title}</p>}
                        {description && <p className="mt-1 max-w-xl text-sm leading-7 text-amber-700 sm:leading-6">{description}</p>}
                    </div>
                    {actions && <div className="w-full sm:w-auto sm:flex-shrink-0">{actions}</div>}
                </div>
            )}
            <div className={cn(contentClassName)}>{children}</div>
        </Card>
    );
}
