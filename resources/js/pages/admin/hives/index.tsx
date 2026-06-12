import { Head, router, useForm, usePage } from '@inertiajs/react';
import { Plus } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Button } from '@/components/core/button';
import { Card } from '@/components/core/card';
import { FlashAlerts } from '@/components/core/flash-alerts';
import type { FlashMessageBag } from '@/components/core/flash-alerts';
import { AdminLayout } from '@/layouts/admin-layout';
import { CreateHiveModal } from './CreateHiveModal';
import type { HiveFormData, SelectOption } from './CreateHiveModal';
import { EditHiveModal } from './EditHiveModal';
import { HiveConfirmModals } from './HiveConfirmModals';
import { HiveTableRow } from './HiveTableRow';
import type { HiveRow } from './HiveTableRow';
import { ViewHiveModal } from './ViewHiveModal';

type MasterItem = { id: number; name: string };

type ActiveModal =
    | { type: 'create' }
    | { type: 'view'; index: number }
    | { type: 'edit'; hive: HiveRow }
    | { type: 'confirm-edit'; hive: HiveRow }
    | { type: 'delete'; hive: HiveRow }
    | { type: 'toggle'; hive: HiveRow }
    | null;

export default function HivesIndex({ hives, beekeepers, species_list, sites_list, stats }: {
    hives: HiveRow[];
    beekeepers: MasterItem[];
    species_list: MasterItem[];
    sites_list: MasterItem[];
    stats: { total: number; active: number; inactive: number };
}) {
    const { props } = usePage<{ flash?: FlashMessageBag }>();
    const flash = props.flash;

    const [activeModal, setActiveModal] = useState<ActiveModal>(null);
    const [deleting, setDeleting] = useState(false);
    const close = () => setActiveModal(null);

    const viewIndex = activeModal?.type === 'view' ? activeModal.index : null;
    const viewHive = viewIndex !== null ? hives[viewIndex] : null;
    const hasPrev = viewIndex !== null && viewIndex > 0;
    const hasNext = viewIndex !== null && viewIndex < hives.length - 1;

    useEffect(() => {
        if (viewIndex === null) return;
        const handler = (e: KeyboardEvent) => {
            if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
                e.preventDefault();
                setActiveModal((p) => p?.type === 'view' && p.index > 0 ? { type: 'view', index: p.index - 1 } : p);
            }
            if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
                e.preventDefault();
                setActiveModal((p) => p?.type === 'view' && p.index < hives.length - 1 ? { type: 'view', index: p.index + 1 } : p);
            }
        };
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, [viewIndex, hives.length]);

    const toOpts = (items: MasterItem[]): SelectOption[] => items.map((i) => ({ value: String(i.id), label: i.name }));
    const beekeeperOptions = toOpts(beekeepers);
    const speciesOptions: SelectOption[] = [{ value: '', label: '— None —' }, ...toOpts(species_list)];
    const siteOptions: SelectOption[] = [{ value: '', label: '— None —' }, ...toOpts(sites_list)];
    const statusOptions: SelectOption[] = [{ value: 'active', label: 'Active' }, { value: 'inactive', label: 'Inactive' }];

    const emptyForm: HiveFormData = { name: '', beekeeper_id: '', species_id: '', site_id: '', status: 'active', image: null };
    const createForm = useForm<HiveFormData>(emptyForm);
    const editForm = useForm<HiveFormData>(emptyForm);

    const openEdit = (hive: HiveRow) => {
        editForm.setData({ name: hive.name, beekeeper_id: String(hive.beekeeper_id), species_id: hive.species_id ? String(hive.species_id) : '', site_id: hive.site_id ? String(hive.site_id) : '', status: hive.status, image: null });
        setActiveModal({ type: 'edit', hive });
    };
    const submitCreate = () => createForm.post(route('admin.hives.store'), { forceFormData: true, onSuccess: () => { createForm.reset(); close(); } });
    const openEditConfirm = () => { if (activeModal?.type === 'edit') setActiveModal({ type: 'confirm-edit', hive: activeModal.hive }); };
    const confirmEdit = () => {
        if (activeModal?.type !== 'confirm-edit') return;
        editForm.transform((data) => ({ ...data, _method: 'patch' }));
        editForm.post(route('admin.hives.update', { hive: activeModal.hive.id }), { forceFormData: true, onSuccess: close });
    };
    const confirmToggle = () => { if (activeModal?.type === 'toggle') router.patch(route('admin.hives.toggle-status', { hive: activeModal.hive.id }), {}, { onSuccess: close }); };
    const confirmDelete = () => {
        if (activeModal?.type !== 'delete') return;
        setDeleting(true);
        router.delete(route('admin.hives.destroy', { hive: activeModal.hive.id }), { onFinish: () => { setDeleting(false); close(); } });
    };

    const confirmableModal =
        activeModal?.type === 'confirm-edit' || activeModal?.type === 'toggle' || activeModal?.type === 'delete'
            ? activeModal
            : null;

    return (
        <AdminLayout>
            <Head title="Hive Management — Admin" />
            <div className="space-y-6">
                <FlashAlerts key={flash?.id ?? 'hive-flash'} flash={flash} />
                <div className="flex items-center justify-between">
                    <div>
                        <h3 className="text-lg font-bold text-amber-900">Hive Management</h3>
                        <p className="text-sm text-amber-900/50">{stats.total} total · {stats.active} active · {stats.inactive} inactive</p>
                    </div>
                    <Button variant="primary" size="sm" onClick={() => setActiveModal({ type: 'create' })}>
                        <Plus className="mr-1 h-4 w-4" /> Register Hive
                    </Button>
                </div>
                <Card className="overflow-hidden p-0">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-yellow-100 bg-yellow-50/50">
                                    {['Name', 'Beekeeper'].map((h) => (
                                        <th key={h} className="px-6 py-3 text-left text-xs font-bold tracking-widest text-amber-900/50 uppercase">{h}</th>
                                    ))}
                                    <th className="hidden px-6 py-3 text-left text-xs font-bold tracking-widest text-amber-900/50 uppercase md:table-cell">Site</th>
                                    <th className="hidden px-6 py-3 text-left text-xs font-bold tracking-widest text-amber-900/50 uppercase md:table-cell">Species</th>
                                    <th className="px-6 py-3 text-left text-xs font-bold tracking-widest text-amber-900/50 uppercase">Status</th>
                                    <th className="hidden px-6 py-3 text-left text-xs font-bold tracking-widest text-amber-900/50 uppercase lg:table-cell">Age</th>
                                    <th className="px-6 py-3" />
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-yellow-50">
                                {hives.length === 0 && (
                                    <tr><td colSpan={7} className="px-6 py-10 text-center text-sm text-amber-900/40">No hives registered yet.</td></tr>
                                )}
                                {hives.map((hive, index) => (
                                    <HiveTableRow
                                        key={hive.id}
                                        hive={hive}
                                        index={index}
                                        onView={(idx) => setActiveModal({ type: 'view', index: idx })}
                                        onEdit={openEdit}
                                        onToggle={(h) => setActiveModal({ type: 'toggle', hive: h })}
                                        onDelete={(h) => setActiveModal({ type: 'delete', hive: h })}
                                    />
                                ))}
                            </tbody>
                        </table>
                    </div>
                </Card>
            </div>

            {activeModal?.type === 'view' && viewHive && (
                <ViewHiveModal
                    hive={viewHive}
                    hiveIndex={viewIndex!}
                    totalHives={hives.length}
                    hasPrev={hasPrev}
                    hasNext={hasNext}
                    onPrev={() => setActiveModal((p) => p?.type === 'view' && p.index > 0 ? { type: 'view', index: p.index - 1 } : p)}
                    onNext={() => setActiveModal((p) => p?.type === 'view' && p.index < hives.length - 1 ? { type: 'view', index: p.index + 1 } : p)}
                    onEdit={() => { close(); openEdit(viewHive); }}
                    onClose={close}
                />
            )}

            <CreateHiveModal isOpen={activeModal?.type === 'create'} beekeeperOptions={beekeeperOptions} speciesOptions={speciesOptions} siteOptions={siteOptions} statusOptions={statusOptions} form={createForm} onSubmit={submitCreate} onClose={close} />

            {activeModal?.type === 'edit' && (
                <EditHiveModal isOpen beekeeperOptions={beekeeperOptions} speciesOptions={speciesOptions} siteOptions={siteOptions} statusOptions={statusOptions} form={editForm} onSubmit={openEditConfirm} onClose={close} />
            )}

            <HiveConfirmModals activeModal={confirmableModal} deleting={deleting} editProcessing={editForm.processing} onConfirmEdit={confirmEdit} onConfirmToggle={confirmToggle} onConfirmDelete={confirmDelete} onClose={close} />
        </AdminLayout>
    );
}
