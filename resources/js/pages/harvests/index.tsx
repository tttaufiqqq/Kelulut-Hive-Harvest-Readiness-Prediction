import { Head, Link, router, useForm, usePage } from '@inertiajs/react';
import { MoreVertical, Plus, Eye, Edit2, Trash2 } from 'lucide-react';
import { DatePickerField } from '@/components/core/date-picker';
import { Breadcrumbs } from '@/components/core/navigation';
import { NumberInput } from '@/components/core/number-input';
import { SelectField } from '@/components/core/select-field';
import { useState } from 'react';
import { Button } from '@/components/core/button';
import { Card } from '@/components/core/card';
import { Dropdown } from '@/components/core/dropdown';
import { Alert } from '@/components/core/feedback';
import { Modal } from '@/components/core/modal';
import { AuthenticatedLayout } from '@/layouts/authenticated-layout';
import { cn } from '@/lib/utils';
import type { Harvest, MasterHoneyColor, MasterHoneyFlavor, PaginatedHarvests } from '@/types';

type Props = {
    harvests: PaginatedHarvests;
    hives: { id: number; name: string }[];
    colors: MasterHoneyColor[];
    flavors: MasterHoneyFlavor[];
};

type ActiveModal =
    | { type: 'create' }
    | { type: 'view'; harvest: Harvest }
    | { type: 'edit'; harvest: Harvest }
    | { type: 'delete'; harvest: Harvest }
    | null;

function ProductivityBadge({ level }: { level: string | null }) {
    if (!level) return <span className="text-amber-900/30">—</span>;

    const styles: Record<string, string> = {
        Low:    'bg-rose-100 text-rose-700',
        Medium: 'bg-amber-100 text-amber-700',
        High:   'bg-emerald-100 text-emerald-700',
    };

    return (
        <span className={cn('inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold', styles[level] ?? 'bg-gray-100 text-gray-500')}>
            {level}
        </span>
    );
}

const PRODUCTIVITY_OPTIONS = [
    { value: '',       label: '— None —' },
    { value: 'Low',    label: 'Low'      },
    { value: 'Medium', label: 'Medium'   },
    { value: 'High',   label: 'High'     },
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

const hiveOptions    = (hives:   { id: number; name: string }[]) => [{ value: '', label: 'Select hive...' },  ...hives.map(h  => ({ value: String(h.id),  label: h.name  }))];
const colorOptions   = (colors:  MasterHoneyColor[])             => [{ value: '', label: '— None —' },         ...colors.map(c => ({ value: String(c.id),  label: c.name  }))];
const flavorOptions  = (flavors: MasterHoneyFlavor[])            => [{ value: '', label: '— None —' },         ...flavors.map(f => ({ value: String(f.id), label: f.name  }))];

export default function HarvestsIndex({ harvests, hives, colors, flavors }: Props) {
    const { props } = usePage<{ flash?: { success?: string; error?: string } }>();
    const flash = props.flash;

    const [activeModal, setActiveModal] = useState<ActiveModal>(null);
    const [deleting, setDeleting] = useState(false);
    const close = () => setActiveModal(null);

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
            harvest_date:       harvest.harvest_date.slice(0, 10),
            weight:             String(harvest.weight),
            productivity_level: harvest.productivity_level ?? '',
            color_id:           harvest.color_id ? String(harvest.color_id) : '',
            flavor_id:          harvest.flavor_id ? String(harvest.flavor_id) : '',
            notes:              harvest.notes ?? '',
        });
        setActiveModal({ type: 'edit', harvest });
    };

    const submitCreate = (e: React.FormEvent) => {
        e.preventDefault();
        createForm.post(route('harvests.store'), {
            onSuccess: () => { createForm.reset(); close(); },
        });
    };

    const submitEdit = (e: React.FormEvent) => {
        e.preventDefault();
        if (activeModal?.type !== 'edit') return;
        editForm.patch(route('harvests.update', { harvest: activeModal.harvest.id }), {
            onSuccess: () => close(),
        });
    };

    const confirmDelete = () => {
        if (activeModal?.type !== 'delete') return;
        setDeleting(true);
        router.delete(route('harvests.destroy', { harvest: activeModal.harvest.id }), {
            onFinish: () => { setDeleting(false); close(); },
        });
    };

    return (
        <AuthenticatedLayout>
            <Head title="Harvests" />
            <div className="p-6 md:p-10 max-w-6xl mx-auto space-y-6">

                {/* Breadcrumb + tab bar */}
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <Breadcrumbs items={[{ label: 'Home', href: '/' }, { label: 'Harvests' }]} />

                    <nav className="flex gap-1 bg-yellow-100/50 rounded-2xl p-1.5">
                        <Link
                            href="/dashboard"
                            className="px-4 py-2 text-sm rounded-xl transition-all whitespace-nowrap text-amber-900/60 hover:bg-yellow-200/50"
                        >
                            My Hives
                        </Link>
                        <Link
                            href="/harvests"
                            className="px-4 py-2 text-sm rounded-xl transition-all whitespace-nowrap bg-white shadow-sm font-semibold text-amber-900"
                        >
                            Harvests
                        </Link>
                    </nav>
                </div>

                {flash?.success && <Alert variant="success">{flash.success}</Alert>}
                {flash?.error && <Alert variant="error">{flash.error}</Alert>}

                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h3 className="text-lg font-bold text-amber-900">Harvest Records</h3>
                        <p className="text-sm text-amber-900/50">{harvests.total} record{harvests.total !== 1 ? 's' : ''} total</p>
                    </div>
                    <Button variant="primary" size="sm" onClick={() => setActiveModal({ type: 'create' })}>
                        <Plus className="w-4 h-4 mr-1" />
                        Add Harvest
                    </Button>
                </div>

                {/* Table */}
                <Card className="overflow-hidden p-0">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="bg-yellow-50/50 border-b border-yellow-100">
                                    <th className="text-left px-6 py-3 text-xs font-bold uppercase tracking-widest text-amber-900/50">Hive</th>
                                    <th className="text-left px-6 py-3 text-xs font-bold uppercase tracking-widest text-amber-900/50">Date</th>
                                    <th className="text-left px-6 py-3 text-xs font-bold uppercase tracking-widest text-amber-900/50">Weight (kg)</th>
                                    <th className="text-left px-6 py-3 text-xs font-bold uppercase tracking-widest text-amber-900/50 hidden md:table-cell">Productivity</th>
                                    <th className="text-left px-6 py-3 text-xs font-bold uppercase tracking-widest text-amber-900/50 hidden lg:table-cell">Color</th>
                                    <th className="text-left px-6 py-3 text-xs font-bold uppercase tracking-widest text-amber-900/50 hidden lg:table-cell">Flavor</th>
                                    <th className="px-6 py-3" />
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-yellow-50">
                                {harvests.data.length === 0 && (
                                    <tr>
                                        <td colSpan={7} className="px-6 py-10 text-center text-amber-900/40 text-sm">
                                            No harvest records yet. Add one to get started.
                                        </td>
                                    </tr>
                                )}
                                {harvests.data.map((harvest) => (
                                    <tr key={harvest.id} className="hover:bg-yellow-50/30 transition-colors">
                                        <td className="px-6 py-4 font-medium text-amber-950">{harvest.hive?.name ?? '—'}</td>
                                        <td className="px-6 py-4 text-amber-900/70">
                                            {new Date(harvest.harvest_date).toLocaleDateString()}
                                        </td>
                                        <td className="px-6 py-4 text-amber-900/70">{harvest.weight} kg</td>
                                        <td className="px-6 py-4 hidden md:table-cell">
                                            <ProductivityBadge level={harvest.productivity_level} />
                                        </td>
                                        <td className="px-6 py-4 text-amber-900/70 hidden lg:table-cell">
                                            {harvest.color?.name ?? '—'}
                                        </td>
                                        <td className="px-6 py-4 text-amber-900/70 hidden lg:table-cell">
                                            {harvest.flavor?.name ?? '—'}
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
                                                        onClick: () => setActiveModal({ type: 'view', harvest }),
                                                    },
                                                    {
                                                        id: 'edit',
                                                        label: 'Edit',
                                                        icon: <Edit2 className="w-4 h-4" />,
                                                        onClick: () => openEdit(harvest),
                                                    },
                                                    {
                                                        id: 'delete',
                                                        label: 'Delete',
                                                        icon: <Trash2 className="w-4 h-4" />,
                                                        variant: 'danger' as const,
                                                        onClick: () => setActiveModal({ type: 'delete', harvest }),
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
                {harvests.last_page > 1 && (
                    <div className="flex items-center justify-center gap-1">
                        {harvests.links.map((link, i) => (
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
            <Modal isOpen={activeModal?.type === 'create'} onClose={close} title="Add Harvest Record" maxWidth="md">
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
                        onChange={(v) => createForm.setData('harvest_date', v ?? '')}
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
                        onChange={(v) => createForm.setData('productivity_level', v)}
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

                    <div className="space-y-1.5">
                        <label className="text-sm font-medium text-amber-900 ml-1">Notes (optional)</label>
                        <textarea
                            value={createForm.data.notes}
                            onChange={(e) => createForm.setData('notes', e.target.value)}
                            placeholder="Any observations about this harvest..."
                            rows={3}
                            className={cn(
                                'w-full px-4 py-2.5 bg-yellow-50/50 border border-yellow-200 rounded-2xl text-sm',
                                'text-amber-950 placeholder:text-amber-900/30 focus:outline-none focus:ring-2 focus:ring-yellow-400/50 resize-none',
                                createForm.errors.notes && 'border-red-400 focus:ring-red-400/50',
                            )}
                        />
                        {createForm.errors.notes && <p className="text-xs text-red-500 ml-1">{createForm.errors.notes}</p>}
                    </div>

                    <div className="flex gap-3 pt-2">
                        <Button type="button" variant="ghost" onClick={close} className="flex-1">Cancel</Button>
                        <Button type="submit" variant="primary" disabled={createForm.processing} className="flex-1">
                            {createForm.processing ? 'Saving...' : 'Save Harvest'}
                        </Button>
                    </div>
                </form>
            </Modal>

            {/* ── View Modal ── */}
            {activeModal?.type === 'view' && (
                <Modal isOpen onClose={close} title="Harvest Details" maxWidth="md">
                    <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <p className="text-xs font-bold uppercase tracking-widest text-amber-900/40 mb-1">Hive</p>
                                <p className="font-medium text-amber-950">{activeModal.harvest.hive?.name ?? '—'}</p>
                            </div>
                            <div>
                                <p className="text-xs font-bold uppercase tracking-widest text-amber-900/40 mb-1">Date</p>
                                <p className="font-medium text-amber-950">
                                    {new Date(activeModal.harvest.harvest_date).toLocaleDateString()}
                                </p>
                            </div>
                            <div>
                                <p className="text-xs font-bold uppercase tracking-widest text-amber-900/40 mb-1">Weight</p>
                                <p className="font-medium text-amber-950">{activeModal.harvest.weight} kg</p>
                            </div>
                            <div>
                                <p className="text-xs font-bold uppercase tracking-widest text-amber-900/40 mb-1">Productivity</p>
                                <ProductivityBadge level={activeModal.harvest.productivity_level} />
                            </div>
                            <div>
                                <p className="text-xs font-bold uppercase tracking-widest text-amber-900/40 mb-1">Color</p>
                                <p className="font-medium text-amber-950">{activeModal.harvest.color?.name ?? '—'}</p>
                            </div>
                            <div>
                                <p className="text-xs font-bold uppercase tracking-widest text-amber-900/40 mb-1">Flavor</p>
                                <p className="font-medium text-amber-950">{activeModal.harvest.flavor?.name ?? '—'}</p>
                            </div>
                        </div>
                        {activeModal.harvest.notes && (
                            <div>
                                <p className="text-xs font-bold uppercase tracking-widest text-amber-900/40 mb-1">Notes</p>
                                <p className="text-sm text-amber-900/70 whitespace-pre-wrap">{activeModal.harvest.notes}</p>
                            </div>
                        )}
                        <div className="flex gap-3 pt-2">
                            <Button type="button" variant="ghost" onClick={close} className="flex-1">Close</Button>
                            <Button type="button" variant="outline" onClick={() => openEdit(activeModal.harvest)} className="flex-1">Edit</Button>
                        </div>
                    </div>
                </Modal>
            )}

            {/* ── Edit Modal ── */}
            {activeModal?.type === 'edit' && (
                <Modal isOpen onClose={close} title="Edit Harvest Record" maxWidth="md">
                    <form onSubmit={submitEdit} className="space-y-4">
                        <div className="space-y-1.5">
                            <label className="text-sm font-medium text-amber-900 ml-1">Hive</label>
                            <p className="px-4 py-2.5 bg-yellow-50/30 border border-yellow-100 rounded-2xl text-amber-950/60 text-sm">
                                {activeModal.harvest.hive?.name}
                            </p>
                        </div>

                        <DatePickerField
                            label="Harvest Date"
                            value={editForm.data.harvest_date || null}
                            onChange={(v) => editForm.setData('harvest_date', v ?? '')}
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
                            onChange={(v) => editForm.setData('productivity_level', v)}
                            options={PRODUCTIVITY_OPTIONS}
                            error={editForm.errors.productivity_level}
                        />

                        <div className="grid grid-cols-2 gap-4">
                            <SelectField
                                label="Honey Color (optional)"
                                value={editForm.data.color_id}
                                onChange={(v) => editForm.setData('color_id', v)}
                                options={colorOptions(colors)}
                                error={editForm.errors.color_id}
                            />
                            <SelectField
                                label="Honey Flavor (optional)"
                                value={editForm.data.flavor_id}
                                onChange={(v) => editForm.setData('flavor_id', v)}
                                options={flavorOptions(flavors)}
                                error={editForm.errors.flavor_id}
                            />
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-sm font-medium text-amber-900 ml-1">Notes (optional)</label>
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

                        <div className="flex gap-3 pt-2">
                            <Button type="button" variant="ghost" onClick={close} className="flex-1">Cancel</Button>
                            <Button type="submit" variant="primary" disabled={editForm.processing} className="flex-1">
                                {editForm.processing ? 'Saving...' : 'Save Changes'}
                            </Button>
                        </div>
                    </form>
                </Modal>
            )}

            {/* ── Delete Confirmation Modal ── */}
            {activeModal?.type === 'delete' && (
                <Modal isOpen onClose={close} title="Delete Harvest Record" maxWidth="sm">
                    <div className="space-y-4">
                        <p className="text-sm text-amber-900/70">
                            Delete the harvest record for{' '}
                            <span className="font-semibold text-amber-950">{activeModal.harvest.hive?.name}</span>{' '}
                            on{' '}
                            <span className="font-semibold text-amber-950">
                                {new Date(activeModal.harvest.harvest_date).toLocaleDateString()}
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
