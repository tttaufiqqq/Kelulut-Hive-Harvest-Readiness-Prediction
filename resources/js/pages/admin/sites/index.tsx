import { Head, router, useForm, usePage } from '@inertiajs/react';
import { MoreVertical, Plus, Edit2, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/core/button';
import { Card } from '@/components/core/card';
import { Dropdown } from '@/components/core/dropdown';
import { Alert } from '@/components/core/feedback';
import { Input } from '@/components/core/input';
import { Modal } from '@/components/core/modal';
import { AdminLayout } from '@/layouts/admin-layout';

type SiteRow = {
    id: number;
    name: string;
    description: string | null;
    hive_count: number;
};

type PageProps = {
    sites: SiteRow[];
};

type ActiveModal =
    | { type: 'create' }
    | { type: 'edit'; site: SiteRow }
    | { type: 'delete'; site: SiteRow }
    | null;

type SiteFormData = { name: string; description: string };

export default function SitesIndex({ sites }: PageProps) {
    const { props } = usePage<{ flash?: { success?: string; error?: string } }>();
    const flash = props.flash;

    const [activeModal, setActiveModal] = useState<ActiveModal>(null);
    const [deleting, setDeleting]       = useState(false);
    const close = () => setActiveModal(null);

    const createForm = useForm<SiteFormData>({ name: '', description: '' });
    const editForm   = useForm<SiteFormData>({ name: '', description: '' });

    const openEdit = (site: SiteRow) => {
        editForm.setData({ name: site.name, description: site.description ?? '' });
        setActiveModal({ type: 'edit', site });
    };

    const submitCreate = (e: React.FormEvent) => {
        e.preventDefault();
        createForm.post(route('admin.sites.store'), {
            onSuccess: () => { createForm.reset(); close(); },
        });
    };

    const submitEdit = (e: React.FormEvent) => {
        e.preventDefault();
        if (activeModal?.type !== 'edit') return;
        editForm.patch(route('admin.sites.update', { site: activeModal.site.id }), {
            onSuccess: () => close(),
        });
    };

    const confirmDelete = () => {
        if (activeModal?.type !== 'delete') return;
        setDeleting(true);
        router.delete(route('admin.sites.destroy', { site: activeModal.site.id }), {
            onFinish: () => { setDeleting(false); close(); },
        });
    };

    return (
        <AdminLayout>
            <Head title="Sites — Admin" />

            <div className="space-y-6">
                {flash?.success && <Alert variant="success">{flash.success}</Alert>}
                {flash?.error   && <Alert variant="error">{flash.error}</Alert>}

                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h3 className="text-lg font-bold text-amber-900">Sites</h3>
                        <p className="text-sm text-amber-900/50">{sites.length} site{sites.length !== 1 ? 's' : ''} configured</p>
                    </div>
                    <Button variant="primary" size="sm" onClick={() => setActiveModal({ type: 'create' })}>
                        <Plus className="w-4 h-4 mr-1" />
                        Add Site
                    </Button>
                </div>

                {/* Table */}
                <Card className="overflow-hidden p-0">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="bg-yellow-50/50 border-b border-yellow-100">
                                    <th className="text-left px-6 py-3 text-xs font-bold uppercase tracking-widest text-amber-900/50">Name</th>
                                    <th className="text-left px-6 py-3 text-xs font-bold uppercase tracking-widest text-amber-900/50 hidden md:table-cell">Description</th>
                                    <th className="text-left px-6 py-3 text-xs font-bold uppercase tracking-widest text-amber-900/50">Hives</th>
                                    <th className="px-6 py-3" />
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-yellow-50">
                                {sites.length === 0 && (
                                    <tr>
                                        <td colSpan={4} className="px-6 py-10 text-center text-amber-900/40 text-sm">
                                            No sites configured yet.
                                        </td>
                                    </tr>
                                )}
                                {sites.map((site) => (
                                    <tr key={site.id} className="hover:bg-yellow-50/30 transition-colors">
                                        <td className="px-6 py-4 font-medium text-amber-950">{site.name}</td>
                                        <td className="px-6 py-4 text-amber-900/60 hidden md:table-cell">{site.description ?? '—'}</td>
                                        <td className="px-6 py-4">
                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-700">
                                                {site.hive_count}
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
                                                        onClick: () => openEdit(site),
                                                    },
                                                    {
                                                        id: 'delete',
                                                        label: 'Delete',
                                                        icon: <Trash2 className="w-4 h-4" />,
                                                        variant: 'danger' as const,
                                                        onClick: () => setActiveModal({ type: 'delete', site }),
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
            <Modal isOpen={activeModal?.type === 'create'} onClose={close} title="Add Site" maxWidth="sm">
                <form onSubmit={submitCreate} className="space-y-4">
                    <Input
                        label="Site Name"
                        value={createForm.data.name}
                        onChange={e => createForm.setData('name', e.target.value)}
                        placeholder="e.g. Field C"
                        autoFocus
                        error={createForm.errors.name}
                    />
                    <Input
                        label="Description (optional)"
                        value={createForm.data.description}
                        onChange={e => createForm.setData('description', e.target.value)}
                        placeholder="e.g. Outdoor field near durian farm"
                        error={createForm.errors.description}
                    />
                    <div className="flex gap-3 pt-2">
                        <Button type="button" variant="ghost" onClick={close} className="flex-1">Cancel</Button>
                        <Button type="submit" variant="primary" disabled={createForm.processing} className="flex-1">
                            {createForm.processing ? 'Adding...' : 'Add Site'}
                        </Button>
                    </div>
                </form>
            </Modal>

            {/* ── Edit Modal ── */}
            {activeModal?.type === 'edit' && (
                <Modal isOpen onClose={close} title="Edit Site" maxWidth="sm">
                    <form onSubmit={submitEdit} className="space-y-4">
                        <Input
                            label="Site Name"
                            value={editForm.data.name}
                            onChange={e => editForm.setData('name', e.target.value)}
                            autoFocus
                            error={editForm.errors.name}
                        />
                        <Input
                            label="Description (optional)"
                            value={editForm.data.description}
                            onChange={e => editForm.setData('description', e.target.value)}
                            error={editForm.errors.description}
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
                <Modal isOpen onClose={close} title="Delete Site" maxWidth="sm">
                    <div className="space-y-4">
                        <p className="text-sm text-amber-900/70">
                            Delete <span className="font-semibold text-amber-950">"{activeModal.site.name}"</span>?
                            {activeModal.site.hive_count > 0 && (
                                <span className="block mt-2 text-rose-600 font-medium">
                                    This site has {activeModal.site.hive_count} hive(s) assigned. Reassign them first.
                                </span>
                            )}
                            {activeModal.site.hive_count === 0 && (
                                <span> This cannot be undone.</span>
                            )}
                        </p>
                        <div className="flex gap-3">
                            <Button type="button" variant="ghost" onClick={close} disabled={deleting} className="flex-1">Cancel</Button>
                            <Button
                                type="button"
                                variant="destructive"
                                onClick={confirmDelete}
                                disabled={deleting || activeModal.site.hive_count > 0}
                                className="flex-1"
                            >
                                {deleting ? 'Deleting...' : 'Delete Site'}
                            </Button>
                        </div>
                    </div>
                </Modal>
            )}
        </AdminLayout>
    );
}
