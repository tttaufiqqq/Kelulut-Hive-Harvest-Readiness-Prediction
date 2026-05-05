import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

export interface WeatherPillCondition {
    id?: number | string;
    name: string;
}

export interface WeatherPillsProps {
    conditions?: Array<WeatherPillCondition | string> | null;
    className?: string;
    pillClassName?: string;
    emptyLabel?: ReactNode;
}

export function WeatherPills({
    conditions,
    className,
    pillClassName,
    emptyLabel = '—',
}: WeatherPillsProps) {
    if (!conditions?.length) {
        return (
            <span className={cn('text-amber-900/30', className)}>
                {emptyLabel}
            </span>
        );
    }

    return (
        <div className={cn('flex flex-wrap gap-1', className)}>
            {conditions.map((condition, index) => {
                const item =
                    typeof condition === 'string'
                        ? { id: `${condition}-${index}`, name: condition }
                        : {
                              id: condition.id ?? `${condition.name}-${index}`,
                              name: condition.name,
                          };

                return (
                    <span
                        key={item.id}
                        className={cn(
                            'inline-flex items-center rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700',
                            pillClassName,
                        )}
                    >
                        {item.name}
                    </span>
                );
            })}
        </div>
    );
}
