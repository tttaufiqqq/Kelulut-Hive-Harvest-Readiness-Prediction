import { Head, router, useForm, usePage } from '@inertiajs/react';
import { MoreVertical, Plus, Edit2, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/core/button';
import { Card } from '@/components/core/card';
import { Dropdown } from '@/components/core/dropdown';
import { Alert } from '@/components/core/feedback';
import { DatePickerField } from '@/components/core/date-picker';
import { Input } from '@/components/core/input';
import { Modal } from '@/components/core/modal';
import { SelectField } from '@/components/core/select-field';
import { AdminLayout } from '@/layouts/admin-layout';

type DeviceRow = {
    id: number;
    device_id: string;
    hive_id: number;
    hive_name: string | null;
    device_status: 'active' | 'inactive';
    installation_date: string | null;
    last_maintenance_date: string | null;
    sensor_log_count: number;
};

type HiveOption = { id: number; name: string };

type PageProps = {
    devices: DeviceRow[];
    all_hives: HiveOption[];
    available_hives: HiveOption[];
};

type ActiveModal =
    | { type: 'create' }
    | { type: 'edit'; device: DeviceRow }
    | { type: 'delete'; device: DeviceRow }
    | null;

type DeviceFormData = {
    device_id: string;
    hive_id: string;
    device_status: string;
    installation_date: string;
    last_maintenance_date: string;
};

const STATUS_OPTIONS = [
    { value: 'active',   label: 'Active' },
    { value: 'inactive', label: 'Inactive' },
];

function StatusBadge({ status }: { status: 'active' | 'inactive' }) {
    return status === 'active' ? (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-700">Active</span>
    ) : (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-100 text-rose-600">Inactive</span>
    );
}

export default function DevicesIndex({ devices, all_hives, available_hives }: PageProps) {
    const { props } = usePage<{ flash?: { success?: string; error?: string } }>();
    const flash = props.flash;

    const [activeModal, setActiveModal] = useState<ActiveModal>(null);
    const [deleting, setDeleting]       = useState(false);
    const close = () => setActiveModal(null);

    const createForm = useForm<DeviceFormData>({
        device_id: '',
        hive_id: '',
        device_status: 'active',
        installation_date: '',
        last_maintenance_date: '',
    });

    const editForm = useForm<DeviceFormData>({
        device_id: '',
        hive_id: '',
        device_status: 'active',
        installation_date: '',
        last_maintenance_date: '',
    });

    const openEdit = (device: DeviceRow) => {
        editForm.setData({
            device_id:             device.device_id,
            hive_id:               String(device.hive_id),
            device_status:         device.device_status,
            installation_date:     device.installation_date ?? '',
            last_maintenance_date: device.last_maintenance_date ?? '',
        });
        setActiveModal({ type: 'edit', device });
    };

    const submitCreate = (e: React.FormEvent) => {
        e.preventDefault();
        createForm.post(route('admin.devices.store'), {
            onSuccess: () => { createForm.reset(); close(); },
        });
    };

    const submitEdit = (e: React.FormEvent) => {
        e.preventDefault();
        if (activeModal?.type !== 'edit') return;
        editForm.patch(route('admin.devices.update', { device: activeModal.device.id }), {
            onSuccess: () => close(),
        });
    };

    const confirmDelete = () => {
        if (activeModal?.type !== 'delete') return;
        setDeleting(true);
        router.delete(route('admin.devices.destroy', { device: activeModal.device.id }), {
            onFinish: () => { setDeleting(false); close(); },
        });
    };

    const availableOptions  = available_hives.map(h => ({ value: String(h.id), label: h.name }));
    const allHiveOptions    = all_hives.map(h => ({ value: String(h.id), label: h.name }));

    return (
        <AdminLayout>
            <Head title="Devices — Admin" />

            <div className="space-y-6">
                {flash?.success && <Alert variant="success">{flash.success}</Alert>}
                {flash?.error   && <Alert variant="error">{flash.error}</Alert>}

                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h3 className="text-lg font-bold text-amber-900">IoT Devices</h3>
                        <p className="text-sm text-amber-900/50">{devices.length} device{devices.length !== 1 ? 's' : ''} registered</p>
                    </div>
                    <Button
                        variant="primary"
                        size="sm"
                        onClick={() => setActiveModal({ type: 'create' })}
                        disabled={available_hives.length === 0}
                        title={available_hives.length === 0 ? 'All hives already have a device' : undefined}
                    >
                        <Plus className="w-4 h-4 mr-1" />
                        Register Device
                    </Button>
                </div>

                {/* Table */}
                <Card className="overflow-hidden p-0">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="bg-yellow-50/50 border-b border-yellow-100">
                                    <th className="text-left px-6 py-3 text-xs font-bold uppercase tracking-widest text-amber-900/50">Device ID</th>
                                    <th className="text-left px-6 py-3 text-xs font-bold uppercase tracking-widest text-amber-900/50">Hive</th>
                                    <th className="text-left px-6 py-3 text-xs font-bold uppercase tracking-widest text-amber-900/50">Status</th>
                                    <th className="text-left px-6 py-3 text-xs font-bold uppercase tracking-widest text-amber-900/50 hidden md:table-cell">Installed</th>
                                    <th className="text-left px-6 py-3 text-xs font-bold uppercase tracking-widest text-amber-900/50 hidden lg:table-cell">Last Maintenance</th>
                                    <th className="text-left px-6 py-3 text-xs font-bold uppercase tracking-widest text-amber-900/50">Logs</th>
                                    <th className="px-6 py-3" />
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-yellow-50">
                                {devices.length === 0 && (
                                    <tr>
                                        <td colSpan={7} className="px-6 py-10 text-center text-amber-900/40 text-sm">
                                            No devices registered yet.
                                        </td>
                                    </tr>
                                )}
                                {devices.map((device) => (
                                    <tr key={device.id} className="hover:bg-yellow-50/30 transition-colors">
                                        <td className="px-6 py-4 font-mono font-semibold text-amber-950">{device.device_id}</td>
                                        <td className="px-6 py-4 text-amber-800">{device.hive_name ?? '—'}</td>
                                        <td className="px-6 py-4"><StatusBadge status={device.device_status} /></td>
                                        <td className="px-6 py-4 text-amber-900/60 hidden md:table-cell">{device.installation_date ?? '—'}</td>
                                        <td className="px-6 py-4 text-amber-900/60 hidden lg:table-cell">{device.last_maintenance_date ?? '—'}</td>
                                        <td className="px-6 py-4">
                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-700">
                                                {device.sensor_log_count}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <Dropdown
                                                align="right"
                                                trigger={
                                                    <button className="p-1.5 hover:bg-yellow-100 rounded-xl transition-colors">
                                                        <MoreVertical className="w-4 h-4 text-amber-900/50" />
                                                    </button>
                                                }
                                                items={[
                                                    {
                                                        id: 'edit',
                                                        label: 'Edit',
                                                        icon: <Edit2 className="w-4 h-4" />,
                                                        onClick: () => openEdit(device),
                                                    },
                                                    {
                                                        id: 'delete',
                                                        label: 'Delete',
                                                        icon: <Trash2 className="w-4 h-4" />,
                                                        variant: 'danger' as const,
                                                        onClick: () => setActiveModal({ type: 'delete', device }),
                                                    },
                                                ]}
                                            />
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </Card>
            </div>

            {/* ── Create Modal ── */}
            <Modal isOpen={activeModal?.type === 'create'} onClose={close} title="Register Device" maxWidth="sm">
                <form onSubmit={submitCreate} className="space-y-4">
                    <Input
                        label="Device ID"
                        value={createForm.data.device_id}
                        onChange={e => createForm.setData('device_id', e.target.value)}
                        placeholder="e.g. NODE-001"
                        autoFocus
                        error={createForm.errors.device_id}
                    />
                    <SelectField
                        label="Hive"
                        value={createForm.data.hive_id}
                        onChange={v => createForm.setData('hive_id', v)}
                        options={availableOptions}
                        error={createForm.errors.hive_id}
                    />
                    <SelectField
                        label="Status"
                        value={createForm.data.device_status}
                        onChange={v => createForm.setData('device_status', v)}
                        options={STATUS_OPTIONS}
                        error={createForm.errors.device_status}
                    />
                    <Input
                        label="Installation Date"
                        type="date"
                        value={createForm.data.installation_date}
                        onChange={e => createForm.setData('installation_date', e.target.value)}
                        error={createForm.errors.installation_date}
                    />
                    <DatePickerField
                        label="Last Maintenance Date (optional)"
                        value={createForm.data.last_maintenance_date || null}
                        onChange={v => createForm.setData('last_maintenance_date', v ?? '')}
                        maxDate="today"
                        error={createForm.errors.last_maintenance_date}
                    />
                    <div className="flex gap-3 pt-2">
                        <Button type="button" variant="ghost" onClick={close} className="flex-1">Cancel</Button>
                        <Button type="submit" variant="primary" disabled={createForm.processing} className="flex-1">
                            {createForm.processing ? 'Registering...' : 'Register Device'}
                        </Button>
                    </div>
                </form>
            </Modal>

            {/* ── Edit Modal ── */}
            {activeModal?.type === 'edit' && (
                <Modal isOpen onClose={close} title="Edit Device" maxWidth="sm">
                    <form onSubmit={submitEdit} className="space-y-4">
                        <Input
                            label="Device ID"
                            value={editForm.data.device_id}
                            onChange={e => editForm.setData('device_id', e.target.value)}
                            autoFocus
                            error={editForm.errors.device_id}
                        />
                        <SelectField
                            label="Hive"
                            value={editForm.data.hive_id}
                            onChange={v => editForm.setData('hive_id', v)}
                            options={allHiveOptions}
                            error={editForm.errors.hive_id}
                        />
                        <SelectField
                            label="Status"
                            value={editForm.data.device_status}
                            onChange={v => editForm.setData('device_status', v)}
                            options={STATUS_OPTIONS}
                            error={editForm.errors.device_status}
                        />
                        <Input
                            label="Installation Date"
                            type="date"
                            value={editForm.data.installation_date}
                            onChange={e => editForm.setData('installation_date', e.target.value)}
                            error={editForm.errors.installation_date}
                        />
                        <DatePickerField
                            label="Last Maintenance Date (optional)"
                            value={editForm.data.last_maintenance_date || null}
                            onChange={v => editForm.setData('last_maintenance_date', v ?? '')}
                            maxDate="today"
                            error={editForm.errors.last_maintenance_date}
                        />
                        <div className="flex gap-3 pt-2">
                            <Button type="button" variant="ghost" onClick={close} className="flex-1">Cancel</Button>
                            <Button type="submit" variant="primary" disabled={editForm.processing} className="flex-1">
                                {editForm.processing ? 'Saving...' : 'Save Changes'}
                            </Button>
                        </div>
                    </form>
                </Modal>
            )}

            {/* ── Delete Confirmation ── */}
            {activeModal?.type === 'delete' && (
                <Modal isOpen onClose={close} title="Remove Device" maxWidth="sm">
                    <div className="space-y-4">
                        <p className="text-sm text-amber-900/70">
                            Remove <span className="font-semibold text-amber-950 font-mono">"{activeModal.device.device_id}"</span>?
                            {activeModal.device.sensor_log_count > 0 ? (
                                <span className="block mt-2 text-rose-600 font-medium">
                                    This device has {activeModal.device.sensor_log_count} sensor log(s). Delete the logs first.
                                </span>
                            ) : (
                                <span> This cannot be undone.</span>
                            )}
                        </p>
                        <div className="flex gap-3">
                            <Button type="button" variant="ghost" onClick={close} disabled={deleting} className="flex-1">Cancel</Button>
                            <Button
                                type="button"
                                variant="destructive"
                                onClick={confirmDelete}
                                disabled={deleting || activeModal.device.sensor_log_count > 0}
                                className="flex-1"
                            >
                                {deleting ? 'Removing...' : 'Remove Device'}
                            </Button>
                        </div>
                    </div>
                </Modal>
            )}
        </AdminLayout>
    );
}
