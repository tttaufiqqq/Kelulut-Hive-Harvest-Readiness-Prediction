import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

export interface SnapshotGridItem {
    label: ReactNode;
    value: ReactNode;
}

export interface SnapshotGridProps {
    items: SnapshotGridItem[];
    className?: string;
    itemClassName?: string;
}

export function SnapshotGrid({ items, className, itemClassName }: SnapshotGridProps) {
    return (
        <div className={cn('grid grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-6', className)}>
            {items.map((item, index) => (
                <div key={`${String(item.label)}-${index}`} className={cn('rounded-xl bg-amber-50 px-3 py-3 text-center', itemClassName)}>
                    <p className="text-[9px] font-bold tracking-wider text-amber-900/40 uppercase">{item.label}</p>
                    <p className="mt-1 text-sm font-bold text-amber-900">{item.value}</p>
                </div>
            ))}
        </div>
    );
}
