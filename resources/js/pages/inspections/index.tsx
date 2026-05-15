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
import { BloomingBadge } from '@/components/core/blooming-badge';
import { Button } from '@/components/core/button';
import { Card } from '@/components/core/card';
import { DataTable } from '@/components/core/content';
import { DatePickerField } from '@/components/core/date-picker';
import { Dropdown } from '@/components/core/dropdown';
import { FlashAlerts } from '@/components/core/flash-alerts';
import type { FlashMessageBag } from '@/components/core/flash-alerts';
import { ConfirmModal } from '@/components/core/confirm-modal';
import { Modal } from '@/components/core/modal';
import { MultiSelectField } from '@/components/core/multi-select-field';
import { Breadcrumbs } from '@/components/core/navigation';
import { SelectField } from '@/components/core/select-field';
import { TextareaField } from '@/components/core/textarea-field';
import { WeatherPills } from '@/components/core/weather-pills';
import { AuthenticatedLayout } from '@/layouts/authenticated-layout';
import type {
    Inspection,
    MasterWeatherCondition,
    MasterFloraType,
    PaginatedInspections,
} from '@/types';

type Props = {
    inspections: PaginatedInspections;
    hives: { id: number; name: string }[];
    weatherConditions: MasterWeatherCondition[];
    floraTypes: MasterFloraType[];
    filters: { hive_id?: string };
};

type ActiveModal =
    | { type: 'create' }
    | { type: 'view'; index: number }
    | { type: 'edit'; inspection: Inspection }
    | { type: 'confirm-edit'; inspection: Inspection }
    | { type: 'delete'; inspection: Inspection }
    | null;

const BLOOMING_OPTIONS = [
    { value: 'pre_bloom', label: 'Pre-Bloom' },
    { value: 'early_bloom', label: 'Early Bloom' },
    { value: 'peak_bloom', label: 'Peak Bloom' },
    { value: 'post_bloom', label: 'Post-Bloom' },
    { value: 'dormant', label: 'Dormant' },
];

const VEGETATION_OPTIONS = [
    { value: 'sparse', label: 'Sparse' },
    { value: 'moderate', label: 'Moderate' },
    { value: 'dense', label: 'Dense' },
];

const NECTAR_OPTIONS = [
    { value: 'scarce', label: 'Scarce' },
    { value: 'moderate', label: 'Moderate' },
    { value: 'abundant', label: 'Abundant' },
];

const DAMAGE_OPTIONS = [
    { value: 'none', label: 'None' },
    { value: 'minor', label: 'Minor' },
    { value: 'moderate', label: 'Moderate' },
    { value: 'severe', label: 'Severe' },
];

const hiveOptions = (hives: { id: number; name: string }[]) => [
    { value: '', label: 'All Hives' },
    ...hives.map((h) => ({ value: String(h.id), label: h.name })),
];

const hiveFormOptions = (hives: { id: number; name: string }[]) => [
    { value: '', label: 'Select hive...' },
    ...hives.map((h) => ({ value: String(h.id), label: h.name })),
];

const toMultiIds = (items?: { id: number }[]) => items?.map((i) => i.id) ?? [];

const emptyCreate = {
    hive_id: '',
    inspection_date: '',
    blooming_status: '',
    vegetation_density: '',
    nectar_source_availability: '',
    structural_damage: '',
    food_source_observation: '',
    notes: '',
};

type InspectionCreateFormData = typeof emptyCreate & {
    weather_ids: number[];
    flora_ids: number[];
};

type InspectionEditFormData = Omit<InspectionCreateFormData, 'hive_id'>;

export default function InspectionsIndex({
    inspections,
    hives,
    weatherConditions,
    floraTypes,
    filters,
}: Props) {
    const { props } = usePage<{ flash?: FlashMessageBag }>();
    const flash = props.flash;

    const [activeModal, setActiveModal] = useState<ActiveModal>(null);
    const [deleting, setDeleting] = useState(false);
    const close = () => setActiveModal(null);
    const viewIndex = activeModal?.type === 'view' ? activeModal.index : null;
    const viewInspection =
        viewIndex !== null ? inspections.data[viewIndex] : null;
    const hasPrev = viewIndex !== null && viewIndex > 0;
    const hasNext =
        viewIndex !== null && viewIndex < inspections.data.length - 1;

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
                    prev.index < inspections.data.length - 1
                        ? { type: 'view', index: prev.index + 1 }
                        : prev,
                );
            }
        };

        window.addEventListener('keydown', handler);

        return () => window.removeEventListener('keydown', handler);
    }, [viewIndex, inspections.data.length]);

    // Multi-select state lives outside useForm (arrays don't integrate cleanly)
    const [createWeatherIds, setCreateWeatherIds] = useState<number[]>([]);
    const [createFloraIds, setCreateFloraIds] = useState<number[]>([]);
    const [editWeatherIds, setEditWeatherIds] = useState<number[]>([]);
    const [editFloraIds, setEditFloraIds] = useState<number[]>([]);

    const createForm = useForm<InspectionCreateFormData>({
        ...emptyCreate,
        weather_ids: [],
        flora_ids: [],
    });
    const editForm = useForm<InspectionEditFormData>({
        inspection_date: '',
        blooming_status: '',
        vegetation_density: '',
        nectar_source_availability: '',
        structural_damage: '',
        food_source_observation: '',
        notes: '',
        weather_ids: [],
        flora_ids: [],
    });

    const openEdit = (inspection: Inspection) => {
        editForm.setData({
            inspection_date: inspection.inspection_date.slice(0, 10),
            blooming_status: inspection.blooming_status ?? '',
            vegetation_density: inspection.vegetation_density ?? '',
            nectar_source_availability:
                inspection.nectar_source_availability ?? '',
            structural_damage: inspection.structural_damage ?? '',
            food_source_observation: inspection.food_source_observation ?? '',
            notes: inspection.notes ?? '',
            weather_ids: toMultiIds(inspection.weather_conditions),
            flora_ids: toMultiIds(inspection.flora_types),
        });
        setEditWeatherIds(toMultiIds(inspection.weather_conditions));
        setEditFloraIds(toMultiIds(inspection.flora_types));
        setActiveModal({ type: 'edit', inspection });
    };

    const submitCreate = (e: React.FormEvent) => {
        e.preventDefault();
        createForm.transform((data) => ({
            ...data,
            weather_ids: createWeatherIds,
            flora_ids: createFloraIds,
        }));
        createForm.post(route('inspections.store'), {
            onSuccess: () => {
                createForm.reset();
                setCreateWeatherIds([]);
                setCreateFloraIds([]);
                close();
            },
        });
    };

    const openEditConfirm = () => {
        if (activeModal?.type !== 'edit') {
            return;
        }

        setActiveModal({ type: 'confirm-edit', inspection: activeModal.inspection });
    };

    const submitEdit = (e: React.FormEvent) => {
        e.preventDefault();
        openEditConfirm();
    };

    const confirmEdit = () => {
        if (activeModal?.type !== 'confirm-edit') {
            return;
        }

        editForm.transform((data) => ({
            ...data,
            weather_ids: editWeatherIds,
            flora_ids: editFloraIds,
        }));
        editForm.patch(
            route('inspections.update', {
                inspection: activeModal.inspection.id,
            }),
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
            route('inspections.destroy', {
                inspection: activeModal.inspection.id,
            }),
            {
                onFinish: () => {
                    setDeleting(false);
                    close();
                },
            },
        );
    };

    const onHiveFilter = (val: string) => {
        router.get(route('inspections.index'), val ? { hive_id: val } : {}, {
            preserveState: true,
            replace: true,
        });
    };

    const masterToOptions = (items: { id: number; name: string }[]) =>
        items.map((i) => ({ value: i.id, label: i.name }));

    return (
        <AuthenticatedLayout>
            <Head title="Inspections" />
            <div className="mx-auto max-w-7xl space-y-6 p-6 md:p-10 lg:px-10 lg:py-8">
                {/* Breadcrumb + tab bar */}
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <Breadcrumbs
                        items={[
                            { label: 'Home', href: '/' },
                            { label: 'Inspections' },
                        ]}
                    />

                    <BeekeeperTabs active="inspections" />
                </div>

                <FlashAlerts
                    key={flash?.id ?? 'inspection-flash'}
                    flash={flash}
                />

                {/* Header + filter */}
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h3 className="text-lg font-bold text-amber-900">
                            Inspection Records
                        </h3>
                        <p className="text-sm text-amber-900/50">
                            {inspections.total} record
                            {inspections.total !== 1 ? 's' : ''} total
                        </p>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="w-48">
                            <SelectField
                                value={filters.hive_id ?? ''}
                                onChange={onHiveFilter}
                                options={hiveOptions(hives)}
                            />
                        </div>
                        <Button
                            variant="primary"
                            size="sm"
                            onClick={() => setActiveModal({ type: 'create' })}
                        >
                            <Plus className="mr-1 h-4 w-4" />
                            Add Inspection
                        </Button>
                    </div>
                </div>

                {/* Table */}
                <Card className="overflow-hidden p-0">
                    <DataTable
                        tableClassName="w-full text-sm"
                        bodyClassName="divide-y divide-yellow-50"
                        rowClassName="transition-colors hover:bg-yellow-50/30"
                        data={inspections.data}
                        onRowClick={(_, index) =>
                            setActiveModal({ type: 'view', index })
                        }
                        emptyColSpan={5}
                        emptyState={
                            <div className="px-6 py-10 text-center text-sm text-amber-900/40">
                                No inspection records yet. Add one to get
                                started.
                            </div>
                        }
                        columns={[
                            {
                                key: 'hive',
                                header: 'Hive',
                                cellClassName:
                                    'px-6 py-4 font-medium text-amber-950',
                                render: (inspection) =>
                                    inspection.hive?.name ?? '—',
                            },
                            {
                                key: 'date',
                                header: 'Date',
                                cellClassName: 'px-6 py-4 text-amber-900/70',
                                render: (inspection) =>
                                    new Date(
                                        inspection.inspection_date,
                                    ).toLocaleDateString(),
                            },
                            {
                                key: 'blooming',
                                header: 'Blooming',
                                headerClassName: 'hidden md:table-cell',
                                cellClassName: 'hidden px-6 py-4 md:table-cell',
                                render: (inspection) => (
                                    <BloomingBadge
                                        status={inspection.blooming_status}
                                    />
                                ),
                            },
                            {
                                key: 'weather',
                                header: 'Weather',
                                headerClassName: 'hidden lg:table-cell',
                                cellClassName: 'hidden px-6 py-4 lg:table-cell',
                                render: (inspection) => (
                                    <WeatherPills
                                        conditions={
                                            inspection.weather_conditions
                                        }
                                    />
                                ),
                            },
                            {
                                key: 'actions',
                                header: '',
                                headerClassName: 'px-6 py-3',
                                cellClassName: 'px-6 py-4 text-right',
                                render: (inspection) => (
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
                                                        openEdit(inspection),
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
                                                            inspection,
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
                {inspections.last_page > 1 && (
                    <div className="flex items-center justify-center gap-1">
                        {inspections.links.map((link, i) =>
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
                title="Add Inspection Record"
                maxWidth="2xl"
            >
                <form onSubmit={submitCreate} className="space-y-4">
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <SelectField
                            label="Hive"
                            value={createForm.data.hive_id}
                            onChange={(v) => createForm.setData('hive_id', v)}
                            options={hiveFormOptions(hives)}
                            error={createForm.errors.hive_id}
                        />
                        <DatePickerField
                            label="Inspection Date"
                            value={createForm.data.inspection_date || null}
                            onChange={(v) =>
                                createForm.setData('inspection_date', v ?? '')
                            }
                            maxDate="today"
                            error={createForm.errors.inspection_date}
                        />
                    </div>

                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                        <SelectField
                            label="Blooming Status"
                            value={createForm.data.blooming_status}
                            onChange={(v) =>
                                createForm.setData('blooming_status', v)
                            }
                            options={BLOOMING_OPTIONS}
                            error={createForm.errors.blooming_status}
                        />
                        <SelectField
                            label="Vegetation Density"
                            value={createForm.data.vegetation_density}
                            onChange={(v) =>
                                createForm.setData('vegetation_density', v)
                            }
                            options={VEGETATION_OPTIONS}
                            error={createForm.errors.vegetation_density}
                        />
                        <SelectField
                            label="Nectar Availability"
                            value={createForm.data.nectar_source_availability}
                            onChange={(v) =>
                                createForm.setData(
                                    'nectar_source_availability',
                                    v,
                                )
                            }
                            options={NECTAR_OPTIONS}
                            error={createForm.errors.nectar_source_availability}
                        />
                    </div>

                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                        <SelectField
                            label="Structural Damage"
                            value={createForm.data.structural_damage}
                            onChange={(v) =>
                                createForm.setData('structural_damage', v)
                            }
                            options={DAMAGE_OPTIONS}
                            error={createForm.errors.structural_damage}
                        />
                        <MultiSelectField
                            label="Weather Conditions"
                            value={createWeatherIds}
                            onChange={setCreateWeatherIds}
                            options={masterToOptions(weatherConditions)}
                            placeholder="Select..."
                            error={createForm.errors.weather_ids}
                        />
                        <MultiSelectField
                            label="Flora Types"
                            value={createFloraIds}
                            onChange={setCreateFloraIds}
                            options={masterToOptions(floraTypes)}
                            placeholder="Select..."
                            error={createForm.errors.flora_ids}
                        />
                    </div>

                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <TextareaField
                            label="Food Source Observation"
                            value={createForm.data.food_source_observation}
                            onChange={(e) =>
                                createForm.setData(
                                    'food_source_observation',
                                    e.target.value,
                                )
                            }
                            placeholder="Describe food source observations..."
                            rows={3}
                            error={createForm.errors.food_source_observation}
                        />
                        <TextareaField
                            label="Notes"
                            value={createForm.data.notes}
                            onChange={(e) =>
                                createForm.setData('notes', e.target.value)
                            }
                            placeholder="Any additional observations..."
                            rows={3}
                            error={createForm.errors.notes}
                        />
                    </div>

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
                                : 'Save Inspection'}
                        </Button>
                    </div>
                </form>
            </Modal>

            {/* ── View Modal ── */}
            {activeModal?.type === 'view' && viewInspection && (
                <Modal
                    isOpen
                    onClose={close}
                    title="Inspection Details"
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
                                {viewIndex! + 1} / {inspections.data.length}
                            </span>
                            <Button
                                type="button"
                                variant="ghost"
                                onClick={() =>
                                    setActiveModal((prev) =>
                                        prev?.type === 'view' &&
                                        prev.index < inspections.data.length - 1
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
                                    {viewInspection.hive?.name ?? '—'}
                                </p>
                            </div>
                            <div>
                                <p className="mb-1 text-xs font-bold tracking-widest text-amber-900/40 uppercase">
                                    Date
                                </p>
                                <p className="font-medium text-amber-950">
                                    {new Date(
                                        viewInspection.inspection_date,
                                    ).toLocaleDateString()}
                                </p>
                            </div>
                            <div>
                                <p className="mb-1 text-xs font-bold tracking-widest text-amber-900/40 uppercase">
                                    Blooming Status
                                </p>
                                <BloomingBadge
                                    status={viewInspection.blooming_status}
                                />
                            </div>
                            <div>
                                <p className="mb-1 text-xs font-bold tracking-widest text-amber-900/40 uppercase">
                                    Structural Damage
                                </p>
                                <p className="font-medium text-amber-950 capitalize">
                                    {viewInspection.structural_damage ?? '—'}
                                </p>
                            </div>
                            <div>
                                <p className="mb-1 text-xs font-bold tracking-widest text-amber-900/40 uppercase">
                                    Vegetation Density
                                </p>
                                <p className="font-medium text-amber-950 capitalize">
                                    {viewInspection.vegetation_density ?? '—'}
                                </p>
                            </div>
                            <div>
                                <p className="mb-1 text-xs font-bold tracking-widest text-amber-900/40 uppercase">
                                    Nectar Availability
                                </p>
                                <p className="font-medium text-amber-950 capitalize">
                                    {viewInspection.nectar_source_availability ??
                                        '—'}
                                </p>
                            </div>
                        </div>
                        <div>
                            <p className="mb-1 text-xs font-bold tracking-widest text-amber-900/40 uppercase">
                                Weather Conditions
                            </p>
                            <WeatherPills
                                conditions={viewInspection.weather_conditions}
                            />
                        </div>
                        {viewInspection.flora_types &&
                            viewInspection.flora_types.length > 0 && (
                                <div>
                                    <p className="mb-1 text-xs font-bold tracking-widest text-amber-900/40 uppercase">
                                        Flora Types
                                    </p>
                                    <div className="flex flex-wrap gap-1">
                                        {viewInspection.flora_types.map((f) => (
                                            <span
                                                key={f.id}
                                                className="inline-flex items-center rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700"
                                            >
                                                {f.name}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}
                        {viewInspection.food_source_observation && (
                            <div>
                                <p className="mb-1 text-xs font-bold tracking-widest text-amber-900/40 uppercase">
                                    Food Source Observation
                                </p>
                                <p className="text-sm whitespace-pre-wrap text-amber-900/70">
                                    {viewInspection.food_source_observation}
                                </p>
                            </div>
                        )}
                        {viewInspection.notes && (
                            <div>
                                <p className="mb-1 text-xs font-bold tracking-widest text-amber-900/40 uppercase">
                                    Notes
                                </p>
                                <p className="text-sm whitespace-pre-wrap text-amber-900/70">
                                    {viewInspection.notes}
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
                                onClick={() => openEdit(viewInspection)}
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
                    title="Edit Inspection Record"
                    maxWidth="2xl"
                >
                    <form onSubmit={submitEdit} className="space-y-4">
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                            <div className="space-y-1.5">
                                <label className="ml-1 text-sm font-medium text-amber-900">
                                    Hive
                                </label>
                                <p className="rounded-2xl border border-yellow-100 bg-yellow-50/30 px-4 py-2.5 text-sm text-amber-950/60">
                                    {activeModal.inspection.hive?.name}
                                </p>
                            </div>
                            <DatePickerField
                                label="Inspection Date"
                                value={editForm.data.inspection_date || null}
                                onChange={(v) =>
                                    editForm.setData('inspection_date', v ?? '')
                                }
                                maxDate="today"
                                error={editForm.errors.inspection_date}
                            />
                        </div>

                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                            <SelectField
                                label="Blooming Status"
                                value={editForm.data.blooming_status}
                                onChange={(v) =>
                                    editForm.setData('blooming_status', v)
                                }
                                options={BLOOMING_OPTIONS}
                                error={editForm.errors.blooming_status}
                            />
                            <SelectField
                                label="Vegetation Density"
                                value={editForm.data.vegetation_density}
                                onChange={(v) =>
                                    editForm.setData('vegetation_density', v)
                                }
                                options={VEGETATION_OPTIONS}
                                error={editForm.errors.vegetation_density}
                            />
                            <SelectField
                                label="Nectar Availability"
                                value={editForm.data.nectar_source_availability}
                                onChange={(v) =>
                                    editForm.setData(
                                        'nectar_source_availability',
                                        v,
                                    )
                                }
                                options={NECTAR_OPTIONS}
                                error={
                                    editForm.errors.nectar_source_availability
                                }
                            />
                        </div>

                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                            <SelectField
                                label="Structural Damage"
                                value={editForm.data.structural_damage}
                                onChange={(v) =>
                                    editForm.setData('structural_damage', v)
                                }
                                options={DAMAGE_OPTIONS}
                                error={editForm.errors.structural_damage}
                            />
                            <MultiSelectField
                                label="Weather Conditions"
                                value={editWeatherIds}
                                onChange={setEditWeatherIds}
                                options={masterToOptions(weatherConditions)}
                                placeholder="Select..."
                                error={editForm.errors.weather_ids}
                            />
                            <MultiSelectField
                                label="Flora Types"
                                value={editFloraIds}
                                onChange={setEditFloraIds}
                                options={masterToOptions(floraTypes)}
                                placeholder="Select..."
                                error={editForm.errors.flora_ids}
                            />
                        </div>

                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                            <TextareaField
                                label="Food Source Observation"
                                value={editForm.data.food_source_observation}
                                onChange={(e) =>
                                    editForm.setData(
                                        'food_source_observation',
                                        e.target.value,
                                    )
                                }
                                rows={3}
                                error={editForm.errors.food_source_observation}
                            />
                            <TextareaField
                                label="Notes"
                                value={editForm.data.notes}
                                onChange={(e) =>
                                    editForm.setData('notes', e.target.value)
                                }
                                rows={3}
                                error={editForm.errors.notes}
                            />
                        </div>

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
                                type="button"
                                variant="primary"
                                disabled={editForm.processing}
                                onClick={openEditConfirm}
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

            {/* ── Delete Modal ── */}
            {activeModal?.type === 'delete' && (
                <ConfirmModal
                    isOpen
                    onClose={close}
                    onConfirm={confirmDelete}
                    title="Delete Inspection Record"
                    message={<>Delete the inspection record for <span className="font-semibold text-amber-950">{activeModal.inspection.hive?.name}</span> on <span className="font-semibold text-amber-950">{new Date(activeModal.inspection.inspection_date).toLocaleDateString()}</span>? This cannot be undone.</>}
                    confirmLabel={deleting ? 'Deleting...' : 'Delete'}
                    variant="destructive"
                    loading={deleting}
                />
            )}

            {/* ── Confirm Edit Modal ── */}
            {activeModal?.type === 'confirm-edit' && (
                <ConfirmModal
                    isOpen
                    onClose={close}
                    onConfirm={confirmEdit}
                    title="Save Changes"
                    message={<>Save changes to the inspection record for <span className="font-semibold text-amber-950">{activeModal.inspection.hive?.name}</span>?</>}
                    confirmLabel={editForm.processing ? 'Saving...' : 'Save Changes'}
                    loading={editForm.processing}
                    variant="warning"
                />
            )}
        </AuthenticatedLayout>
    );
}
