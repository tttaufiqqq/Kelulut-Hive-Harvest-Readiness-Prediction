import { Head, Link, router, useForm, usePage } from '@inertiajs/react';
import { Plus } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/core/display/button';
import { Card } from '@/components/core/display/card';
import { FlashAlerts } from '@/components/core/feedback/flash-alerts';
import type { FlashMessageBag } from '@/components/core/feedback/flash-alerts';
import { AdminLayout } from '@/layouts/admin-layout';
import type { PaginatedUsers, User } from '@/types';
import { BeekeeperConfirmModals } from './BeekeeperConfirmModals';
import { BeekeeperTableRow } from './BeekeeperTableRow';
import { CreateBeekeeperModal } from './CreateBeekeeperModal';
import { EditBeekeeperModal } from './EditBeekeeperModal';
import { ViewBeekeeperModal } from './ViewBeekeeperModal';
import type { HarvestRow } from './ViewBeekeeperModal';

type ActiveModal =
    | { type: 'create' }
    | { type: 'view'; index: number }
    | { type: 'edit'; user: User }
    | { type: 'confirm-edit'; user: User }
    | { type: 'toggle'; user: User }
    | { type: 'resend'; user: User }
    | { type: 'delete'; user: User }
    | null;

function validateBeekeeperForm(data: { name: string; email: string; phone: string }) {
    const errors: Record<string, string> = {};
    if (!data.name.trim() || data.name.trim().length < 2) { errors.name = 'Name must be at least 2 characters.'; }
    else if (!/^[\p{L}\s'\-.]+$/u.test(data.name.trim())) { errors.name = 'Name must contain letters only.'; }
    if (!/^[\w.%+-]+@[\w.-]+\.[a-zA-Z]{2,}$/.test(data.email)) { errors.email = 'Enter a valid email address.'; }
    if (data.phone && !/^(\+?60|0)[0-9\s-]{8,14}$/.test(data.phone)) { errors.phone = 'Use Malaysian format e.g. 012-345 6789'; }
    return errors;
}

export default function BeekeepersIndex({ beekeepers, stats }: { beekeepers: PaginatedUsers; stats: { total: number; pending: number; active: number } }) {
    const { props } = usePage<{ flash?: FlashMessageBag }>();
    const flash = props.flash;
    const [activeModal, setActiveModal] = useState<ActiveModal>(null);
    const [deleting, setDeleting] = useState(false);
    const [editInstant, setEditInstant] = useState(false);
    const [harvestRows, setHarvestRows] = useState<HarvestRow[] | null>(null);
    const [harvestLoading, setHarvestLoading] = useState(false);
    const cancelHarvestRef = useRef<() => void>(() => {});
    const viewIndex = activeModal?.type === 'view' ? activeModal.index : null;
    const viewBeekeeper = viewIndex !== null ? beekeepers.data[viewIndex] : null;
    const hasPrev = viewIndex !== null && viewIndex > 0;
    const hasNext = viewIndex !== null && viewIndex < beekeepers.data.length - 1;

    const fetchHarvestRows = (userId: number) => {
        cancelHarvestRef.current();
        setHarvestRows(null);
        setHarvestLoading(true);
        let cancelled = false;
        cancelHarvestRef.current = () => { cancelled = true; };
        fetch(`/admin/beekeepers/${userId}/harvest-summary`, { headers: { Accept: 'application/json' } })
            .then((res) => res.json() as Promise<{ hives: HarvestRow[] }>)
            .then((data) => { if (!cancelled) setHarvestRows(data.hives ?? []); })
            .catch(() => { if (!cancelled) setHarvestRows([]); })
            .finally(() => { if (!cancelled) setHarvestLoading(false); });
    };

    const openView = (index: number) => { setActiveModal({ type: 'view', index }); fetchHarvestRows(beekeepers.data[index].id); };
    const close = () => { cancelHarvestRef.current(); setActiveModal(null); setHarvestRows(null); };

    useEffect(() => {
        if (viewIndex === null) return;
        const handler = (e: KeyboardEvent) => {
            if ((e.key === 'ArrowLeft' || e.key === 'ArrowUp') && viewIndex > 0) { e.preventDefault(); openView(viewIndex - 1); }
            if ((e.key === 'ArrowRight' || e.key === 'ArrowDown') && viewIndex < beekeepers.data.length - 1) { e.preventDefault(); openView(viewIndex + 1); }
        };
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, [viewIndex, beekeepers.data.length]);

    const createForm = useForm({ name: '', email: '', phone: '' });
    const editForm = useForm({ name: '', email: '', phone: '' });
    const openEdit = (user: User, instant = false) => { setEditInstant(instant); editForm.setData({ name: user.name, email: user.email, phone: user.phone ?? '' }); setActiveModal({ type: 'edit', user }); };
    const submitCreate = (e: React.FormEvent) => {
        e.preventDefault();
        const errors = validateBeekeeperForm(createForm.data);
        if (Object.keys(errors).length > 0) { createForm.setError(errors as never); return; }
        createForm.post(route('admin.beekeepers.store'), { onSuccess: () => { createForm.reset(); close(); } });
    };
    const openEditConfirm = () => {
        if (activeModal?.type !== 'edit') return;
        const errors = validateBeekeeperForm(editForm.data);
        if (Object.keys(errors).length > 0) { editForm.setError(errors as never); return; }
        setActiveModal({ type: 'confirm-edit', user: activeModal.user });
    };
    const confirmEdit = () => { if (activeModal?.type !== 'confirm-edit') return; editForm.patch(route('admin.beekeepers.update', { user: activeModal.user.id }), { onSuccess: close }); };
    const confirmToggle = () => { if (activeModal?.type !== 'toggle') return; router.patch(route('admin.beekeepers.toggle-status', { user: activeModal.user.id }), {}, { onSuccess: close }); };
    const confirmResend = () => { if (activeModal?.type !== 'resend') return; router.post(route('admin.beekeepers.resend-invite', { user: activeModal.user.id }), {}, { onSuccess: close }); };
    const confirmDelete = () => { if (activeModal?.type !== 'delete') return; setDeleting(true); router.delete(route('admin.beekeepers.destroy', { user: activeModal.user.id }), { onFinish: () => { setDeleting(false); close(); } }); };
    const confirmableModal = activeModal?.type === 'confirm-edit' || activeModal?.type === 'toggle' || activeModal?.type === 'resend' || activeModal?.type === 'delete' ? activeModal : null;

    return (
        <AdminLayout>
            <Head title="Beekeepers — Admin" />
            <div className="space-y-6">
                <FlashAlerts key={flash?.id ?? 'beekeeper-flash'} flash={flash} />
                <div className="flex items-center justify-between">
                    <div>
                        <h3 className="text-lg font-bold text-amber-900">Beekeepers</h3>
                        <p className="text-sm text-amber-900/50">{stats.total} total · {stats.pending} pending · {stats.active} active</p>
                    </div>
                    <Button variant="primary" size="sm" onClick={() => setActiveModal({ type: 'create' })}><Plus className="mr-1 h-4 w-4" />Add Beekeeper</Button>
                </div>
                <Card className="overflow-hidden p-0">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-yellow-100 bg-yellow-50/50">
                                    {['Name', 'Email'].map((h) => <th key={h} className="px-6 py-3 text-left text-xs font-bold tracking-widest text-amber-900/50 uppercase">{h}</th>)}
                                    <th className="hidden px-6 py-3 text-left text-xs font-bold tracking-widest text-amber-900/50 uppercase md:table-cell">Phone</th>
                                    <th className="px-6 py-3 text-left text-xs font-bold tracking-widest text-amber-900/50 uppercase">Status</th>
                                    <th className="hidden px-6 py-3 text-left text-xs font-bold tracking-widest text-amber-900/50 uppercase lg:table-cell">Joined</th>
                                    <th className="px-6 py-3" />
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-yellow-50">
                                {beekeepers.data.length === 0 && <tr><td colSpan={6} className="px-6 py-10 text-center text-sm text-amber-900/40">No beekeepers yet. Add one to get started.</td></tr>}
                                {beekeepers.data.map((user, index) => (
                                    <BeekeeperTableRow key={user.id} user={user} index={index} onView={openView} onEdit={openEdit} onToggle={(u) => setActiveModal({ type: 'toggle', user: u })} onResend={(u) => setActiveModal({ type: 'resend', user: u })} onDelete={(u) => setActiveModal({ type: 'delete', user: u })} />
                                ))}
                            </tbody>
                        </table>
                    </div>
                </Card>
                {beekeepers.last_page > 1 && (
                    <div className="flex items-center justify-center gap-1">
                        {beekeepers.links.map((link, i) => link.url
                            ? <Link key={i} href={link.url} className={`rounded-lg px-3 py-1.5 text-sm transition-colors ${link.active ? 'bg-amber-500 font-semibold text-white' : 'text-amber-900/70 hover:bg-yellow-100'}`} dangerouslySetInnerHTML={{ __html: link.label }} />
                            : <span key={i} className="px-3 py-1.5 text-sm text-amber-900/30" dangerouslySetInnerHTML={{ __html: link.label }} />
                        )}
                    </div>
                )}
            </div>

            <CreateBeekeeperModal isOpen={activeModal?.type === 'create'} form={createForm} onSubmit={submitCreate} onClose={close} />
            {activeModal?.type === 'view' && viewBeekeeper && (
                <ViewBeekeeperModal beekeeper={viewBeekeeper} beekeeperIndex={viewIndex!} totalBeekeepers={beekeepers.data.length} hasPrev={hasPrev} hasNext={hasNext} harvestRows={harvestRows} harvestLoading={harvestLoading}
                    onPrev={() => openView(viewIndex! - 1)} onNext={() => openView(viewIndex! + 1)} onEdit={() => openEdit(viewBeekeeper, true)} onClose={close} />
            )}
            {activeModal?.type === 'edit' && (
                <EditBeekeeperModal isOpen instant={editInstant} form={editForm} onSubmit={openEditConfirm} onClose={() => { setEditInstant(false); close(); }} />
            )}
            <BeekeeperConfirmModals activeModal={confirmableModal} deleting={deleting} editProcessing={editForm.processing} instant={editInstant} onConfirmEdit={confirmEdit} onConfirmToggle={confirmToggle} onConfirmResend={confirmResend} onConfirmDelete={confirmDelete} onClose={close} />
        </AdminLayout>
    );
}
