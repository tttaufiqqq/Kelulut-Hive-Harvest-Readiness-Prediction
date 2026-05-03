import { Head, router, useForm, usePage } from '@inertiajs/react';
import { MoreVertical, Plus, Edit2, Trash2, Power } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/core/button';
import { Card } from '@/components/core/card';
import { Dropdown } from '@/components/core/dropdown';
import { Alert } from '@/components/core/feedback';
import { Input } from '@/components/core/input';
import { Modal } from '@/components/core/modal';
import { SelectField } from '@/components/core/select-field';
import { AdminLayout } from '@/layouts/admin-layout';

type HiveRow = {
    id: number;
    name: string;
    beekeeper_id: number;
    beekeeper_name: string | null;
    species: string | null;
    species_id: number | null;
    site: string | null;
    site_id: number | null;
    status: 'active' | 'inactive';
    age_months: number;
    image_path: string | null;
};

type MasterItem = { id: number; name: string };

type PageProps = {
    hives: HiveRow[];
    beekeepers: MasterItem[];
    species_list: MasterItem[];
    sites_list: MasterItem[];
    stats: { total: number; active: number; inactive: number };
};

type ActiveModal =
    | { type: 'create' }
    | { type: 'view'; hive: HiveRow }
    | { type: 'edit'; hive: HiveRow }
    | { type: 'delete'; hive: HiveRow }
    | { type: 'toggle'; hive: HiveRow }
    | null;

type HiveFormData = {
    name: string;
    beekeeper_id: string;
    species_id: string;
    site_id: string;
    status: string;
    image: File | null;
};

function StatusBadge({ status }: { status: 'active' | 'inactive' }) {
    return status === 'active' ? (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-700">Active</span>
    ) : (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-100 text-rose-600">Inactive</span>
    );
}

export default function HivesIndex({ hives, beekeepers, species_list, sites_list, stats }: PageProps) {
    const { props } = usePage<{ flash?: { success?: string; error?: string } }>();
    const flash = props.flash;

    const [activeModal, setActiveModal] = useState<ActiveModal>(null);
    const [deleting, setDeleting]       = useState(false);
    const close = () => setActiveModal(null);

    const beekeeperOptions = beekeepers.map(b => ({ value: String(b.id), label: b.name }));
    const speciesOptions   = [{ value: '', label: '— None —' }, ...species_list.map(s => ({ value: String(s.id), label: s.name }))];
    const siteOptions      = [{ value: '', label: '— None —' }, ...sites_list.map(s => ({ value: String(s.id), label: s.name }))];
    const statusOptions    = [{ value: 'active', label: 'Active' }, { value: 'inactive', label: 'Inactive' }];

    const createForm = useForm<HiveFormData>({ name: '', beekeeper_id: '', species_id: '', site_id: '', status: 'active', image: null });
    const editForm   = useForm<HiveFormData>({ name: '', beekeeper_id: '', species_id: '', site_id: '', status: 'active', image: null });

    const openEdit = (hive: HiveRow) => {
        editForm.setData({
            name:         hive.name,
            beekeeper_id: String(hive.beekeeper_id),
            species_id:   hive.species_id ? String(hive.species_id) : '',
            site_id:      hive.site_id    ? String(hive.site_id)    : '',
            status:       hive.status,
            image:        null,
        });
        setActiveModal({ type: 'edit', hive });
    };

    const submitCreate = (e: React.FormEvent) => {
        e.preventDefault();
        createForm.post(route('admin.hives.store'), {
            forceFormData: true,
            onSuccess: () => { createForm.reset(); close(); },
        });
    };

    const submitEdit = (e: React.FormEvent) => {
        e.preventDefault();
        if (activeModal?.type !== 'edit') return;
        editForm.transform(data => ({ ...data, _method: 'patch' }));
        editForm.post(route('admin.hives.update', { hive: activeModal.hive.id }), {
            forceFormData: true,
            onSuccess: () => close(),
        });
    };

    const confirmToggle = () => {
        if (activeModal?.type !== 'toggle') return;
        router.patch(route('admin.hives.toggle-status', { hive: activeModal.hive.id }), {}, { onSuccess: () => close() });
    };

    const confirmDelete = () => {
        if (activeModal?.type !== 'delete') return;
        setDeleting(true);
        router.delete(route('admin.hives.destroy', { hive: activeModal.hive.id }), {
            onFinish: () => { setDeleting(false); close(); },
        });
    };

    return (
        <AdminLayout>
            <Head title="Hive Management — Admin" />

            <div className="space-y-6">
                {flash?.success && <Alert variant="success">{flash.success}</Alert>}
                {flash?.error   && <Alert variant="error">{flash.error}</Alert>}

                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h3 className="text-lg font-bold text-amber-900">Hive Management</h3>
                        <p className="text-sm text-amber-900/50">{stats.total} total · {stats.active} active · {stats.inactive} inactive</p>
                    </div>
                    <Button variant="primary" size="sm" onClick={() => setActiveModal({ type: 'create' })}>
                        <Plus className="w-4 h-4 mr-1" />
                        Register Hive
                    </Button>
                </div>

                {/* Table */}
                <Card className="overflow-hidden p-0">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="bg-yellow-50/50 border-b border-yellow-100">
                                    <th className="text-left px-6 py-3 text-xs font-bold uppercase tracking-widest text-amber-900/50">Name</th>
                                    <th className="text-left px-6 py-3 text-xs font-bold uppercase tracking-widest text-amber-900/50">Beekeeper</th>
                                    <th className="text-left px-6 py-3 text-xs font-bold uppercase tracking-widest text-amber-900/50 hidden md:table-cell">Site</th>
                                    <th className="text-left px-6 py-3 text-xs font-bold uppercase tracking-widest text-amber-900/50 hidden md:table-cell">Species</th>
                                    <th className="text-left px-6 py-3 text-xs font-bold uppercase tracking-widest text-amber-900/50">Status</th>
                                    <th className="text-left px-6 py-3 text-xs font-bold uppercase tracking-widest text-amber-900/50 hidden lg:table-cell">Age</th>
                                    <th className="px-6 py-3" />
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-yellow-50">
                                {hives.length === 0 && (
                                    <tr>
                                        <td colSpan={7} className="px-6 py-10 text-center text-amber-900/40 text-sm">
                                            No hives registered yet.
                                        </td>
                                    </tr>
                                )}
                                {hives.map((hive) => (
                                    <tr key={hive.id} className="hover:bg-yellow-50/30 transition-colors cursor-pointer" onClick={() => setActiveModal({ type: 'view', hive })}>
                                        <td className="px-6 py-4 font-medium text-amber-950">{hive.name}</td>
                                        <td className="px-6 py-4 text-amber-900/70">{hive.beekeeper_name ?? '—'}</td>
                                        <td className="px-6 py-4 text-amber-900/70 hidden md:table-cell">{hive.site ?? '—'}</td>
                                        <td className="px-6 py-4 text-amber-900/70 hidden md:table-cell">{hive.species ?? '—'}</td>
                                        <td className="px-6 py-4"><StatusBadge status={hive.status} /></td>
                                        <td className="px-6 py-4 text-amber-900/50 hidden lg:table-cell">{hive.age_months}m</td>
                                        <td className="px-6 py-4 text-right" onClick={e => e.stopPropagation()}>
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
                                                        onClick: () => openEdit(hive),
                                                    },
                                                    {
                                                        id: 'toggle',
                                                        label: hive.status === 'active' ? 'Set Inactive' : 'Set Active',
                                                        icon: <Power className="w-4 h-4" />,
                                                        variant: hive.status === 'active' ? 'danger' as const : 'default' as const,
                                                        onClick: () => setActiveModal({ type: 'toggle', hive }),
                                                    },
                                                    {
                                                        id: 'delete',
                                                        label: 'Delete',
                                                        icon: <Trash2 className="w-4 h-4" />,
                                                        variant: 'danger' as const,
                                                        onClick: () => setActiveModal({ type: 'delete', hive }),
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
            {activeModal?.type === 'view' && (
                <Modal isOpen onClose={close} title="Hive Details" maxWidth="md">
                    <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <p className="text-xs font-bold uppercase tracking-widest text-amber-900/40 mb-1">Name</p>
                                <p className="font-medium text-amber-950">{activeModal.hive.name}</p>
                            </div>
                            <div>
                                <p className="text-xs font-bold uppercase tracking-widest text-amber-900/40 mb-1">Status</p>
                                <StatusBadge status={activeModal.hive.status} />
                            </div>
                            <div>
                                <p className="text-xs font-bold uppercase tracking-widest text-amber-900/40 mb-1">Beekeeper</p>
                                <p className="font-medium text-amber-950">{activeModal.hive.beekeeper_name ?? '—'}</p>
                            </div>
                            <div>
                                <p className="text-xs font-bold uppercase tracking-widest text-amber-900/40 mb-1">Species</p>
                                <p className="font-medium text-amber-950 italic">{activeModal.hive.species ?? '—'}</p>
                            </div>
                            <div>
                                <p className="text-xs font-bold uppercase tracking-widest text-amber-900/40 mb-1">Site</p>
                                <p className="font-medium text-amber-950">{activeModal.hive.site ?? '—'}</p>
                            </div>
                            <div>
                                <p className="text-xs font-bold uppercase tracking-widest text-amber-900/40 mb-1">Age</p>
                                <p className="font-medium text-amber-950">{activeModal.hive.age_months}m</p>
                            </div>
                        </div>
                        <div className="flex gap-3 pt-2">
                            <Button type="button" variant="ghost" onClick={close} className="flex-1">Close</Button>
                            <Button type="button" variant="outline" onClick={() => { close(); openEdit(activeModal.hive); }} className="flex-1">Edit</Button>
                        </div>
                    </div>
                </Modal>
            )}

            {/* ── Create Modal ── */}
            <Modal isOpen={activeModal?.type === 'create'} onClose={close} title="Register Hive" maxWidth="md">
                <form onSubmit={submitCreate} className="space-y-4">
                    <SelectField
                        label="Beekeeper"
                        value={createForm.data.beekeeper_id}
                        onChange={v => createForm.setData('beekeeper_id', v)}
                        options={beekeeperOptions}
                        error={createForm.errors.beekeeper_id}
                    />
                    <Input
                        label="Hive Name"
                        value={createForm.data.name}
                        onChange={e => createForm.setData('name', e.target.value)}
                        placeholder="e.g. Hive Alpha"
                        autoFocus
                        error={createForm.errors.name}
                    />
                    <SelectField
                        label="Species (optional)"
                        value={createForm.data.species_id}
                        onChange={v => createForm.setData('species_id', v)}
                        options={speciesOptions}
                        error={createForm.errors.species_id}
                    />
                    <SelectField
                        label="Site (optional)"
                        value={createForm.data.site_id}
                        onChange={v => createForm.setData('site_id', v)}
                        options={siteOptions}
                        error={createForm.errors.site_id}
                    />
                    <SelectField
                        label="Status"
                        value={createForm.data.status}
                        onChange={v => createForm.setData('status', v)}
                        options={statusOptions}
                        error={createForm.errors.status}
                    />
                    <div>
                        <label className="block text-sm font-medium text-amber-900 mb-1">Image (optional)</label>
                        <input
                            type="file"
                            accept="image/*"
                            onChange={e => createForm.setData('image', e.target.files?.[0] ?? null)}
                            className="block w-full text-sm text-amber-900/70 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-amber-100 file:text-amber-800 hover:file:bg-amber-200"
                        />
                        {createForm.errors.image && <p className="text-xs text-rose-500 mt-1">{createForm.errors.image}</p>}
                    </div>
                    <div className="flex gap-3 pt-2">
                        <Button type="button" variant="ghost" onClick={close} className="flex-1">Cancel</Button>
                        <Button type="submit" variant="primary" disabled={createForm.processing} className="flex-1">
                            {createForm.processing ? 'Registering...' : 'Register Hive'}
                        </Button>
                    </div>
                </form>
            </Modal>

            {/* ── Edit Modal ── */}
            {activeModal?.type === 'edit' && (
                <Modal isOpen onClose={close} title="Edit Hive" maxWidth="md">
                    <form onSubmit={submitEdit} className="space-y-4">
                        <SelectField
                            label="Beekeeper"
                            value={editForm.data.beekeeper_id}
                            onChange={v => editForm.setData('beekeeper_id', v)}
                            options={beekeeperOptions}
                            error={editForm.errors.beekeeper_id}
                        />
                        <Input
                            label="Hive Name"
                            value={editForm.data.name}
                            onChange={e => editForm.setData('name', e.target.value)}
                            autoFocus
                            error={editForm.errors.name}
                        />
                        <SelectField
                            label="Species (optional)"
                            value={editForm.data.species_id}
                            onChange={v => editForm.setData('species_id', v)}
                            options={speciesOptions}
                            error={editForm.errors.species_id}
                        />
                        <SelectField
                            label="Site (optional)"
                            value={editForm.data.site_id}
                            onChange={v => editForm.setData('site_id', v)}
                            options={siteOptions}
                            error={editForm.errors.site_id}
                        />
                        <SelectField
                            label="Status"
                            value={editForm.data.status}
                            onChange={v => editForm.setData('status', v as 'active' | 'inactive')}
                            options={statusOptions}
                            error={editForm.errors.status}
                        />
                        <div>
                            <label className="block text-sm font-medium text-amber-900 mb-1">Replace Image (optional)</label>
                            <input
                                type="file"
                                accept="image/*"
                                onChange={e => editForm.setData('image', e.target.files?.[0] ?? null)}
                                className="block w-full text-sm text-amber-900/70 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-amber-100 file:text-amber-800 hover:file:bg-amber-200"
                            />
                            {editForm.errors.image && <p className="text-xs text-rose-500 mt-1">{editForm.errors.image}</p>}
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

            {/* ── Toggle Status Confirmation ── */}
            {activeModal?.type === 'toggle' && (
                <Modal isOpen onClose={close} title={activeModal.hive.status === 'active' ? 'Set Hive Inactive' : 'Set Hive Active'} maxWidth="sm">
                    <div className="space-y-4">
                        <p className="text-sm text-amber-900/70">
                            {activeModal.hive.status === 'active'
                                ? `Setting "${activeModal.hive.name}" to inactive will stop it from receiving sensor data.`
                                : `Setting "${activeModal.hive.name}" to active will allow it to receive sensor data again.`}
                        </p>
                        <div className="flex gap-3">
                            <Button type="button" variant="ghost" onClick={close} className="flex-1">Cancel</Button>
                            <Button
                                type="button"
                                variant={activeModal.hive.status === 'active' ? 'destructive' : 'primary'}
                                onClick={confirmToggle}
                                className="flex-1"
                            >
                                {activeModal.hive.status === 'active' ? 'Set Inactive' : 'Set Active'}
                            </Button>
                        </div>
                    </div>
                </Modal>
            )}

            {/* ── Delete Confirmation ── */}
            {activeModal?.type === 'delete' && (
                <Modal isOpen onClose={close} title="Delete Hive" maxWidth="sm">
                    <div className="space-y-4">
                        <p className="text-sm text-amber-900/70">
                            Delete <span className="font-semibold text-amber-950">"{activeModal.hive.name}"</span>? This will permanently remove the hive and all its data. This cannot be undone.
                        </p>
                        <div className="flex gap-3">
                            <Button type="button" variant="ghost" onClick={close} disabled={deleting} className="flex-1">Cancel</Button>
                            <Button type="button" variant="destructive" onClick={confirmDelete} disabled={deleting} className="flex-1">
                                {deleting ? 'Deleting...' : 'Delete Hive'}
                            </Button>
                        </div>
                    </div>
                </Modal>
            )}
        </AdminLayout>
    );
}
