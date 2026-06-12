import { Edit2, MoreVertical, Trash2 } from 'lucide-react';
import { Button } from '@/components/core/button';
import { Dropdown } from '@/components/core/dropdown';
import { ProductivityBadge } from '@/components/core/productivity-badge';
import { fmtDate } from '@/lib/format';
import type { Harvest } from '@/types';

interface Handlers {
    onEdit: (harvest: Harvest) => void;
    onDelete: (harvest: Harvest) => void;
}

export function harvestColumns({ onEdit, onDelete }: Handlers) {
    return [
        {
            key: 'hive',
            header: 'Hive',
            cellClassName: 'px-6 py-4 font-medium text-amber-950',
            render: (harvest: Harvest) => harvest.hive?.name ?? '—',
        },
        {
            key: 'date',
            header: 'Date',
            cellClassName: 'px-6 py-4 text-amber-900/70',
            render: (harvest: Harvest) => fmtDate(harvest.harvest_date),
        },
        {
            key: 'weight',
            header: 'Weight (kg)',
            cellClassName: 'px-6 py-4 text-amber-900/70',
            render: (harvest: Harvest) => `${harvest.weight} kg`,
        },
        {
            key: 'productivity',
            header: 'Productivity',
            headerClassName: 'hidden md:table-cell',
            cellClassName: 'hidden px-6 py-4 md:table-cell',
            render: (harvest: Harvest) => <ProductivityBadge level={harvest.productivity_level} />,
        },
        {
            key: 'color',
            header: 'Color',
            headerClassName: 'hidden lg:table-cell',
            cellClassName: 'hidden px-6 py-4 text-amber-900/70 lg:table-cell',
            render: (harvest: Harvest) => harvest.color?.name ?? '—',
        },
        {
            key: 'flavor',
            header: 'Flavor',
            headerClassName: 'hidden lg:table-cell',
            cellClassName: 'hidden px-6 py-4 text-amber-900/70 lg:table-cell',
            render: (harvest: Harvest) => harvest.flavor?.name ?? '—',
        },
        {
            key: 'actions',
            header: '',
            headerClassName: 'px-6 py-3',
            cellClassName: 'px-6 py-4 text-right',
            render: (harvest: Harvest) => (
                <div onClick={(e) => e.stopPropagation()}>
                    <Dropdown
                        align="right"
                        trigger={
                            <Button type="button" variant="ghost"
                                className="h-auto rounded-xl p-1.5 text-amber-900/50 hover:bg-yellow-100 hover:text-amber-900/50">
                                <MoreVertical className="h-4 w-4" />
                            </Button>
                        }
                        items={[
                            { id: 'edit', label: 'Edit', icon: <Edit2 className="h-4 w-4" />, onClick: () => onEdit(harvest) },
                            { id: 'delete', label: 'Delete', icon: <Trash2 className="h-4 w-4" />, variant: 'danger' as const, onClick: () => onDelete(harvest) },
                        ]}
                    />
                </div>
            ),
        },
    ];
}
