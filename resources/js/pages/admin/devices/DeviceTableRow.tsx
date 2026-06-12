import { Edit2, MoreVertical, Trash2 } from 'lucide-react';
import { Dropdown } from '@/components/core/dropdown';
import { fmtDate } from '@/lib/format';

export type DeviceRow = {
    id: number;
    node_identifier: string;
    hive_id: number;
    hive_name: string | null;
    device_status: 'active' | 'inactive';
    installation_date: string | null;
    last_maintenance_date: string | null;
    sensor_log_count: number;
};

export function StatusBadge({ status }: { status: 'active' | 'inactive' }) {
    return status === 'active' ? (
        <span className="inline-flex items-center rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-bold text-emerald-700">
            Active
        </span>
    ) : (
        <span className="inline-flex items-center rounded-full bg-rose-100 px-2.5 py-0.5 text-xs font-bold text-rose-600">
            Inactive
        </span>
    );
}

interface Props {
    device: DeviceRow;
    index: number;
    onView: (index: number) => void;
    onEdit: (device: DeviceRow) => void;
    onDelete: (device: DeviceRow) => void;
}

export function DeviceTableRow({ device, index, onView, onEdit, onDelete }: Props) {
    return (
        <tr
            className="cursor-pointer transition-colors hover:bg-yellow-50/30"
            onClick={() => onView(index)}
        >
            <td className="px-6 py-4 font-mono font-semibold text-amber-950">{device.node_identifier}</td>
            <td className="px-6 py-4 text-amber-800">{device.hive_name ?? '—'}</td>
            <td className="px-6 py-4">
                <StatusBadge status={device.device_status} />
            </td>
            <td className="hidden px-6 py-4 text-amber-900/60 md:table-cell">{fmtDate(device.installation_date)}</td>
            <td className="hidden px-6 py-4 text-amber-900/60 lg:table-cell">{fmtDate(device.last_maintenance_date)}</td>
            <td className="px-6 py-4">
                <span className="inline-flex items-center rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-bold text-amber-700">
                    {device.sensor_log_count}
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
                        { id: 'edit', label: 'Edit', icon: <Edit2 className="h-4 w-4" />, onClick: () => onEdit(device) },
                        { id: 'delete', label: 'Delete', icon: <Trash2 className="h-4 w-4" />, variant: 'danger' as const, onClick: () => onDelete(device) },
                    ]}
                />
            </td>
        </tr>
    );
}
