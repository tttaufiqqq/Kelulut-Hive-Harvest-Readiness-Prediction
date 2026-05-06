import { Head, router, useForm, usePage } from '@inertiajs/react';
import {
    MoreVertical,
    Plus,
    Edit2,
    Trash2,
    ChevronLeft,
    ChevronRight,
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { Button } from '@/components/core/button';
import { Card } from '@/components/core/card';
import { DatePickerField } from '@/components/core/date-picker';
import { Dropdown } from '@/components/core/dropdown';
import { FlashAlerts } from '@/components/core/flash-alerts';
import type { FlashMessageBag } from '@/components/core/flash-alerts';
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
    | { type: 'view'; index: number }
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
    { value: 'active', label: 'Active' },
    { value: 'inactive', label: 'Inactive' },
];

function StatusBadge({ status }: { status: 'active' | 'inactive' }) {
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

export default function DevicesIndex({
    devices,
    all_hives,
    available_hives,
}: PageProps) {
    const { props } = usePage<{ flash?: FlashMessageBag }>();
    const flash = props.flash;

    const [activeModal, setActiveModal] = useState<ActiveModal>(null);
    const [deleting, setDeleting] = useState(false);
    const close = () => setActiveModal(null);

    const viewIndex = activeModal?.type === 'view' ? activeModal.index : null;
    const viewDevice = viewIndex !== null ? devices[viewIndex] : null;
    const hasPrev = viewIndex !== null && viewIndex > 0;
    const hasNext = viewIndex !== null && viewIndex < devices.length - 1;

    useEffect(() => {
        if (viewIndex === null) {
            return;
        }

        const handler = (e: KeyboardEvent) => {
            if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
                e.preventDefault();
                setActiveModal((prev) =>
                    prev?.type === 'view' && prev.index > 0
                        ? { type: 'view', index: prev.index - 1 }
                        : prev,
                );
            }

            if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
                e.preventDefault();
                setActiveModal((prev) =>
                    prev?.type === 'view' && prev.index < devices.length - 1
                        ? { type: 'view', index: prev.index + 1 }
                        : prev,
                );
            }
        };
        window.addEventListener('keydown', handler);

        return () => window.removeEventListener('keydown', handler);
    }, [viewIndex, devices.length]);

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
            device_id: device.device_id,
            hive_id: String(device.hive_id),
            device_status: device.device_status,
            installation_date: device.installation_date ?? '',
            last_maintenance_date: device.last_maintenance_date ?? '',
        });
        setActiveModal({ type: 'edit', device });
    };

    const submitCreate = (e: React.FormEvent) => {
        e.preventDefault();
        createForm.post(route('admin.devices.store'), {
            onSuccess: () => {
                createForm.reset();
                close();
            },
        });
    };

    const submitEdit = (e: React.FormEvent) => {
        e.preventDefault();

        if (activeModal?.type !== 'edit') {
            return;
        }

        editForm.patch(
            route('admin.devices.update', { device: activeModal.device.id }),
            {
                onSuccess: () => close(),
            },
        );
    };

    const confirmDelete = () => {
        if (activeModal?.type !== 'delete') {
            return;
        }

        setDeleting(true);
        router.delete(
            route('admin.devices.destroy', { device: activeModal.device.id }),
            {
                onFinish: () => {
                    setDeleting(false);
                    close();
                },
            },
        );
    };

    const availableOptions = available_hives.map((h) => ({
        value: String(h.id),
        label: h.name,
    }));
    const allHiveOptions = all_hives.map((h) => ({
        value: String(h.id),
        label: h.name,
    }));

    return (
        <AdminLayout>
            <Head title="Devices — Admin" />

            <div className="space-y-6">
                <FlashAlerts key={flash?.id ?? 'device-flash'} flash={flash} />

                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h3 className="text-lg font-bold text-amber-900">
                            IoT Devices
                        </h3>
                        <p className="text-sm text-amber-900/50">
                            {devices.length} device
                            {devices.length !== 1 ? 's' : ''} registered
                        </p>
                    </div>
                    <Button
                        variant="primary"
                        size="sm"
                        onClick={() => setActiveModal({ type: 'create' })}
                        disabled={available_hives.length === 0}
                        title={
                            available_hives.length === 0
                                ? 'All hives already have a device'
                                : undefined
                        }
                    >
                        <Plus className="mr-1 h-4 w-4" />
                        Register Device
                    </Button>
                </div>

                {/* Table */}
                <Card className="overflow-hidden p-0">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-yellow-100 bg-yellow-50/50">
                                    <th className="px-6 py-3 text-left text-xs font-bold tracking-widest text-amber-900/50 uppercase">
                                        Device ID
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-bold tracking-widest text-amber-900/50 uppercase">
                                        Hive
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-bold tracking-widest text-amber-900/50 uppercase">
                                        Status
                                    </th>
                                    <th className="hidden px-6 py-3 text-left text-xs font-bold tracking-widest text-amber-900/50 uppercase md:table-cell">
                                        Installed
                                    </th>
                                    <th className="hidden px-6 py-3 text-left text-xs font-bold tracking-widest text-amber-900/50 uppercase lg:table-cell">
                                        Last Maintenance
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-bold tracking-widest text-amber-900/50 uppercase">
                                        Logs
                                    </th>
                                    <th className="px-6 py-3" />
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-yellow-50">
                                {devices.length === 0 && (
                                    <tr>
                                        <td
                                            colSpan={7}
                                            className="px-6 py-10 text-center text-sm text-amber-900/40"
                                        >
                                            No devices registered yet.
                                        </td>
                                    </tr>
                                )}
                                {devices.map((device, index) => (
                                    <tr
                                        key={device.id}
                                        className="cursor-pointer transition-colors hover:bg-yellow-50/30"
                                        onClick={() =>
                                            setActiveModal({
                                                type: 'view',
                                                index,
                                            })
                                        }
                                    >
                                        <td className="px-6 py-4 font-mono font-semibold text-amber-950">
                                            {device.device_id}
                                        </td>
                                        <td className="px-6 py-4 text-amber-800">
                                            {device.hive_name ?? '—'}
                                        </td>
                                        <td className="px-6 py-4">
                                            <StatusBadge
                                                status={device.device_status}
                                            />
                                        </td>
                                        <td className="hidden px-6 py-4 text-amber-900/60 md:table-cell">
                                            {device.installation_date ?? '—'}
                                        </td>
                                        <td className="hidden px-6 py-4 text-amber-900/60 lg:table-cell">
                                            {device.last_maintenance_date ??
                                                '—'}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="inline-flex items-center rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-bold text-amber-700">
                                                {device.sensor_log_count}
                                            </span>
                                        </td>
                                        <td
                                            className="px-6 py-4 text-right"
                                            onClick={(e) => e.stopPropagation()}
                                        >
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
                                                        icon: (
                                                            <Edit2 className="h-4 w-4" />
                                                        ),
                                                        onClick: () =>
                                                            openEdit(device),
                                                    },
                                                    {
                                                        id: 'delete',
                                                        label: 'Delete',
                                                        icon: (
                                                            <Trash2 className="h-4 w-4" />
                                                        ),
                                                        variant:
                                                            'danger' as const,
                                                        onClick: () =>
                                                            setActiveModal({
                                                                type: 'delete',
                                                                device,
                                                            }),
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

            {/* ── View Modal ── */}
            {activeModal?.type === 'view' && viewDevice && (
                <Modal
                    isOpen
                    onClose={close}
                    title="Device Details"
                    maxWidth="sm"
                >
                    <div className="space-y-4">
                        <div className="-mt-1 mb-1 flex items-center justify-end gap-1">
                            <button
                                onClick={() =>
                                    setActiveModal((prev) =>
                                        prev?.type === 'view' && prev.index > 0
                                            ? {
                                                  type: 'view',
                                                  index: prev.index - 1,
                                              }
                                            : prev,
                                    )
                                }
                                disabled={!hasPrev}
                                className="rounded-xl p-1.5 transition-colors hover:bg-yellow-100 disabled:cursor-not-allowed disabled:opacity-20"
                            >
                                <ChevronLeft className="h-4 w-4 text-amber-900" />
                            </button>
                            <span className="min-w-[3rem] text-center text-xs font-bold text-amber-900/40 tabular-nums">
                                {viewIndex! + 1} / {devices.length}
                            </span>
                            <button
                                onClick={() =>
                                    setActiveModal((prev) =>
                                        prev?.type === 'view' &&
                                        prev.index < devices.length - 1
                                            ? {
                                                  type: 'view',
                                                  index: prev.index + 1,
                                              }
                                            : prev,
                                    )
                                }
                                disabled={!hasNext}
                                className="rounded-xl p-1.5 transition-colors hover:bg-yellow-100 disabled:cursor-not-allowed disabled:opacity-20"
                            >
                                <ChevronRight className="h-4 w-4 text-amber-900" />
                            </button>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <p className="mb-1 text-xs font-bold tracking-widest text-amber-900/40 uppercase">
                                    Device ID
                                </p>
                                <p className="font-mono font-semibold text-amber-950">
                                    {viewDevice.device_id}
                                </p>
                            </div>
                            <div>
                                <p className="mb-1 text-xs font-bold tracking-widest text-amber-900/40 uppercase">
                                    Status
                                </p>
                                <StatusBadge
                                    status={viewDevice.device_status}
                                />
                            </div>
                            <div>
                                <p className="mb-1 text-xs font-bold tracking-widest text-amber-900/40 uppercase">
                                    Hive
                                </p>
                                <p className="font-medium text-amber-950">
                                    {viewDevice.hive_name ?? '—'}
                                </p>
                            </div>
                            <div>
                                <p className="mb-1 text-xs font-bold tracking-widest text-amber-900/40 uppercase">
                                    Sensor Logs
                                </p>
                                <span className="inline-flex items-center rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-bold text-amber-700">
                                    {viewDevice.sensor_log_count}
                                </span>
                            </div>
                            <div>
                                <p className="mb-1 text-xs font-bold tracking-widest text-amber-900/40 uppercase">
                                    Installed
                                </p>
                                <p className="font-medium text-amber-950">
                                    {viewDevice.installation_date ?? '—'}
                                </p>
                            </div>
                            <div>
                                <p className="mb-1 text-xs font-bold tracking-widest text-amber-900/40 uppercase">
                                    Last Maintenance
                                </p>
                                <p className="font-medium text-amber-950">
                                    {viewDevice.last_maintenance_date ?? '—'}
                                </p>
                            </div>
                        </div>
                        <p className="text-center text-[10px] tracking-widest text-amber-900/25 uppercase">
                            Use arrow keys to navigate
                        </p>
                        <div className="flex gap-3 pt-2">
                            <Button
                                type="button"
                                variant="ghost"
                                onClick={close}
                                className="flex-1"
                            >
                                Close
                            </Button>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => {
                                    close();
                                    openEdit(viewDevice!);
                                }}
                                className="flex-1"
                            >
                                Edit
                            </Button>
                        </div>
                    </div>
                </Modal>
            )}

            {/* ── Create Modal ── */}
            <Modal
                isOpen={activeModal?.type === 'create'}
                onClose={close}
                title="Register Device"
                maxWidth="sm"
            >
                <form onSubmit={submitCreate} className="space-y-4">
                    <Input
                        label="Device ID"
                        value={createForm.data.device_id}
                        onChange={(e) =>
                            createForm.setData('device_id', e.target.value)
                        }
                        placeholder="e.g. NODE-001"
                        autoFocus
                        error={createForm.errors.device_id}
                    />
                    <SelectField
                        label="Hive"
                        value={createForm.data.hive_id}
                        onChange={(v) => createForm.setData('hive_id', v)}
                        options={availableOptions}
                        error={createForm.errors.hive_id}
                    />
                    <SelectField
                        label="Status"
                        value={createForm.data.device_status}
                        onChange={(v) => createForm.setData('device_status', v)}
                        options={STATUS_OPTIONS}
                        error={createForm.errors.device_status}
                    />
                    <DatePickerField
                        label="Installation Date"
                        value={createForm.data.installation_date || null}
                        onChange={(v) =>
                            createForm.setData('installation_date', v ?? '')
                        }
                        maxDate="today"
                        error={createForm.errors.installation_date}
                    />
                    <DatePickerField
                        label="Last Maintenance Date (optional)"
                        value={createForm.data.last_maintenance_date || null}
                        onChange={(v) =>
                            createForm.setData('last_maintenance_date', v ?? '')
                        }
                        maxDate="today"
                        error={createForm.errors.last_maintenance_date}
                    />
                    <div className="grid grid-cols-1 gap-3 pt-2 sm:grid-cols-2">
                        <Button
                            type="button"
                            variant="ghost"
                            onClick={close}
                            className="w-full"
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            variant="primary"
                            disabled={createForm.processing}
                            className="w-full"
                        >
                            {createForm.processing
                                ? 'Registering...'
                                : 'Register Device'}
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
                            onChange={(e) =>
                                editForm.setData('device_id', e.target.value)
                            }
                            autoFocus
                            error={editForm.errors.device_id}
                        />
                        <SelectField
                            label="Hive"
                            value={editForm.data.hive_id}
                            onChange={(v) => editForm.setData('hive_id', v)}
                            options={allHiveOptions}
                            error={editForm.errors.hive_id}
                        />
                        <SelectField
                            label="Status"
                            value={editForm.data.device_status}
                            onChange={(v) =>
                                editForm.setData('device_status', v)
                            }
                            options={STATUS_OPTIONS}
                            error={editForm.errors.device_status}
                        />
                        <DatePickerField
                            label="Installation Date"
                            value={editForm.data.installation_date || null}
                            onChange={(v) =>
                                editForm.setData('installation_date', v ?? '')
                            }
                            maxDate="today"
                            error={editForm.errors.installation_date}
                        />
                        <DatePickerField
                            label="Last Maintenance Date (optional)"
                            value={editForm.data.last_maintenance_date || null}
                            onChange={(v) =>
                                editForm.setData(
                                    'last_maintenance_date',
                                    v ?? '',
                                )
                            }
                            maxDate="today"
                            error={editForm.errors.last_maintenance_date}
                        />
                        <div className="grid grid-cols-1 gap-3 pt-2 sm:grid-cols-2">
                            <Button
                                type="button"
                                variant="ghost"
                                onClick={close}
                                className="w-full"
                            >
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                variant="primary"
                                disabled={editForm.processing}
                                className="w-full"
                            >
                                {editForm.processing
                                    ? 'Saving...'
                                    : 'Save Changes'}
                            </Button>
                        </div>
                    </form>
                </Modal>
            )}

            {/* ── Delete Confirmation ── */}
            {activeModal?.type === 'delete' && (
                <Modal
                    isOpen
                    onClose={close}
                    title="Remove Device"
                    maxWidth="sm"
                >
                    <div className="space-y-4">
                        <p className="text-sm text-amber-900/70">
                            Remove{' '}
                            <span className="font-mono font-semibold text-amber-950">
                                "{activeModal.device.device_id}"
                            </span>
                            ?
                            {activeModal.device.sensor_log_count > 0 ? (
                                <span className="mt-2 block font-medium text-rose-600">
                                    This device has{' '}
                                    {activeModal.device.sensor_log_count} sensor
                                    log(s). Delete the logs first.
                                </span>
                            ) : (
                                <span> This cannot be undone.</span>
                            )}
                        </p>
                        <div className="flex gap-3">
                            <Button
                                type="button"
                                variant="ghost"
                                onClick={close}
                                disabled={deleting}
                                className="flex-1"
                            >
                                Cancel
                            </Button>
                            <Button
                                type="button"
                                variant="destructive"
                                onClick={confirmDelete}
                                disabled={
                                    deleting ||
                                    activeModal.device.sensor_log_count > 0
                                }
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
