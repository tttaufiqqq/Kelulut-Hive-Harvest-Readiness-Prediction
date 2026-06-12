import { Head, router, useForm, usePage } from '@inertiajs/react';
import { Plus } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Button } from '@/components/core/display/button';
import { Card } from '@/components/core/display/card';
import { FlashAlerts } from '@/components/core/feedback/flash-alerts';
import type { FlashMessageBag } from '@/components/core/feedback/flash-alerts';
import { AdminLayout } from '@/layouts/admin-layout';
import { CreateDeviceModal } from './CreateDeviceModal';
import type { DeviceFormData } from './CreateDeviceModal';
import { DeviceConfirmModals } from './DeviceConfirmModals';
import { DeviceTableRow } from './DeviceTableRow';
import type { DeviceRow } from './DeviceTableRow';
import { EditDeviceModal } from './EditDeviceModal';
import { ViewDeviceModal } from './ViewDeviceModal';

type HiveOption = {
    id: number;
    name: string;
    status: string | null;
    species_name: string | null;
    site_name: string | null;
    beekeeper_name: string | null;
};

type ActiveModal =
    | { type: 'create' }
    | { type: 'view'; index: number }
    | { type: 'edit'; device: DeviceRow }
    | { type: 'confirm-edit'; device: DeviceRow }
    | { type: 'delete'; device: DeviceRow }
    | null;

export default function DevicesIndex({
    devices,
    all_hives,
    available_hives,
}: {
    devices: DeviceRow[];
    all_hives: HiveOption[];
    available_hives: HiveOption[];
}) {
    const { props } = usePage<{ flash?: FlashMessageBag }>();
    const flash = props.flash;

    const [activeModal, setActiveModal] = useState<ActiveModal>(null);
    const [deleting, setDeleting] = useState(false);
    const [editInstant, setEditInstant] = useState(false);
    const close = () => setActiveModal(null);

    const viewIndex = activeModal?.type === 'view' ? activeModal.index : null;
    const viewDevice = viewIndex !== null ? devices[viewIndex] : null;
    const hasPrev = viewIndex !== null && viewIndex > 0;
    const hasNext = viewIndex !== null && viewIndex < devices.length - 1;

    useEffect(() => {
        if (viewIndex === null) return;
        const handler = (e: KeyboardEvent) => {
            if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
                e.preventDefault();
                setActiveModal((p) => p?.type === 'view' && p.index > 0 ? { type: 'view', index: p.index - 1 } : p);
            }
            if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
                e.preventDefault();
                setActiveModal((p) => p?.type === 'view' && p.index < devices.length - 1 ? { type: 'view', index: p.index + 1 } : p);
            }
        };
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, [viewIndex, devices.length]);

    const emptyForm = { hive_id: '', device_status: 'active', installation_date: '', last_maintenance_date: '' };
    const createForm = useForm<DeviceFormData>(emptyForm);
    const editForm = useForm<DeviceFormData>(emptyForm);

    const openEdit = (device: DeviceRow, instant = false) => {
        setEditInstant(instant);
        editForm.setData({ hive_id: String(device.hive_id), device_status: device.device_status, installation_date: device.installation_date ?? '', last_maintenance_date: device.last_maintenance_date ?? '' });
        setActiveModal({ type: 'edit', device });
    };
    const submitCreate = () => createForm.post(route('admin.devices.store'), { onSuccess: () => { createForm.reset(); close(); } });
    const openEditConfirm = () => { if (activeModal?.type === 'edit') setActiveModal({ type: 'confirm-edit', device: activeModal.device }); };
    const confirmEdit = () => { if (activeModal?.type === 'confirm-edit') editForm.patch(route('admin.devices.update', { device: activeModal.device.id }), { onSuccess: close }); };
    const confirmDelete = () => {
        if (activeModal?.type !== 'delete') return;
        setDeleting(true);
        router.delete(route('admin.devices.destroy', { device: activeModal.device.id }), { onFinish: () => { setDeleting(false); close(); } });
    };

    const availableOptions = available_hives.map((h) => ({ value: String(h.id), label: h.name }));
    const allHiveOptions = all_hives.map((h) => ({ value: String(h.id), label: h.name }));
    const confirmableModal = activeModal?.type === 'confirm-edit' || activeModal?.type === 'delete' ? activeModal : null;

    return (
        <AdminLayout>
            <Head title="Devices — Admin" />
            <div className="space-y-6">
                <FlashAlerts key={flash?.id ?? 'device-flash'} flash={flash} />
                <div className="flex items-center justify-between">
                    <div>
                        <h3 className="text-lg font-bold text-amber-900">IoT Devices</h3>
                        <p className="text-sm text-amber-900/50">{devices.length} device{devices.length !== 1 ? 's' : ''} registered</p>
                    </div>
                    <Button variant="primary" size="sm" onClick={() => setActiveModal({ type: 'create' })} disabled={available_hives.length === 0} title={available_hives.length === 0 ? 'All hives already have a device' : undefined}>
                        <Plus className="mr-1 h-4 w-4" /> Register Device
                    </Button>
                </div>
                <Card className="overflow-hidden p-0">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-yellow-100 bg-yellow-50/50">
                                    {['Device ID', 'Hive', 'Status'].map((h) => (
                                        <th key={h} className="px-6 py-3 text-left text-xs font-bold tracking-widest text-amber-900/50 uppercase">{h}</th>
                                    ))}
                                    <th className="hidden px-6 py-3 text-left text-xs font-bold tracking-widest text-amber-900/50 uppercase md:table-cell">Installed</th>
                                    <th className="hidden px-6 py-3 text-left text-xs font-bold tracking-widest text-amber-900/50 uppercase lg:table-cell">Last Maintenance</th>
                                    <th className="px-6 py-3 text-left text-xs font-bold tracking-widest text-amber-900/50 uppercase">Logs</th>
                                    <th className="px-6 py-3" />
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-yellow-50">
                                {devices.length === 0 && (
                                    <tr><td colSpan={7} className="px-6 py-10 text-center text-sm text-amber-900/40">No devices registered yet.</td></tr>
                                )}
                                {devices.map((device, index) => (
                                    <DeviceTableRow
                                        key={device.id}
                                        device={device}
                                        index={index}
                                        onView={(idx) => setActiveModal({ type: 'view', index: idx })}
                                        onEdit={openEdit}
                                        onDelete={(d) => setActiveModal({ type: 'delete', device: d })}
                                    />
                                ))}
                            </tbody>
                        </table>
                    </div>
                </Card>
            </div>

            {activeModal?.type === 'view' && viewDevice && (
                <ViewDeviceModal
                    device={viewDevice}
                    hive={all_hives.find((h) => h.id === viewDevice.hive_id) ?? null}
                    deviceIndex={viewIndex!}
                    totalDevices={devices.length}
                    hasPrev={hasPrev}
                    hasNext={hasNext}
                    onPrev={() => setActiveModal((p) => p?.type === 'view' && p.index > 0 ? { type: 'view', index: p.index - 1 } : p)}
                    onNext={() => setActiveModal((p) => p?.type === 'view' && p.index < devices.length - 1 ? { type: 'view', index: p.index + 1 } : p)}
                    onEdit={() => { close(); openEdit(viewDevice, true); }}
                    onClose={close}
                />
            )}

            <CreateDeviceModal isOpen={activeModal?.type === 'create'} hiveOptions={availableOptions} form={createForm} onSubmit={submitCreate} onClose={close} />

            {activeModal?.type === 'edit' && (
                <EditDeviceModal isOpen instant={editInstant} deviceIdentifier={activeModal.device.node_identifier} hiveOptions={allHiveOptions} form={editForm} onSubmit={openEditConfirm} onClose={() => { setEditInstant(false); close(); }} />
            )}

            <DeviceConfirmModals activeModal={confirmableModal} deleting={deleting} editProcessing={editForm.processing} onConfirmEdit={confirmEdit} onConfirmDelete={confirmDelete} onClose={close} />
        </AdminLayout>
    );
}
