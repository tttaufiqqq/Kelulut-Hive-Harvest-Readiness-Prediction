import { Edit2, MoreVertical, Power, Trash2 } from 'lucide-react';
import { Dropdown } from '@/components/core/overlay/dropdown';
import { HiveStatusBadge } from './HiveStatusBadge';

export type HiveRow = {
    id: number;
    name: string;
    beekeeper_id: number;
    beekeeper_name: string | null;
    species: string | null;
    species_id: number | null;
    site: string | null;
    site_id: number | null;
    status: 'active' | 'inactive';
    age_months: number;
    image_path: string | null;
};

interface Props {
    hive: HiveRow;
    index: number;
    onView: (index: number) => void;
    onEdit: (hive: HiveRow) => void;
    onToggle: (hive: HiveRow) => void;
    onDelete: (hive: HiveRow) => void;
}

export function HiveTableRow({ hive, index, onView, onEdit, onToggle, onDelete }: Props) {
    return (
        <tr
            className="cursor-pointer transition-colors hover:bg-yellow-50/30"
            onClick={() => onView(index)}
        >
            <td className="px-6 py-4 font-medium text-amber-950">{hive.name}</td>
            <td className="px-6 py-4 text-amber-900/70">{hive.beekeeper_name ?? '—'}</td>
            <td className="hidden px-6 py-4 text-amber-900/70 md:table-cell">{hive.site ?? '—'}</td>
            <td className="hidden px-6 py-4 text-amber-900/70 md:table-cell">{hive.species ?? '—'}</td>
            <td className="px-6 py-4"><HiveStatusBadge status={hive.status} /></td>
            <td className="hidden px-6 py-4 text-amber-900/50 lg:table-cell">{hive.age_months}m</td>
            <td className="px-6 py-4 text-right" onClick={(e) => e.stopPropagation()}>
                <Dropdown
                    align="right"
                    trigger={
                        <button className="rounded-xl p-1.5 transition-colors hover:bg-yellow-100">
                            <MoreVertical className="h-4 w-4 text-amber-900/50" />
                        </button>
                    }
                    items={[
                        { id: 'edit', label: 'Edit', icon: <Edit2 className="h-4 w-4" />, onClick: () => onEdit(hive) },
                        {
                            id: 'toggle',
                            label: hive.status === 'active' ? 'Set Inactive' : 'Set Active',
                            icon: <Power className="h-4 w-4" />,
                            variant: hive.status === 'active' ? ('danger' as const) : ('default' as const),
                            onClick: () => onToggle(hive),
                        },
                        { id: 'delete', label: 'Delete', icon: <Trash2 className="h-4 w-4" />, variant: 'danger' as const, onClick: () => onDelete(hive) },
                    ]}
                />
            </td>
        </tr>
    );
}
