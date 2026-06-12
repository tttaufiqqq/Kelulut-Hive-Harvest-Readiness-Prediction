import { Edit2, MoreVertical, Trash2 } from 'lucide-react';
import { BloomingBadge } from '@/components/core/display/blooming-badge';
import { Button } from '@/components/core/display/button';
import { WeatherPills } from '@/components/core/display/weather-pills';
import { Dropdown } from '@/components/core/overlay/dropdown';
import { fmtDate } from '@/lib/format';
import type { Inspection } from '@/types';

interface Handlers {
    onEdit: (inspection: Inspection) => void;
    onDelete: (inspection: Inspection) => void;
}

export function inspectionColumns({ onEdit, onDelete }: Handlers) {
    return [
        {
            key: 'hive',
            header: 'Hive',
            cellClassName: 'px-6 py-4 font-medium text-amber-950',
            render: (inspection: Inspection) => inspection.hive?.name ?? '—',
        },
        {
            key: 'date',
            header: 'Date',
            cellClassName: 'px-6 py-4 text-amber-900/70',
            render: (inspection: Inspection) => fmtDate(inspection.inspection_date),
        },
        {
            key: 'blooming',
            header: 'Blooming',
            headerClassName: 'hidden md:table-cell',
            cellClassName: 'hidden px-6 py-4 md:table-cell',
            render: (inspection: Inspection) => <BloomingBadge status={inspection.blooming_status} />,
        },
        {
            key: 'weather',
            header: 'Weather',
            headerClassName: 'hidden lg:table-cell',
            cellClassName: 'hidden px-6 py-4 lg:table-cell',
            render: (inspection: Inspection) => <WeatherPills conditions={inspection.weather_conditions} />,
        },
        {
            key: 'actions',
            header: '',
            headerClassName: 'px-6 py-3',
            cellClassName: 'px-6 py-4 text-right',
            render: (inspection: Inspection) => (
                <div onClick={(e) => e.stopPropagation()}>
                    <Dropdown align="right"
                        trigger={<Button type="button" variant="ghost" className="h-auto rounded-xl p-1.5 text-amber-900/50 hover:bg-yellow-100 hover:text-amber-900/50"><MoreVertical className="h-4 w-4" /></Button>}
                        items={[
                            { id: 'edit', label: 'Edit', icon: <Edit2 className="h-4 w-4" />, onClick: () => onEdit(inspection) },
                            { id: 'delete', label: 'Delete', icon: <Trash2 className="h-4 w-4" />, variant: 'danger' as const, onClick: () => onDelete(inspection) },
                        ]} />
                </div>
            ),
        },
    ];
}
