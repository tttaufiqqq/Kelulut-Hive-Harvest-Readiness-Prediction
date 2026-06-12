import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/core/button';
import { Modal } from '@/components/core/modal';
import { StatusBadge } from './DeviceTableRow';
import type { DeviceRow } from './DeviceTableRow';

interface Props {
    device: DeviceRow;
    deviceIndex: number;
    totalDevices: number;
    hasPrev: boolean;
    hasNext: boolean;
    onPrev: () => void;
    onNext: () => void;
    onEdit: () => void;
    onClose: () => void;
}

export function ViewDeviceModal({ device, deviceIndex, totalDevices, hasPrev, hasNext, onPrev, onNext, onEdit, onClose }: Props) {
    return (
        <Modal isOpen onClose={onClose} title="Device Details" maxWidth="sm">
            <div className="space-y-4">
                <div className="-mt-1 mb-1 flex items-center justify-end gap-1">
                    <button
                        onClick={onPrev}
                        disabled={!hasPrev}
                        className="rounded-xl p-1.5 transition-colors hover:bg-yellow-100 disabled:cursor-not-allowed disabled:opacity-20"
                    >
                        <ChevronLeft className="h-4 w-4 text-amber-900" />
                    </button>
                    <span className="min-w-[3rem] text-center text-xs font-bold text-amber-900/40 tabular-nums">
                        {deviceIndex + 1} / {totalDevices}
                    </span>
                    <button
                        onClick={onNext}
                        disabled={!hasNext}
                        className="rounded-xl p-1.5 transition-colors hover:bg-yellow-100 disabled:cursor-not-allowed disabled:opacity-20"
                    >
                        <ChevronRight className="h-4 w-4 text-amber-900" />
                    </button>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    {[
                        { label: 'Device ID', value: <span className="font-mono font-semibold text-amber-950">{device.node_identifier}</span> },
                        { label: 'Status', value: <StatusBadge status={device.device_status} /> },
                        { label: 'Hive', value: <span className="font-medium text-amber-950">{device.hive_name ?? '—'}</span> },
                        { label: 'Sensor Logs', value: <span className="inline-flex items-center rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-bold text-amber-700">{device.sensor_log_count}</span> },
                        { label: 'Installed', value: <span className="font-medium text-amber-950">{device.installation_date ?? '—'}</span> },
                        { label: 'Last Maintenance', value: <span className="font-medium text-amber-950">{device.last_maintenance_date ?? '—'}</span> },
                    ].map((field) => (
                        <div key={field.label}>
                            <p className="mb-1 text-xs font-bold tracking-widest text-amber-900/40 uppercase">{field.label}</p>
                            {field.value}
                        </div>
                    ))}
                </div>

                <p className="text-center text-[10px] tracking-widest text-amber-900/25 uppercase">Use arrow keys to navigate</p>

                <div className="flex gap-3 pt-2">
                    <Button type="button" variant="ghost" onClick={onClose} className="flex-1">Close</Button>
                    <Button type="button" variant="outline" onClick={onEdit} className="flex-1">Edit</Button>
                </div>
            </div>
        </Modal>
    );
}
