import { Head, Link, router, useForm, usePage } from '@inertiajs/react';
import { MoreVertical, Plus, Eye, Edit2, Trash2 } from 'lucide-react';
import { DatePickerField } from '@/components/core/date-picker';
import { BeekeeperTabs } from '@/components/core/beekeeper-tabs';
import { Breadcrumbs } from '@/components/core/navigation';
import { MultiSelectField } from '@/components/core/multi-select-field';
import { SelectField } from '@/components/core/select-field';
import { useState } from 'react';
import { Button } from '@/components/core/button';
import { Card } from '@/components/core/card';
import { Dropdown } from '@/components/core/dropdown';
import { Alert } from '@/components/core/feedback';
import { Modal } from '@/components/core/modal';
import { AuthenticatedLayout } from '@/layouts/authenticated-layout';
import { cn } from '@/lib/utils';
import type {
    Inspection, MasterWeatherCondition, MasterFloraType, PaginatedInspections,
} from '@/types';

type Props = {
    inspections:       PaginatedInspections;
    hives:             { id: number; name: string }[];
    weatherConditions: MasterWeatherCondition[];
    floraTypes:        MasterFloraType[];
    filters:           { hive_id?: string };
};

type ActiveModal =
    | { type: 'create' }
    | { type: 'view';   inspection: Inspection }
    | { type: 'edit';   inspection: Inspection }
    | { type: 'delete'; inspection: Inspection }
    | null;

const BLOOMING_OPTIONS = [
    { value: 'pre_bloom',   label: 'Pre-Bloom'   },
    { value: 'early_bloom', label: 'Early Bloom' },
    { value: 'peak_bloom',  label: 'Peak Bloom'  },
    { value: 'post_bloom',  label: 'Post-Bloom'  },
    { value: 'dormant',     label: 'Dormant'     },
];

const VEGETATION_OPTIONS = [
    { value: 'sparse',   label: 'Sparse'   },
    { value: 'moderate', label: 'Moderate' },
    { value: 'dense',    label: 'Dense'    },
];

const NECTAR_OPTIONS = [
    { value: 'scarce',   label: 'Scarce'   },
    { value: 'moderate', label: 'Moderate' },
    { value: 'abundant', label: 'Abundant' },
];

const DAMAGE_OPTIONS = [
    { value: 'none',     label: 'None'     },
    { value: 'minor',    label: 'Minor'    },
    { value: 'moderate', label: 'Moderate' },
    { value: 'severe',   label: 'Severe'   },
];

const BLOOMING_STYLES: Record<string, string> = {
    pre_bloom:   'bg-sky-100 text-sky-700',
    early_bloom: 'bg-lime-100 text-lime-700',
    peak_bloom:  'bg-emerald-100 text-emerald-700',
    post_bloom:  'bg-amber-100 text-amber-700',
    dormant:     'bg-gray-100 text-gray-500',
};

const BLOOMING_LABELS: Record<string, string> = {
    pre_bloom:   'Pre-Bloom',
    early_bloom: 'Early Bloom',
    peak_bloom:  'Peak Bloom',
    post_bloom:  'Post-Bloom',
    dormant:     'Dormant',
};

function BloomingBadge({ status }: { status: string | null }) {
    if (!status) return <span className="text-amber-900/30">—</span>;
    return (
        <span className={cn('inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold', BLOOMING_STYLES[status] ?? 'bg-gray-100 text-gray-500')}>
            {BLOOMING_LABELS[status] ?? status}
        </span>
    );
}

function WeatherPills({ conditions }: { conditions?: MasterWeatherCondition[] }) {
    if (!conditions?.length) return <span className="text-amber-900/30">—</span>;
    return (
        <div className="flex flex-wrap gap-1">
            {conditions.map(c => (
                <span key={c.id} className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                    {c.name}
                </span>
            ))}
        </div>
    );
}

const hiveOptions = (hives: { id: number; name: string }[]) => [
    { value: '', label: 'All Hives' },
    ...hives.map(h => ({ value: String(h.id), label: h.name })),
];

const hiveFormOptions = (hives: { id: number; name: string }[]) => [
    { value: '', label: 'Select hive...' },
    ...hives.map(h => ({ value: String(h.id), label: h.name })),
];

const toMultiIds = (items?: { id: number }[]) => items?.map(i => i.id) ?? [];

const emptyCreate = {
    hive_id:                    '',
    inspection_date:            '',
    blooming_status:            '',
    vegetation_density:         '',
    nectar_source_availability: '',
    structural_damage:          '',
    food_source_observation:    '',
    notes:                      '',
};

export default function InspectionsIndex({ inspections, hives, weatherConditions, floraTypes, filters }: Props) {
    const { props } = usePage<{ flash?: { success?: string; error?: string } }>();
    const flash = props.flash;

    const [activeModal, setActiveModal] = useState<ActiveModal>(null);
    const [deleting, setDeleting]       = useState(false);
    const close = () => setActiveModal(null);

    // Multi-select state lives outside useForm (arrays don't integrate cleanly)
    const [createWeatherIds, setCreateWeatherIds] = useState<number[]>([]);
    const [createFloraIds,   setCreateFloraIds]   = useState<number[]>([]);
    const [editWeatherIds,   setEditWeatherIds]   = useState<number[]>([]);
    const [editFloraIds,     setEditFloraIds]     = useState<number[]>([]);

    const createForm = useForm({ ...emptyCreate });
    const editForm   = useForm({
        inspection_date:            '',
        blooming_status:            '',
        vegetation_density:         '',
        nectar_source_availability: '',
        structural_damage:          '',
        food_source_observation:    '',
        notes:                      '',
    });

    const openEdit = (inspection: Inspection) => {
        editForm.setData({
            inspection_date:            inspection.inspection_date.slice(0, 10),
            blooming_status:            inspection.blooming_status ?? '',
            vegetation_density:         inspection.vegetation_density ?? '',
            nectar_source_availability: inspection.nectar_source_availability ?? '',
            structural_damage:          inspection.structural_damage ?? '',
            food_source_observation:    inspection.food_source_observation ?? '',
            notes:                      inspection.notes ?? '',
        });
        setEditWeatherIds(toMultiIds(inspection.weather_conditions));
        setEditFloraIds(toMultiIds(inspection.flora_types));
        setActiveModal({ type: 'edit', inspection });
    };

    const submitCreate = (e: React.FormEvent) => {
        e.preventDefault();
        createForm.transform(data => ({
            ...data,
            weather_ids: createWeatherIds,
            flora_ids:   createFloraIds,
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

    const submitEdit = (e: React.FormEvent) => {
        e.preventDefault();
        if (activeModal?.type !== 'edit') return;
        editForm.transform(data => ({
            ...data,
            weather_ids: editWeatherIds,
            flora_ids:   editFloraIds,
        }));
        editForm.patch(route('inspections.update', { inspection: activeModal.inspection.id }), {
            onSuccess: () => close(),
        });
    };

    const confirmDelete = () => {
        if (activeModal?.type !== 'delete') return;
        setDeleting(true);
        router.delete(route('inspections.destroy', { inspection: activeModal.inspection.id }), {
            onFinish: () => { setDeleting(false); close(); },
        });
    };

    const onHiveFilter = (val: string) => {
        router.get(route('inspections.index'), val ? { hive_id: val } : {}, { preserveState: true, replace: true });
    };

    const masterToOptions = (items: { id: number; name: string }[]) =>
        items.map(i => ({ value: i.id, label: i.name }));

    return (
        <AuthenticatedLayout>
            <Head title="Inspections" />
            <div className="p-6 md:p-10 max-w-6xl mx-auto space-y-6">

                {/* Breadcrumb + tab bar */}
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <Breadcrumbs items={[{ label: 'Home', href: '/' }, { label: 'Inspections' }]} />

                    <BeekeeperTabs active="inspections" />
                </div>

                {flash?.success && <Alert variant="success">{flash.success}</Alert>}
                {flash?.error   && <Alert variant="error">{flash.error}</Alert>}

                {/* Header + filter */}
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h3 className="text-lg font-bold text-amber-900">Inspection Records</h3>
                        <p className="text-sm text-amber-900/50">{inspections.total} record{inspections.total !== 1 ? 's' : ''} total</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="w-48">
                            <SelectField
                                value={filters.hive_id ?? ''}
                                onChange={onHiveFilter}
                                options={hiveOptions(hives)}
                            />
                        </div>
                        <Button variant="primary" size="sm" onClick={() => setActiveModal({ type: 'create' })}>
                            <Plus className="w-4 h-4 mr-1" />
                            Add Inspection
                        </Button>
                    </div>
                </div>

                {/* Table */}
                <Card className="overflow-hidden p-0">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="bg-yellow-50/50 border-b border-yellow-100">
                                    <th className="text-left px-6 py-3 text-xs font-bold uppercase tracking-widest text-amber-900/50">Hive</th>
                                    <th className="text-left px-6 py-3 text-xs font-bold uppercase tracking-widest text-amber-900/50">Date</th>
                                    <th className="text-left px-6 py-3 text-xs font-bold uppercase tracking-widest text-amber-900/50 hidden md:table-cell">Blooming</th>
                                    <th className="text-left px-6 py-3 text-xs font-bold uppercase tracking-widest text-amber-900/50 hidden lg:table-cell">Weather</th>
                                    <th className="px-6 py-3" />
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-yellow-50">
                                {inspections.data.length === 0 && (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-10 text-center text-amber-900/40 text-sm">
                                            No inspection records yet. Add one to get started.
                                        </td>
                                    </tr>
                                )}
                                {inspections.data.map((inspection) => (
                                    <tr key={inspection.id} className="hover:bg-yellow-50/30 transition-colors">
                                        <td className="px-6 py-4 font-medium text-amber-950">{inspection.hive?.name ?? '—'}</td>
                                        <td className="px-6 py-4 text-amber-900/70">
                                            {new Date(inspection.inspection_date).toLocaleDateString()}
                                        </td>
                                        <td className="px-6 py-4 hidden md:table-cell">
                                            <BloomingBadge status={inspection.blooming_status} />
                                        </td>
                                        <td className="px-6 py-4 hidden lg:table-cell">
                                            <WeatherPills conditions={inspection.weather_conditions} />
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
                                                        id: 'view',
                                                        label: 'View Details',
                                                        icon: <Eye className="w-4 h-4" />,
                                                        onClick: () => setActiveModal({ type: 'view', inspection }),
                                                    },
                                                    {
                                                        id: 'edit',
                                                        label: 'Edit',
                                                        icon: <Edit2 className="w-4 h-4" />,
                                                        onClick: () => openEdit(inspection),
                                                    },
                                                    {
                                                        id: 'delete',
                                                        label: 'Delete',
                                                        icon: <Trash2 className="w-4 h-4" />,
                                                        variant: 'danger' as const,
                                                        onClick: () => setActiveModal({ type: 'delete', inspection }),
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

                {/* Pagination */}
                {inspections.last_page > 1 && (
                    <div className="flex items-center justify-center gap-1">
                        {inspections.links.map((link, i) => (
                            link.url ? (
                                <Link
                                    key={i}
                                    href={link.url}
                                    className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                                        link.active
                                            ? 'bg-amber-500 text-white font-semibold'
                                            : 'text-amber-900/70 hover:bg-yellow-100'
                                    }`}
                                    dangerouslySetInnerHTML={{ __html: link.label }}
                                />
                            ) : (
                                <span
                                    key={i}
                                    className="px-3 py-1.5 text-sm text-amber-900/30"
                                    dangerouslySetInnerHTML={{ __html: link.label }}
                                />
                            )
                        ))}
                    </div>
                )}
            </div>

            {/* ── Create Modal ── */}
            <Modal isOpen={activeModal?.type === 'create'} onClose={close} title="Add Inspection Record" maxWidth="2xl">
                <form onSubmit={submitCreate} className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                            onChange={(v) => createForm.setData('inspection_date', v ?? '')}
                            maxDate="today"
                            error={createForm.errors.inspection_date}
                        />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <SelectField
                            label="Blooming Status"
                            value={createForm.data.blooming_status}
                            onChange={(v) => createForm.setData('blooming_status', v)}
                            options={BLOOMING_OPTIONS}
                            error={createForm.errors.blooming_status}
                        />
                        <SelectField
                            label="Vegetation Density"
                            value={createForm.data.vegetation_density}
                            onChange={(v) => createForm.setData('vegetation_density', v)}
                            options={VEGETATION_OPTIONS}
                            error={createForm.errors.vegetation_density}
                        />
                        <SelectField
                            label="Nectar Availability"
                            value={createForm.data.nectar_source_availability}
                            onChange={(v) => createForm.setData('nectar_source_availability', v)}
                            options={NECTAR_OPTIONS}
                            error={createForm.errors.nectar_source_availability}
                        />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <SelectField
                            label="Structural Damage"
                            value={createForm.data.structural_damage}
                            onChange={(v) => createForm.setData('structural_damage', v)}
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

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <label className="text-sm font-medium text-amber-900 ml-1">Food Source Observation</label>
                            <textarea
                                value={createForm.data.food_source_observation}
                                onChange={(e) => createForm.setData('food_source_observation', e.target.value)}
                                placeholder="Describe food source observations..."
                                rows={3}
                                className={cn(
                                    'w-full px-4 py-2.5 bg-yellow-50/50 border border-yellow-200 rounded-2xl text-sm',
                                    'text-amber-950 placeholder:text-amber-900/30 focus:outline-none focus:ring-2 focus:ring-yellow-400/50 resize-none',
                                    createForm.errors.food_source_observation && 'border-red-400 focus:ring-red-400/50',
                                )}
                            />
                            {createForm.errors.food_source_observation && <p className="text-xs text-red-500 ml-1">{createForm.errors.food_source_observation}</p>}
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-sm font-medium text-amber-900 ml-1">Notes</label>
                            <textarea
                                value={createForm.data.notes}
                                onChange={(e) => createForm.setData('notes', e.target.value)}
                                placeholder="Any additional observations..."
                                rows={3}
                                className={cn(
                                    'w-full px-4 py-2.5 bg-yellow-50/50 border border-yellow-200 rounded-2xl text-sm',
                                    'text-amber-950 placeholder:text-amber-900/30 focus:outline-none focus:ring-2 focus:ring-yellow-400/50 resize-none',
                                    createForm.errors.notes && 'border-red-400 focus:ring-red-400/50',
                                )}
                            />
                            {createForm.errors.notes && <p className="text-xs text-red-500 ml-1">{createForm.errors.notes}</p>}
                        </div>
                    </div>

                    <div className="flex gap-3 pt-2">
                        <Button type="button" variant="ghost" onClick={close} className="flex-1">Cancel</Button>
                        <Button type="submit" variant="primary" disabled={createForm.processing} className="flex-1">
                            {createForm.processing ? 'Saving...' : 'Save Inspection'}
                        </Button>
                    </div>
                </form>
            </Modal>

            {/* ── View Modal ── */}
            {activeModal?.type === 'view' && (
                <Modal isOpen onClose={close} title="Inspection Details" maxWidth="md">
                    <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <p className="text-xs font-bold uppercase tracking-widest text-amber-900/40 mb-1">Hive</p>
                                <p className="font-medium text-amber-950">{activeModal.inspection.hive?.name ?? '—'}</p>
                            </div>
                            <div>
                                <p className="text-xs font-bold uppercase tracking-widest text-amber-900/40 mb-1">Date</p>
                                <p className="font-medium text-amber-950">
                                    {new Date(activeModal.inspection.inspection_date).toLocaleDateString()}
                                </p>
                            </div>
                            <div>
                                <p className="text-xs font-bold uppercase tracking-widest text-amber-900/40 mb-1">Blooming Status</p>
                                <BloomingBadge status={activeModal.inspection.blooming_status} />
                            </div>
                            <div>
                                <p className="text-xs font-bold uppercase tracking-widest text-amber-900/40 mb-1">Structural Damage</p>
                                <p className="font-medium text-amber-950 capitalize">{activeModal.inspection.structural_damage ?? '—'}</p>
                            </div>
                            <div>
                                <p className="text-xs font-bold uppercase tracking-widest text-amber-900/40 mb-1">Vegetation Density</p>
                                <p className="font-medium text-amber-950 capitalize">{activeModal.inspection.vegetation_density ?? '—'}</p>
                            </div>
                            <div>
                                <p className="text-xs font-bold uppercase tracking-widest text-amber-900/40 mb-1">Nectar Availability</p>
                                <p className="font-medium text-amber-950 capitalize">{activeModal.inspection.nectar_source_availability ?? '—'}</p>
                            </div>
                        </div>
                        <div>
                            <p className="text-xs font-bold uppercase tracking-widest text-amber-900/40 mb-1">Weather Conditions</p>
                            <WeatherPills conditions={activeModal.inspection.weather_conditions} />
                        </div>
                        {activeModal.inspection.flora_types && activeModal.inspection.flora_types.length > 0 && (
                            <div>
                                <p className="text-xs font-bold uppercase tracking-widest text-amber-900/40 mb-1">Flora Types</p>
                                <div className="flex flex-wrap gap-1">
                                    {activeModal.inspection.flora_types.map(f => (
                                        <span key={f.id} className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700">
                                            {f.name}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}
                        {activeModal.inspection.food_source_observation && (
                            <div>
                                <p className="text-xs font-bold uppercase tracking-widest text-amber-900/40 mb-1">Food Source Observation</p>
                                <p className="text-sm text-amber-900/70 whitespace-pre-wrap">{activeModal.inspection.food_source_observation}</p>
                            </div>
                        )}
                        {activeModal.inspection.notes && (
                            <div>
                                <p className="text-xs font-bold uppercase tracking-widest text-amber-900/40 mb-1">Notes</p>
                                <p className="text-sm text-amber-900/70 whitespace-pre-wrap">{activeModal.inspection.notes}</p>
                            </div>
                        )}
                        <div className="flex gap-3 pt-2">
                            <Button type="button" variant="ghost" onClick={close} className="flex-1">Close</Button>
                            <Button type="button" variant="outline" onClick={() => openEdit(activeModal.inspection)} className="flex-1">Edit</Button>
                        </div>
                    </div>
                </Modal>
            )}

            {/* ── Edit Modal ── */}
            {activeModal?.type === 'edit' && (
                <Modal isOpen onClose={close} title="Edit Inspection Record" maxWidth="2xl">
                    <form onSubmit={submitEdit} className="space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <label className="text-sm font-medium text-amber-900 ml-1">Hive</label>
                                <p className="px-4 py-2.5 bg-yellow-50/30 border border-yellow-100 rounded-2xl text-amber-950/60 text-sm">
                                    {activeModal.inspection.hive?.name}
                                </p>
                            </div>
                            <DatePickerField
                                label="Inspection Date"
                                value={editForm.data.inspection_date || null}
                                onChange={(v) => editForm.setData('inspection_date', v ?? '')}
                                maxDate="today"
                                error={editForm.errors.inspection_date}
                            />
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <SelectField
                                label="Blooming Status"
                                value={editForm.data.blooming_status}
                                onChange={(v) => editForm.setData('blooming_status', v)}
                                options={BLOOMING_OPTIONS}
                                error={editForm.errors.blooming_status}
                            />
                            <SelectField
                                label="Vegetation Density"
                                value={editForm.data.vegetation_density}
                                onChange={(v) => editForm.setData('vegetation_density', v)}
                                options={VEGETATION_OPTIONS}
                                error={editForm.errors.vegetation_density}
                            />
                            <SelectField
                                label="Nectar Availability"
                                value={editForm.data.nectar_source_availability}
                                onChange={(v) => editForm.setData('nectar_source_availability', v)}
                                options={NECTAR_OPTIONS}
                                error={editForm.errors.nectar_source_availability}
                            />
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <SelectField
                                label="Structural Damage"
                                value={editForm.data.structural_damage}
                                onChange={(v) => editForm.setData('structural_damage', v)}
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

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <label className="text-sm font-medium text-amber-900 ml-1">Food Source Observation</label>
                                <textarea
                                    value={editForm.data.food_source_observation}
                                    onChange={(e) => editForm.setData('food_source_observation', e.target.value)}
                                    rows={3}
                                    className={cn(
                                        'w-full px-4 py-2.5 bg-yellow-50/50 border border-yellow-200 rounded-2xl text-sm',
                                        'text-amber-950 placeholder:text-amber-900/30 focus:outline-none focus:ring-2 focus:ring-yellow-400/50 resize-none',
                                        editForm.errors.food_source_observation && 'border-red-400 focus:ring-red-400/50',
                                    )}
                                />
                                {editForm.errors.food_source_observation && <p className="text-xs text-red-500 ml-1">{editForm.errors.food_source_observation}</p>}
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-sm font-medium text-amber-900 ml-1">Notes</label>
                                <textarea
                                    value={editForm.data.notes}
                                    onChange={(e) => editForm.setData('notes', e.target.value)}
                                    rows={3}
                                    className={cn(
                                        'w-full px-4 py-2.5 bg-yellow-50/50 border border-yellow-200 rounded-2xl text-sm',
                                        'text-amber-950 placeholder:text-amber-900/30 focus:outline-none focus:ring-2 focus:ring-yellow-400/50 resize-none',
                                        editForm.errors.notes && 'border-red-400 focus:ring-red-400/50',
                                    )}
                                />
                                {editForm.errors.notes && <p className="text-xs text-red-500 ml-1">{editForm.errors.notes}</p>}
                            </div>
                        </div>

                        <div className="flex gap-3 pt-2">
                            <Button type="button" variant="ghost" onClick={close} className="flex-1">Cancel</Button>
                            <Button type="submit" variant="primary" disabled={editForm.processing} className="flex-1">
                                {editForm.processing ? 'Saving...' : 'Save Changes'}
                            </Button>
                        </div>
                    </form>
                </Modal>
            )}

            {/* ── Delete Modal ── */}
            {activeModal?.type === 'delete' && (
                <Modal isOpen onClose={close} title="Delete Inspection Record" maxWidth="sm">
                    <div className="space-y-4">
                        <p className="text-sm text-amber-900/70">
                            Delete the inspection record for{' '}
                            <span className="font-semibold text-amber-950">{activeModal.inspection.hive?.name}</span>{' '}
                            on{' '}
                            <span className="font-semibold text-amber-950">
                                {new Date(activeModal.inspection.inspection_date).toLocaleDateString()}
                            </span>
                            ? This cannot be undone.
                        </p>
                        <div className="flex gap-3">
                            <Button type="button" variant="ghost" onClick={close} disabled={deleting} className="flex-1">Cancel</Button>
                            <Button type="button" variant="destructive" onClick={confirmDelete} disabled={deleting} className="flex-1">
                                {deleting ? 'Deleting...' : 'Delete'}
                            </Button>
                        </div>
                    </div>
                </Modal>
            )}
        </AuthenticatedLayout>
    );
}
