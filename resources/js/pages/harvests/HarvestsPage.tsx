import { Head, Link, router, useForm, usePage } from '@inertiajs/react';
import {
    MoreVertical,
    Plus,
    Edit2,
    Trash2,
    ChevronLeft,
    ChevronRight,
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { BeekeeperTabs } from '@/components/core/beekeeper-tabs';
import { Button } from '@/components/core/button';
import { Card } from '@/components/core/card';
import { DataTable } from '@/components/core/content';
import { DatePickerField } from '@/components/core/date-picker';
import { Dropdown } from '@/components/core/dropdown';
import { FlashAlerts } from '@/components/core/flash-alerts';
import type { FlashMessageBag } from '@/components/core/flash-alerts';
import { Modal } from '@/components/core/modal';
import { Breadcrumbs } from '@/components/core/navigation';
import { NumberInput } from '@/components/core/number-input';
import { ProductivityBadge } from '@/components/core/productivity-badge';
import { SelectField } from '@/components/core/select-field';
import { TextareaField } from '@/components/core/textarea-field';
import { AuthenticatedLayout } from '@/layouts/authenticated-layout';
import type {
    Harvest,
    MasterHoneyColor,
    MasterHoneyFlavor,
    PaginatedHarvests,
} from '@/types';

type Props = {
    harvests: PaginatedHarvests;
    hives: { id: number; name: string }[];
    colors: MasterHoneyColor[];
    flavors: MasterHoneyFlavor[];
    filters: { hive_id?: string };
};

type ActiveModal =
    | { type: 'create' }
    | { type: 'view'; index: number }
    | { type: 'edit'; harvest: Harvest }
    | { type: 'delete'; harvest: Harvest }
    | null;

const PRODUCTIVITY_OPTIONS = [
    { value: '', label: '— None —' },
    { value: 'Low', label: 'Low' },
    { value: 'Medium', label: 'Medium' },
    { value: 'High', label: 'High' },
];

const emptyCreate = {
    hive_id: '',
    harvest_date: '',
    weight: '',
    productivity_level: '',
    color_id: '',
    flavor_id: '',
    notes: '',
};

const hiveOptions = (hives: { id: number; name: string }[]) => [
    { value: '', label: 'Select hive...' },
    ...hives.map((h) => ({ value: String(h.id), label: h.name })),
];
const hiveFilterOptions = (hives: { id: number; name: string }[]) => [
    { value: '', label: 'All Hives' },
    ...hives.map((h) => ({ value: String(h.id), label: h.name })),
];
const colorOptions = (colors: MasterHoneyColor[]) => [
    { value: '', label: '— None —' },
    ...colors.map((c) => ({ value: String(c.id), label: c.name })),
];
const flavorOptions = (flavors: MasterHoneyFlavor[]) => [
    { value: '', label: '— None —' },
    ...flavors.map((f) => ({ value: String(f.id), label: f.name })),
];

export default function HarvestsIndex({
    harvests,
    hives,
    colors,
    flavors,
    filters,
}: Props) {
    const { props } = usePage<{ flash?: FlashMessageBag }>();
    const flash = props.flash;

    const [activeModal, setActiveModal] = useState<ActiveModal>(null);
    const [deleting, setDeleting] = useState(false);
    const close = () => setActiveModal(null);
    const viewIndex = activeModal?.type === 'view' ? activeModal.index : null;
    const viewHarvest = viewIndex !== null ? harvests.data[viewIndex] : null;
    const hasPrev = viewIndex !== null && viewIndex > 0;
    const hasNext = viewIndex !== null && viewIndex < harvests.data.length - 1;

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
                    prev?.type === 'view' &&
                    prev.index < harvests.data.length - 1
                        ? { type: 'view', index: prev.index + 1 }
                        : prev,
                );
            }
        };

        window.addEventListener('keydown', handler);

        return () => window.removeEventListener('keydown', handler);
    }, [viewIndex, harvests.data.length]);

    const onHiveFilter = (val: string) => {
        router.get(route('harvests.index'), val ? { hive_id: val } : {}, {
            preserveState: true,
            replace: true,
        });
    };

    const createForm = useForm({ ...emptyCreate });

    const editForm = useForm({
        harvest_date: '',
        weight: '',
        productivity_level: '',
        color_id: '',
        flavor_id: '',
        notes: '',
    });

    const openEdit = (harvest: Harvest) => {
        editForm.setData({
            harvest_date: harvest.harvest_date.slice(0, 10),
            weight: String(harvest.weight),
            productivity_level: harvest.productivity_level ?? '',
            color_id: harvest.color_id ? String(harvest.color_id) : '',
            flavor_id: harvest.flavor_id ? String(harvest.flavor_id) : '',
            notes: harvest.notes ?? '',
        });
        setActiveModal({ type: 'edit', harvest });
    };

    const submitCreate = (e: React.FormEvent) => {
        e.preventDefault();
        createForm.post(route('harvests.store'), {
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
            route('harvests.update', { harvest: activeModal.harvest.id }),
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
            route('harvests.destroy', { harvest: activeModal.harvest.id }),
            {
                onFinish: () => {
                    setDeleting(false);
                    close();
                },
            },
        );
    };

    return (
        <AuthenticatedLayout>
            <Head title="Harvests" />
            <div className="mx-auto max-w-6xl space-y-6 p-6 md:p-10">
                {/* Breadcrumb + tab bar */}
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <Breadcrumbs
                        items={[
                            { label: 'Home', href: '/' },
                            { label: 'Harvests' },
                        ]}
                    />

                    <BeekeeperTabs active="harvests" />
                </div>

                <FlashAlerts key={flash?.id ?? 'harvest-flash'} flash={flash} />

                {/* Header */}
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h3 className="text-lg font-bold text-amber-900">
                            Harvest Records
                        </h3>
                        <p className="text-sm text-amber-900/50">
                            {harvests.total} record
                            {harvests.total !== 1 ? 's' : ''} total
                        </p>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="w-48">
                            <SelectField
                                value={filters.hive_id ?? ''}
                                onChange={onHiveFilter}
                                options={hiveFilterOptions(hives)}
                            />
                        </div>
                        <Button
                            variant="primary"
                            size="sm"
                            onClick={() => setActiveModal({ type: 'create' })}
                        >
                            <Plus className="mr-1 h-4 w-4" />
                            Add Harvest
                        </Button>
                    </div>
                </div>

                {/* Table */}
                <Card className="overflow-hidden p-0">
                    <DataTable
                        tableClassName="w-full text-sm"
                        bodyClassName="divide-y divide-yellow-50"
                        rowClassName="transition-colors hover:bg-yellow-50/30"
                        data={harvests.data}
                        onRowClick={(_, index) =>
                            setActiveModal({ type: 'view', index })
                        }
                        emptyColSpan={7}
                        emptyState={
                            <div className="px-6 py-10 text-center text-sm text-amber-900/40">
                                No harvest records yet. Add one to get started.
                            </div>
                        }
                        columns={[
                            {
                                key: 'hive',
                                header: 'Hive',
                                cellClassName:
                                    'px-6 py-4 font-medium text-amber-950',
                                render: (harvest) => harvest.hive?.name ?? '—',
                            },
                            {
                                key: 'date',
                                header: 'Date',
                                cellClassName: 'px-6 py-4 text-amber-900/70',
                                render: (harvest) =>
                                    new Date(
                                        harvest.harvest_date,
                                    ).toLocaleDateString(),
                            },
                            {
                                key: 'weight',
                                header: 'Weight (kg)',
                                cellClassName: 'px-6 py-4 text-amber-900/70',
                                render: (harvest) => `${harvest.weight} kg`,
                            },
                            {
                                key: 'productivity',
                                header: 'Productivity',
                                headerClassName: 'hidden md:table-cell',
                                cellClassName: 'hidden px-6 py-4 md:table-cell',
                                render: (harvest) => (
                                    <ProductivityBadge
                                        level={harvest.productivity_level}
                                    />
                                ),
                            },
                            {
                                key: 'color',
                                header: 'Color',
                                headerClassName: 'hidden lg:table-cell',
                                cellClassName:
                                    'hidden px-6 py-4 text-amber-900/70 lg:table-cell',
                                render: (harvest) => harvest.color?.name ?? '—',
                            },
                            {
                                key: 'flavor',
                                header: 'Flavor',
                                headerClassName: 'hidden lg:table-cell',
                                cellClassName:
                                    'hidden px-6 py-4 text-amber-900/70 lg:table-cell',
                                render: (harvest) =>
                                    harvest.flavor?.name ?? '—',
                            },
                            {
                                key: 'actions',
                                header: '',
                                headerClassName: 'px-6 py-3',
                                cellClassName: 'px-6 py-4 text-right',
                                render: (harvest) => (
                                    <div onClick={(e) => e.stopPropagation()}>
                                        <Dropdown
                                            align="right"
                                            trigger={
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    className="h-auto rounded-xl p-1.5 text-amber-900/50 hover:bg-yellow-100 hover:text-amber-900/50"
                                                >
                                                    <MoreVertical className="h-4 w-4" />
                                                </Button>
                                            }
                                            items={[
                                                {
                                                    id: 'edit',
                                                    label: 'Edit',
                                                    icon: (
                                                        <Edit2 className="h-4 w-4" />
                                                    ),
                                                    onClick: () =>
                                                        openEdit(harvest),
                                                },
                                                {
                                                    id: 'delete',
                                                    label: 'Delete',
                                                    icon: (
                                                        <Trash2 className="h-4 w-4" />
                                                    ),
                                                    variant: 'danger' as const,
                                                    onClick: () =>
                                                        setActiveModal({
                                                            type: 'delete',
                                                            harvest,
                                                        }),
                                                },
                                            ]}
                                        />
                                    </div>
                                ),
                            },
                        ]}
                    />
                </Card>

                {/* Pagination */}
                {harvests.last_page > 1 && (
                    <div className="flex items-center justify-center gap-1">
                        {harvests.links.map((link, i) =>
                            link.url ? (
                                <Link
                                    key={i}
                                    href={link.url}
                                    className={`rounded-lg px-3 py-1.5 text-sm transition-colors ${
                                        link.active
                                            ? 'bg-amber-500 font-semibold text-white'
                                            : 'text-amber-900/70 hover:bg-yellow-100'
                                    }`}
                                    dangerouslySetInnerHTML={{
                                        __html: link.label,
                                    }}
                                />
                            ) : (
                                <span
                                    key={i}
                                    className="px-3 py-1.5 text-sm text-amber-900/30"
                                    dangerouslySetInnerHTML={{
                                        __html: link.label,
                                    }}
                                />
                            ),
                        )}
                    </div>
                )}
            </div>

            {/* ── Create Modal ── */}
            <Modal
                isOpen={activeModal?.type === 'create'}
                onClose={close}
                title="Add Harvest Record"
                maxWidth="md"
            >
                <form onSubmit={submitCreate} className="space-y-4">
                    <SelectField
                        label="Hive"
                        value={createForm.data.hive_id}
                        onChange={(v) => createForm.setData('hive_id', v)}
                        options={hiveOptions(hives)}
                        error={createForm.errors.hive_id}
                    />

                    <DatePickerField
                        label="Harvest Date"
                        value={createForm.data.harvest_date || null}
                        onChange={(v) =>
                            createForm.setData('harvest_date', v ?? '')
                        }
                        maxDate="today"
                        error={createForm.errors.harvest_date}
                    />

                    <NumberInput
                        label="Weight (kg)"
                        value={createForm.data.weight}
                        onChange={(v) => createForm.setData('weight', v)}
                        min={0.01}
                        max={9999.99}
                        step={0.01}
                        placeholder="e.g. 1.50"
                        unit="kg"
                        error={createForm.errors.weight}
                    />

                    <SelectField
                        label="Productivity Level (optional)"
                        value={createForm.data.productivity_level}
                        onChange={(v) =>
                            createForm.setData('productivity_level', v)
                        }
                        options={PRODUCTIVITY_OPTIONS}
                        error={createForm.errors.productivity_level}
                    />

                    <div className="grid grid-cols-2 gap-4">
                        <SelectField
                            label="Honey Color (optional)"
                            value={createForm.data.color_id}
                            onChange={(v) => createForm.setData('color_id', v)}
                            options={colorOptions(colors)}
                            error={createForm.errors.color_id}
                        />
                        <SelectField
                            label="Honey Flavor (optional)"
                            value={createForm.data.flavor_id}
                            onChange={(v) => createForm.setData('flavor_id', v)}
                            options={flavorOptions(flavors)}
                            error={createForm.errors.flavor_id}
                        />
                    </div>

                    <TextareaField
                        label="Notes (optional)"
                        value={createForm.data.notes}
                        onChange={(e) =>
                            createForm.setData('notes', e.target.value)
                        }
                        placeholder="Any observations about this harvest..."
                        rows={3}
                        error={createForm.errors.notes}
                    />

                    <div className="flex gap-3 pt-2">
                        <Button
                            type="button"
                            variant="ghost"
                            onClick={close}
                            className="flex-1"
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            variant="primary"
                            disabled={createForm.processing}
                            className="flex-1"
                        >
                            {createForm.processing
                                ? 'Saving...'
                                : 'Save Harvest'}
                        </Button>
                    </div>
                </form>
            </Modal>

            {/* ── View Modal ── */}
            {activeModal?.type === 'view' && viewHarvest && (
                <Modal
                    isOpen
                    onClose={close}
                    title="Harvest Details"
                    maxWidth="md"
                >
                    <div className="space-y-4">
                        <div className="-mt-1 mb-1 flex items-center justify-end gap-1">
                            <Button
                                type="button"
                                variant="ghost"
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
                                className="h-auto rounded-xl p-1.5 text-amber-900 hover:bg-yellow-100 disabled:cursor-not-allowed disabled:opacity-20"
                            >
                                <ChevronLeft className="h-4 w-4 text-amber-900" />
                            </Button>
                            <span className="min-w-[3rem] text-center text-xs font-bold text-amber-900/40 tabular-nums">
                                {viewIndex! + 1} / {harvests.data.length}
                            </span>
                            <Button
                                type="button"
                                variant="ghost"
                                onClick={() =>
                                    setActiveModal((prev) =>
                                        prev?.type === 'view' &&
                                        prev.index < harvests.data.length - 1
                                            ? {
                                                  type: 'view',
                                                  index: prev.index + 1,
                                              }
                                            : prev,
                                    )
                                }
                                disabled={!hasNext}
                                className="h-auto rounded-xl p-1.5 text-amber-900 hover:bg-yellow-100 disabled:cursor-not-allowed disabled:opacity-20"
                            >
                                <ChevronRight className="h-4 w-4 text-amber-900" />
                            </Button>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <p className="mb-1 text-xs font-bold tracking-widest text-amber-900/40 uppercase">
                                    Hive
                                </p>
                                <p className="font-medium text-amber-950">
                                    {viewHarvest.hive?.name ?? '—'}
                                </p>
                            </div>
                            <div>
                                <p className="mb-1 text-xs font-bold tracking-widest text-amber-900/40 uppercase">
                                    Date
                                </p>
                                <p className="font-medium text-amber-950">
                                    {new Date(
                                        viewHarvest.harvest_date,
                                    ).toLocaleDateString()}
                                </p>
                            </div>
                            <div>
                                <p className="mb-1 text-xs font-bold tracking-widest text-amber-900/40 uppercase">
                                    Weight
                                </p>
                                <p className="font-medium text-amber-950">
                                    {viewHarvest.weight} kg
                                </p>
                            </div>
                            <div>
                                <p className="mb-1 text-xs font-bold tracking-widest text-amber-900/40 uppercase">
                                    Productivity
                                </p>
                                <ProductivityBadge
                                    level={viewHarvest.productivity_level}
                                />
                            </div>
                            <div>
                                <p className="mb-1 text-xs font-bold tracking-widest text-amber-900/40 uppercase">
                                    Color
                                </p>
                                <p className="font-medium text-amber-950">
                                    {viewHarvest.color?.name ?? '—'}
                                </p>
                            </div>
                            <div>
                                <p className="mb-1 text-xs font-bold tracking-widest text-amber-900/40 uppercase">
                                    Flavor
                                </p>
                                <p className="font-medium text-amber-950">
                                    {viewHarvest.flavor?.name ?? '—'}
                                </p>
                            </div>
                        </div>
                        {viewHarvest.notes && (
                            <div>
                                <p className="mb-1 text-xs font-bold tracking-widest text-amber-900/40 uppercase">
                                    Notes
                                </p>
                                <p className="text-sm whitespace-pre-wrap text-amber-900/70">
                                    {viewHarvest.notes}
                                </p>
                            </div>
                        )}
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
                                onClick={() => openEdit(viewHarvest)}
                                className="flex-1"
                            >
                                Edit
                            </Button>
                        </div>
                    </div>
                </Modal>
            )}

            {/* ── Edit Modal ── */}
            {activeModal?.type === 'edit' && (
                <Modal
                    isOpen
                    onClose={close}
                    title="Edit Harvest Record"
                    maxWidth="md"
                >
                    <form onSubmit={submitEdit} className="space-y-4">
                        <div className="space-y-1.5">
                            <label className="ml-1 text-sm font-medium text-amber-900">
                                Hive
                            </label>
                            <p className="rounded-2xl border border-yellow-100 bg-yellow-50/30 px-4 py-2.5 text-sm text-amber-950/60">
                                {activeModal.harvest.hive?.name}
                            </p>
                        </div>

                        <DatePickerField
                            label="Harvest Date"
                            value={editForm.data.harvest_date || null}
                            onChange={(v) =>
                                editForm.setData('harvest_date', v ?? '')
                            }
                            maxDate="today"
                            error={editForm.errors.harvest_date}
                        />

                        <NumberInput
                            label="Weight (kg)"
                            value={editForm.data.weight}
                            onChange={(v) => editForm.setData('weight', v)}
                            min={0.01}
                            max={9999.99}
                            step={0.01}
                            unit="kg"
                            error={editForm.errors.weight}
                        />

                        <SelectField
                            label="Productivity Level (optional)"
                            value={editForm.data.productivity_level}
                            onChange={(v) =>
                                editForm.setData('productivity_level', v)
                            }
                            options={PRODUCTIVITY_OPTIONS}
                            error={editForm.errors.productivity_level}
                        />

                        <div className="grid grid-cols-2 gap-4">
                            <SelectField
                                label="Honey Color (optional)"
                                value={editForm.data.color_id}
                                onChange={(v) =>
                                    editForm.setData('color_id', v)
                                }
                                options={colorOptions(colors)}
                                error={editForm.errors.color_id}
                            />
                            <SelectField
                                label="Honey Flavor (optional)"
                                value={editForm.data.flavor_id}
                                onChange={(v) =>
                                    editForm.setData('flavor_id', v)
                                }
                                options={flavorOptions(flavors)}
                                error={editForm.errors.flavor_id}
                            />
                        </div>

                        <TextareaField
                            label="Notes (optional)"
                            value={editForm.data.notes}
                            onChange={(e) =>
                                editForm.setData('notes', e.target.value)
                            }
                            rows={3}
                            error={editForm.errors.notes}
                        />

                        <div className="flex gap-3 pt-2">
                            <Button
                                type="button"
                                variant="ghost"
                                onClick={close}
                                className="flex-1"
                            >
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                variant="primary"
                                disabled={editForm.processing}
                                className="flex-1"
                            >
                                {editForm.processing
                                    ? 'Saving...'
                                    : 'Save Changes'}
                            </Button>
                        </div>
                    </form>
                </Modal>
            )}

            {/* ── Delete Confirmation Modal ── */}
            {activeModal?.type === 'delete' && (
                <Modal
                    isOpen
                    onClose={close}
                    title="Delete Harvest Record"
                    maxWidth="sm"
                >
                    <div className="space-y-4">
                        <p className="text-sm text-amber-900/70">
                            Delete the harvest record for{' '}
                            <span className="font-semibold text-amber-950">
                                {activeModal.harvest.hive?.name}
                            </span>{' '}
                            on{' '}
                            <span className="font-semibold text-amber-950">
                                {new Date(
                                    activeModal.harvest.harvest_date,
                                ).toLocaleDateString()}
                            </span>
                            ? This cannot be undone.
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
                                disabled={deleting}
                                className="flex-1"
                            >
                                {deleting ? 'Deleting...' : 'Delete'}
                            </Button>
                        </div>
                    </div>
                </Modal>
            )}
        </AuthenticatedLayout>
    );
}
