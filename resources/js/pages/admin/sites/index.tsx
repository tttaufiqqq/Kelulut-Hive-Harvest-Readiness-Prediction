import { Head, router, useForm, usePage } from '@inertiajs/react';
import { Plus } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Button } from '@/components/core/button';
import { Card } from '@/components/core/card';
import { FlashAlerts } from '@/components/core/flash-alerts';
import type { FlashMessageBag } from '@/components/core/flash-alerts';
import { AdminLayout } from '@/layouts/admin-layout';
import { SiteConfirmModals } from './SiteConfirmModals';
import { SiteFormModal } from './SiteFormModal';
import type { SiteFormData } from './SiteFormModal';
import { SiteTableRow } from './SiteTableRow';
import type { SiteRow } from './SiteTableRow';
import { ViewSiteModal } from './ViewSiteModal';

type ActiveModal =
    | { type: 'create' }
    | { type: 'view'; index: number }
    | { type: 'edit'; site: SiteRow }
    | { type: 'confirm-edit'; site: SiteRow }
    | { type: 'delete'; site: SiteRow }
    | null;

export default function SitesIndex({ sites }: { sites: SiteRow[] }) {
    const { props } = usePage<{ flash?: FlashMessageBag }>();
    const flash = props.flash;

    const [activeModal, setActiveModal] = useState<ActiveModal>(null);
    const [deleting, setDeleting] = useState(false);
    const [editInstant, setEditInstant] = useState(false);
    const close = () => setActiveModal(null);

    const viewIndex = activeModal?.type === 'view' ? activeModal.index : null;
    const viewSite = viewIndex !== null ? sites[viewIndex] : null;
    const hasPrev = viewIndex !== null && viewIndex > 0;
    const hasNext = viewIndex !== null && viewIndex < sites.length - 1;

    useEffect(() => {
        if (viewIndex === null) return;
        const handler = (e: KeyboardEvent) => {
            if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
                e.preventDefault();
                setActiveModal((p) => p?.type === 'view' && p.index > 0 ? { type: 'view', index: p.index - 1 } : p);
            }
            if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
                e.preventDefault();
                setActiveModal((p) => p?.type === 'view' && p.index < sites.length - 1 ? { type: 'view', index: p.index + 1 } : p);
            }
        };
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, [viewIndex, sites.length]);

    const createForm = useForm<SiteFormData>({ name: '', description: '' });
    const editForm = useForm<SiteFormData>({ name: '', description: '' });

    const openEdit = (site: SiteRow, instant = false) => {
        setEditInstant(instant);
        editForm.setData({ name: site.name, description: site.description ?? '' });
        setActiveModal({ type: 'edit', site });
    };
    const submitCreate = () => createForm.post(route('admin.sites.store'), { onSuccess: () => { createForm.reset(); close(); } });
    const openEditConfirm = () => { if (activeModal?.type === 'edit') setActiveModal({ type: 'confirm-edit', site: activeModal.site }); };
    const confirmEdit = () => { if (activeModal?.type === 'confirm-edit') editForm.patch(route('admin.sites.update', { site: activeModal.site.id }), { onSuccess: close }); };
    const confirmDelete = () => {
        if (activeModal?.type !== 'delete') return;
        setDeleting(true);
        router.delete(route('admin.sites.destroy', { site: activeModal.site.id }), { onFinish: () => { setDeleting(false); close(); } });
    };

    const confirmableModal =
        activeModal?.type === 'confirm-edit' || activeModal?.type === 'delete' ? activeModal : null;

    return (
        <AdminLayout>
            <Head title="Sites — Admin" />
            <div className="space-y-6">
                <FlashAlerts key={flash?.id ?? 'site-flash'} flash={flash} />
                <div className="flex items-center justify-between">
                    <div>
                        <h3 className="text-lg font-bold text-amber-900">Sites</h3>
                        <p className="text-sm text-amber-900/50">{sites.length} site{sites.length !== 1 ? 's' : ''} configured</p>
                    </div>
                    <Button variant="primary" size="sm" onClick={() => setActiveModal({ type: 'create' })}>
                        <Plus className="mr-1 h-4 w-4" /> Add Site
                    </Button>
                </div>
                <Card className="overflow-hidden p-0">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-yellow-100 bg-yellow-50/50">
                                    <th className="px-6 py-3 text-left text-xs font-bold tracking-widest text-amber-900/50 uppercase">Name</th>
                                    <th className="hidden px-6 py-3 text-left text-xs font-bold tracking-widest text-amber-900/50 uppercase md:table-cell">Description</th>
                                    <th className="px-6 py-3 text-left text-xs font-bold tracking-widest text-amber-900/50 uppercase">Hives</th>
                                    <th className="px-6 py-3" />
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-yellow-50">
                                {sites.length === 0 && (
                                    <tr><td colSpan={4} className="px-6 py-10 text-center text-sm text-amber-900/40">No sites configured yet.</td></tr>
                                )}
                                {sites.map((site, index) => (
                                    <SiteTableRow
                                        key={site.id}
                                        site={site}
                                        index={index}
                                        onView={(idx) => setActiveModal({ type: 'view', index: idx })}
                                        onEdit={openEdit}
                                        onDelete={(s) => setActiveModal({ type: 'delete', site: s })}
                                    />
                                ))}
                            </tbody>
                        </table>
                    </div>
                </Card>
            </div>

            {activeModal?.type === 'view' && viewSite && (
                <ViewSiteModal
                    site={viewSite}
                    siteIndex={viewIndex!}
                    totalSites={sites.length}
                    hasPrev={hasPrev}
                    hasNext={hasNext}
                    onPrev={() => setActiveModal((p) => p?.type === 'view' && p.index > 0 ? { type: 'view', index: p.index - 1 } : p)}
                    onNext={() => setActiveModal((p) => p?.type === 'view' && p.index < sites.length - 1 ? { type: 'view', index: p.index + 1 } : p)}
                    onEdit={() => { close(); openEdit(viewSite, true); }}
                    onClose={close}
                />
            )}

            <SiteFormModal isOpen={activeModal?.type === 'create'} isCreate form={createForm} onSubmit={submitCreate} onClose={close} />
            {activeModal?.type === 'edit' && (
                <SiteFormModal isOpen isCreate={false} instant={editInstant} form={editForm} onSubmit={openEditConfirm} onClose={() => { setEditInstant(false); close(); }} />
            )}

            <SiteConfirmModals
                activeModal={confirmableModal}
                deleting={deleting}
                editProcessing={editForm.processing}
                onConfirmEdit={confirmEdit}
                onConfirmDelete={confirmDelete}
                onClose={close}
            />
        </AdminLayout>
    );
}
