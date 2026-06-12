import { ChevronDown, ChevronLeft, ChevronRight, ChevronUp } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/core/display/button';
import { Modal } from '@/components/core/overlay/modal';
import { fmtDate } from '@/lib/format';
import { StatusBadge } from './DeviceTableRow';
import type { DeviceRow } from './DeviceTableRow';

type HiveDetail = {
    id: number;
    name: string;
    status: string | null;
    species_name: string | null;
    site_name: string | null;
    beekeeper_name: string | null;
};

interface Props {
    device: DeviceRow;
    hive: HiveDetail | null;
    deviceIndex: number;
    totalDevices: number;
    hasPrev: boolean;
    hasNext: boolean;
    onPrev: () => void;
    onNext: () => void;
    onEdit: () => void;
    onClose: () => void;
}

export function ViewDeviceModal({ device, hive, deviceIndex, totalDevices, hasPrev, hasNext, onPrev, onNext, onEdit, onClose }: Props) {
    const [hiveOpen, setHiveOpen] = useState(false);

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
                        { label: 'Installed', value: <span className="font-medium text-amber-950">{fmtDate(device.installation_date)}</span> },
                        { label: 'Last Maintenance', value: <span className="font-medium text-amber-950">{fmtDate(device.last_maintenance_date)}</span> },
                    ].map((field) => (
                        <div key={field.label}>
                            <p className="mb-1 text-xs font-bold tracking-widest text-amber-900/40 uppercase">{field.label}</p>
                            {field.value}
                        </div>
                    ))}
                </div>

                <p className="text-center text-[10px] tracking-widest text-amber-900/25 uppercase">Use arrow keys to navigate</p>

                {hive && (
                    <div className="rounded-2xl border border-yellow-100 bg-yellow-50/30">
                        <button
                            onClick={() => setHiveOpen((o) => !o)}
                            className="flex w-full items-center justify-between rounded-2xl px-4 py-3 text-left transition-colors hover:bg-yellow-50/60"
                        >
                            <span className="text-xs font-black tracking-widest text-amber-900/50 uppercase">Linked Hive</span>
                            {hiveOpen ? <ChevronUp className="h-3.5 w-3.5 text-amber-900/40" /> : <ChevronDown className="h-3.5 w-3.5 text-amber-900/40" />}
                        </button>
                        {hiveOpen && (
                            <div className="grid grid-cols-2 gap-x-4 gap-y-3 border-t border-yellow-100 px-4 pb-4 pt-3">
                                {[
                                    { label: 'Status', value: hive.status ? <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-bold ${hive.status === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-600'}`}>{hive.status === 'active' ? 'Active' : 'Inactive'}</span> : '—' },
                                    { label: 'Species', value: hive.species_name ?? '—' },
                                    { label: 'Site', value: hive.site_name ?? '—' },
                                    { label: 'Beekeeper', value: hive.beekeeper_name ?? '—' },
                                ].map((field) => (
                                    <div key={field.label}>
                                        <p className="mb-1 text-xs font-bold tracking-widest text-amber-900/40 uppercase">{field.label}</p>
                                        <p className="text-sm font-medium text-amber-950">{field.value}</p>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                <div className="flex gap-3 pt-2">
                    <Button type="button" variant="ghost" onClick={onClose} className="flex-1">Close</Button>
                    <Button type="button" variant="outline" onClick={onEdit} className="flex-1">Edit</Button>
                </div>
            </div>
        </Modal>
    );
}
