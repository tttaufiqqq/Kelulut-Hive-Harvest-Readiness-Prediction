import { Head, Link, router, useForm, usePage } from '@inertiajs/react';
import { Plus } from 'lucide-react';
import { useEffect, useState } from 'react';
import { BeekeeperTabs } from '@/components/core/navigation/beekeeper-tabs';
import { Button } from '@/components/core/display/button';
import { Card } from '@/components/core/display/card';
import { DataTable } from '@/components/core/data/content';
import { FlashAlerts } from '@/components/core/feedback/flash-alerts';
import type { FlashMessageBag } from '@/components/core/feedback/flash-alerts';
import { Breadcrumbs } from '@/components/core/navigation/navigation';
import { SelectField } from '@/components/core/form/select-field';
import { AuthenticatedLayout } from '@/layouts/authenticated-layout';
import type { Harvest, MasterHoneyColor, MasterHoneyFlavor, PaginatedHarvests } from '@/types';
import { CreateHarvestModal } from './CreateHarvestModal';
import type { HarvestCreateFormData } from './CreateHarvestModal';
import { EditHarvestModal } from './EditHarvestModal';
import type { HarvestEditFormData } from './EditHarvestModal';
import { HarvestConfirmModals } from './HarvestConfirmModals';
import { harvestColumns } from './HarvestTableRow';
import { ViewHarvestModal } from './ViewHarvestModal';
import { emptyCreate, hiveFilterOptions } from './constants';

type ActiveModal =
    | { type: 'create' }
    | { type: 'view'; index: number }
    | { type: 'edit'; harvest: Harvest }
    | { type: 'confirm-edit'; harvest: Harvest }
    | { type: 'delete'; harvest: Harvest }
    | null;

type Props = {
    harvests: PaginatedHarvests;
    hives: { id: number; name: string }[];
    colors: MasterHoneyColor[];
    flavors: MasterHoneyFlavor[];
    filters: { hive_id?: string };
};

export default function HarvestsIndex({ harvests, hives, colors, flavors, filters }: Props) {
    const { props } = usePage<{ flash?: FlashMessageBag }>();
    const flash = props.flash;
    const [activeModal, setActiveModal] = useState<ActiveModal>(null);
    const [deleting, setDeleting] = useState(false);
    const [editInstant, setEditInstant] = useState(false);
    const close = () => setActiveModal(null);
    const viewIndex = activeModal?.type === 'view' ? activeModal.index : null;
    const viewHarvest = viewIndex !== null ? harvests.data[viewIndex] : null;
    const hasPrev = viewIndex !== null && viewIndex > 0;
    const hasNext = viewIndex !== null && viewIndex < harvests.data.length - 1;

    useEffect(() => {
        if (viewIndex === null) return;
        const handler = (e: KeyboardEvent) => {
            if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') { e.preventDefault(); setActiveModal((p) => p?.type === 'view' && p.index > 0 ? { type: 'view', index: p.index - 1 } : p); }
            if (e.key === 'ArrowRight' || e.key === 'ArrowDown') { e.preventDefault(); setActiveModal((p) => p?.type === 'view' && p.index < harvests.data.length - 1 ? { type: 'view', index: p.index + 1 } : p); }
        };
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, [viewIndex, harvests.data.length]);

    const onHiveFilter = (val: string) => router.get(route('harvests.index'), val ? { hive_id: val } : {}, { preserveState: true, replace: true });
    const createForm = useForm<HarvestCreateFormData>({ ...emptyCreate });
    const editForm = useForm<HarvestEditFormData>({ harvest_date: '', weight: '', productivity_level: '', color_id: '', flavor_id: '', notes: '' });
    const openEdit = (harvest: Harvest, instant = false) => {
        setEditInstant(instant);
        editForm.setData({ harvest_date: harvest.harvest_date.slice(0, 10), weight: String(harvest.weight), productivity_level: harvest.productivity_level ?? '', color_id: harvest.color_id ? String(harvest.color_id) : '', flavor_id: harvest.flavor_id ? String(harvest.flavor_id) : '', notes: harvest.notes ?? '' });
        setActiveModal({ type: 'edit', harvest });
    };
    const submitCreate = (e: React.FormEvent) => { e.preventDefault(); createForm.post(route('harvests.store'), { onSuccess: () => { createForm.reset(); close(); } }); };
    const openEditConfirm = () => { if (activeModal?.type === 'edit') setActiveModal({ type: 'confirm-edit', harvest: activeModal.harvest }); };
    const confirmEdit = () => { if (activeModal?.type !== 'confirm-edit') return; editForm.patch(route('harvests.update', { harvest: activeModal.harvest.id }), { onSuccess: close }); };
    const confirmDelete = () => { if (activeModal?.type !== 'delete') return; setDeleting(true); router.delete(route('harvests.destroy', { harvest: activeModal.harvest.id }), { onFinish: () => { setDeleting(false); close(); } }); };
    const confirmableModal = activeModal?.type === 'confirm-edit' || activeModal?.type === 'delete' ? activeModal : null;

    return (
        <AuthenticatedLayout>
            <Head title="Harvests" />
            <div className="mx-auto max-w-7xl space-y-6 p-6 md:p-10 lg:px-10 lg:py-8">
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <Breadcrumbs items={[{ label: 'Home', href: '/' }, { label: 'Harvests' }]} />
                    <BeekeeperTabs active="harvests" />
                </div>
                <FlashAlerts key={flash?.id ?? 'harvest-flash'} flash={flash} />
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h3 className="text-lg font-bold text-amber-900">Harvest Records</h3>
                        <p className="text-sm text-amber-900/50">{harvests.total} record{harvests.total !== 1 ? 's' : ''} total</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="w-48"><SelectField value={filters.hive_id ?? ''} onChange={onHiveFilter} options={hiveFilterOptions(hives)} /></div>
                        <Button variant="primary" size="sm" onClick={() => setActiveModal({ type: 'create' })}><Plus className="mr-1 h-4 w-4" />Add Harvest</Button>
                    </div>
                </div>
                <Card className="overflow-hidden p-0">
                    <DataTable tableClassName="w-full text-sm" bodyClassName="divide-y divide-yellow-50" rowClassName="transition-colors hover:bg-yellow-50/30"
                        data={harvests.data} onRowClick={(_, index) => setActiveModal({ type: 'view', index })} emptyColSpan={7}
                        emptyState={<div className="px-6 py-10 text-center text-sm text-amber-900/40">No harvest records yet. Add one to get started.</div>}
                        columns={harvestColumns({ onEdit: openEdit, onDelete: (h) => setActiveModal({ type: 'delete', harvest: h }) })} />
                </Card>
                {harvests.last_page > 1 && (
                    <div className="flex items-center justify-center gap-1">
                        {harvests.links.map((link, i) => link.url
                            ? <Link key={i} href={link.url} className={`rounded-lg px-3 py-1.5 text-sm transition-colors ${link.active ? 'bg-amber-500 font-semibold text-white' : 'text-amber-900/70 hover:bg-yellow-100'}`} dangerouslySetInnerHTML={{ __html: link.label }} />
                            : <span key={i} className="px-3 py-1.5 text-sm text-amber-900/30" dangerouslySetInnerHTML={{ __html: link.label }} />
                        )}
                    </div>
                )}
            </div>

            <CreateHarvestModal isOpen={activeModal?.type === 'create'} hives={hives} colors={colors} flavors={flavors} form={createForm} onSubmit={submitCreate} onClose={close} />
            {activeModal?.type === 'view' && viewHarvest && (
                <ViewHarvestModal harvest={viewHarvest} harvestIndex={viewIndex!} totalHarvests={harvests.data.length} hasPrev={hasPrev} hasNext={hasNext}
                    onPrev={() => setActiveModal((p) => p?.type === 'view' && p.index > 0 ? { type: 'view', index: p.index - 1 } : p)}
                    onNext={() => setActiveModal((p) => p?.type === 'view' && p.index < harvests.data.length - 1 ? { type: 'view', index: p.index + 1 } : p)}
                    onEdit={() => { close(); openEdit(viewHarvest, true); }} onClose={close} />
            )}
            {activeModal?.type === 'edit' && (
                <EditHarvestModal isOpen instant={editInstant} hiveName={activeModal.harvest.hive?.name} colors={colors} flavors={flavors} form={editForm} onSubmit={openEditConfirm} onClose={() => { setEditInstant(false); close(); }} />
            )}
            <HarvestConfirmModals activeModal={confirmableModal} deleting={deleting} editProcessing={editForm.processing} onConfirmEdit={confirmEdit} onConfirmDelete={confirmDelete} onClose={close} />
        </AuthenticatedLayout>
    );
}
