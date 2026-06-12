import { Edit2, MoreVertical, Trash2 } from 'lucide-react';
import { Dropdown } from '@/components/core/overlay/dropdown';

export type SiteRow = {
    id: number;
    name: string;
    description: string | null;
    hive_count: number;
};

interface Props {
    site: SiteRow;
    index: number;
    onView: (index: number) => void;
    onEdit: (site: SiteRow) => void;
    onDelete: (site: SiteRow) => void;
}

export function SiteTableRow({ site, index, onView, onEdit, onDelete }: Props) {
    return (
        <tr
            className="cursor-pointer transition-colors hover:bg-yellow-50/30"
            onClick={() => onView(index)}
        >
            <td className="px-6 py-4 font-medium text-amber-950">{site.name}</td>
            <td className="hidden px-6 py-4 text-amber-900/60 md:table-cell">
                {site.description ?? '—'}
            </td>
            <td className="px-6 py-4">
                <span className="inline-flex items-center rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-bold text-amber-700">
                    {site.hive_count}
                </span>
            </td>
            <td className="px-6 py-4 text-right" onClick={(e) => e.stopPropagation()}>
                <Dropdown
                    align="right"
                    trigger={
                        <button className="rounded-xl p-1.5 transition-colors hover:bg-yellow-100">
                            <MoreVertical className="h-4 w-4 text-amber-900/50" />
                        </button>
                    }
                    items={[
                        {
                            id: 'edit',
                            label: 'Edit',
                            icon: <Edit2 className="h-4 w-4" />,
                            onClick: () => onEdit(site),
                        },
                        {
                            id: 'delete',
                            label: 'Delete',
                            icon: <Trash2 className="h-4 w-4" />,
                            variant: 'danger' as const,
                            onClick: () => onDelete(site),
                        },
                    ]}
                />
            </td>
        </tr>
    );
}
