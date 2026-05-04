import { Head, router, useForm, usePage } from '@inertiajs/react';
import { MoreVertical, Plus, Edit2, Trash2, ChevronLeft, ChevronRight } from 'lucide-react';
import { useState, useEffect } from 'react';
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
    | { type: 'view'; index: number }
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

    const viewIndex = activeModal?.type === 'view' ? activeModal.index : null;
    const viewSite  = viewIndex !== null ? sites[viewIndex] : null;
    const hasPrev   = viewIndex !== null && viewIndex > 0;
    const hasNext   = viewIndex !== null && viewIndex < sites.length - 1;

    useEffect(() => {
        if (viewIndex === null) return;
        const handler = (e: KeyboardEvent) => {
            if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
                e.preventDefault();
                setActiveModal(prev => prev?.type === 'view' && prev.index > 0
                    ? { type: 'view', index: prev.index - 1 } : prev);
            }
            if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
                e.preventDefault();
                setActiveModal(prev => prev?.type === 'view' && prev.index < sites.length - 1
                    ? { type: 'view', index: prev.index + 1 } : prev);
            }
        };
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, [viewIndex, sites.length]);

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
                                {sites.map((site, index) => (
                                    <tr key={site.id} className="hover:bg-yellow-50/30 transition-colors cursor-pointer" onClick={() => setActiveModal({ type: 'view', index })}>
                                        <td className="px-6 py-4 font-medium text-amber-950">{site.name}</td>
                                        <td className="px-6 py-4 text-amber-900/60 hidden md:table-cell">{site.description ?? '—'}</td>
                                        <td className="px-6 py-4">
                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-700">
                                                {site.hive_count}
                                            </span>
                                        </td>
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

            {/* ── View Modal ── */}
            {activeModal?.type === 'view' && viewSite && (
                <Modal isOpen onClose={close} title="Site Details" maxWidth="sm">
                    <div className="space-y-4">
                        <div className="flex items-center justify-end gap-1 -mt-1 mb-1">
                            <button
                                onClick={() => setActiveModal(prev => prev?.type === 'view' && prev.index > 0 ? { type: 'view', index: prev.index - 1 } : prev)}
                                disabled={!hasPrev}
                                className="p-1.5 rounded-xl transition-colors hover:bg-yellow-100 disabled:opacity-20 disabled:cursor-not-allowed"
                            >
                                <ChevronLeft className="w-4 h-4 text-amber-900" />
                            </button>
                            <span className="text-xs text-amber-900/40 font-bold tabular-nums min-w-[3rem] text-center">
                                {viewIndex! + 1} / {sites.length}
                            </span>
                            <button
                                onClick={() => setActiveModal(prev => prev?.type === 'view' && prev.index < sites.length - 1 ? { type: 'view', index: prev.index + 1 } : prev)}
                                disabled={!hasNext}
                                className="p-1.5 rounded-xl transition-colors hover:bg-yellow-100 disabled:opacity-20 disabled:cursor-not-allowed"
                            >
                                <ChevronRight className="w-4 h-4 text-amber-900" />
                            </button>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <p className="text-xs font-bold uppercase tracking-widest text-amber-900/40 mb-1">Name</p>
                                <p className="font-medium text-amber-950">{viewSite.name}</p>
                            </div>
                            <div>
                                <p className="text-xs font-bold uppercase tracking-widest text-amber-900/40 mb-1">Hives</p>
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-700">
                                    {viewSite.hive_count}
                                </span>
                            </div>
                        </div>
                        {viewSite.description && (
                            <div>
                                <p className="text-xs font-bold uppercase tracking-widest text-amber-900/40 mb-1">Description</p>
                                <p className="text-sm text-amber-900/70">{viewSite.description}</p>
                            </div>
                        )}
                        <p className="text-[10px] text-amber-900/25 text-center uppercase tracking-widest">Use arrow keys to navigate</p>
                        <div className="flex gap-3 pt-2">
                            <Button type="button" variant="ghost" onClick={close} className="flex-1">Close</Button>
                            <Button type="button" variant="outline" onClick={() => { close(); openEdit(viewSite!); }} className="flex-1">Edit</Button>
                        </div>
                    </div>
                </Modal>
            )}

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
