import { Head, Link, router, useForm, usePage } from '@inertiajs/react';
import { Plus } from 'lucide-react';
import { useEffect, useState } from 'react';
import { DataTable } from '@/components/core/data/content';
import { Button } from '@/components/core/display/button';
import { Card } from '@/components/core/display/card';
import { FlashAlerts } from '@/components/core/feedback/flash-alerts';
import type { FlashMessageBag } from '@/components/core/feedback/flash-alerts';
import { SelectField } from '@/components/core/form/select-field';
import { BeekeeperTabs } from '@/components/core/navigation/beekeeper-tabs';
import { Breadcrumbs } from '@/components/core/navigation/navigation';
import { AuthenticatedLayout } from '@/layouts/authenticated-layout';
import type { Inspection, MasterFloraType, MasterWeatherCondition, PaginatedInspections } from '@/types';
import { emptyCreate, hiveFilterOptions, toMultiIds } from './constants';
import type { InspectionCreateFormData, InspectionEditFormData } from './constants';
import { CreateInspectionModal } from './CreateInspectionModal';
import { EditInspectionModal } from './EditInspectionModal';
import { InspectionConfirmModals } from './InspectionConfirmModals';
import { inspectionColumns } from './InspectionTableRow';
import { ViewInspectionModal } from './ViewInspectionModal';

type ActiveModal =
    | { type: 'create' }
    | { type: 'view'; index: number }
    | { type: 'edit'; inspection: Inspection }
    | { type: 'confirm-edit'; inspection: Inspection }
    | { type: 'delete'; inspection: Inspection }
    | null;

type Props = {
    inspections: PaginatedInspections;
    hives: { id: number; name: string }[];
    weatherConditions: MasterWeatherCondition[];
    floraTypes: MasterFloraType[];
    filters: { hive_id?: string };
};

export default function InspectionsIndex({ inspections, hives, weatherConditions, floraTypes, filters }: Props) {
    const { props } = usePage<{ flash?: FlashMessageBag }>();
    const flash = props.flash;
    const [activeModal, setActiveModal] = useState<ActiveModal>(null);
    const [deleting, setDeleting] = useState(false);
    const [editInstant, setEditInstant] = useState(false);
    const close = () => setActiveModal(null);
    const viewIndex = activeModal?.type === 'view' ? activeModal.index : null;
    const viewInspection = viewIndex !== null ? inspections.data[viewIndex] : null;
    const hasPrev = viewIndex !== null && viewIndex > 0;
    const hasNext = viewIndex !== null && viewIndex < inspections.data.length - 1;

    const [createWeatherIds, setCreateWeatherIds] = useState<number[]>([]);
    const [createFloraIds, setCreateFloraIds] = useState<number[]>([]);
    const [editWeatherIds, setEditWeatherIds] = useState<number[]>([]);
    const [editFloraIds, setEditFloraIds] = useState<number[]>([]);

    useEffect(() => {
        if (viewIndex === null) {
return;
}

        const handler = (e: KeyboardEvent) => {
            if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
 e.preventDefault(); setActiveModal((p) => p?.type === 'view' && p.index > 0 ? { type: 'view', index: p.index - 1 } : p); 
}

            if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
 e.preventDefault(); setActiveModal((p) => p?.type === 'view' && p.index < inspections.data.length - 1 ? { type: 'view', index: p.index + 1 } : p); 
}
        };
        window.addEventListener('keydown', handler);

        return () => window.removeEventListener('keydown', handler);
    }, [viewIndex, inspections.data.length]);

    const createForm = useForm<InspectionCreateFormData>({ ...emptyCreate, weather_ids: [], flora_ids: [] });
    const editForm = useForm<InspectionEditFormData>({ inspection_date: '', blooming_status: '', vegetation_density: '', nectar_source_availability: '', structural_damage: '', food_source_observation: '', notes: '', weather_ids: [], flora_ids: [] });

    const openEdit = (inspection: Inspection, instant = false) => {
        setEditInstant(instant);
        editForm.setData({ inspection_date: inspection.inspection_date.slice(0, 10), blooming_status: inspection.blooming_status ?? '', vegetation_density: inspection.vegetation_density ?? '', nectar_source_availability: inspection.nectar_source_availability ?? '', structural_damage: inspection.structural_damage ?? '', food_source_observation: inspection.food_source_observation ?? '', notes: inspection.notes ?? '', weather_ids: toMultiIds(inspection.weather_conditions), flora_ids: toMultiIds(inspection.flora_types) });
        setEditWeatherIds(toMultiIds(inspection.weather_conditions));
        setEditFloraIds(toMultiIds(inspection.flora_types));
        setActiveModal({ type: 'edit', inspection });
    };
    const submitCreate = (e: React.FormEvent) => {
        e.preventDefault();
        createForm.transform((data) => ({ ...data, weather_ids: createWeatherIds, flora_ids: createFloraIds }));
        createForm.post(route('inspections.store'), { onSuccess: () => {
 createForm.reset(); setCreateWeatherIds([]); setCreateFloraIds([]); close(); 
} });
    };
    const openEditConfirm = () => {
 if (activeModal?.type === 'edit') {
setActiveModal({ type: 'confirm-edit', inspection: activeModal.inspection });
} 
};
    const confirmEdit = () => {
        if (activeModal?.type !== 'confirm-edit') {
return;
}

        editForm.transform((data) => ({ ...data, weather_ids: editWeatherIds, flora_ids: editFloraIds }));
        editForm.patch(route('inspections.update', { inspection: activeModal.inspection.id }), { onSuccess: close });
    };
    const confirmDelete = () => {
 if (activeModal?.type !== 'delete') {
return;
}

 setDeleting(true); router.delete(route('inspections.destroy', { inspection: activeModal.inspection.id }), { onFinish: () => {
 setDeleting(false); close(); 
} }); 
};
    const onHiveFilter = (val: string) => router.get(route('inspections.index'), val ? { hive_id: val } : {}, { preserveState: true, replace: true });
    const confirmableModal = activeModal?.type === 'confirm-edit' || activeModal?.type === 'delete' ? activeModal : null;

    return (
        <AuthenticatedLayout>
            <Head title="Inspections" />
            <div className="mx-auto max-w-7xl space-y-6 p-6 md:p-10 lg:px-10 lg:py-8">
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <Breadcrumbs items={[{ label: 'Home', href: '/' }, { label: 'Inspections' }]} />
                    <BeekeeperTabs active="inspections" />
                </div>
                <FlashAlerts key={flash?.id ?? 'inspection-flash'} flash={flash} />
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h3 className="text-lg font-bold text-amber-900">Inspection Records</h3>
                        <p className="text-sm text-amber-900/50">{inspections.total} record{inspections.total !== 1 ? 's' : ''} total</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="w-48"><SelectField value={filters.hive_id ?? ''} onChange={onHiveFilter} options={hiveFilterOptions(hives)} /></div>
                        <Button variant="primary" size="sm" onClick={() => setActiveModal({ type: 'create' })}><Plus className="mr-1 h-4 w-4" />Add Inspection</Button>
                    </div>
                </div>
                <Card className="overflow-hidden p-0">
                    <DataTable tableClassName="w-full text-sm" bodyClassName="divide-y divide-yellow-50" rowClassName="transition-colors hover:bg-yellow-50/30"
                        data={inspections.data} onRowClick={(_, index) => setActiveModal({ type: 'view', index })} emptyColSpan={5}
                        emptyState={<div className="px-6 py-10 text-center text-sm text-amber-900/40">No inspection records yet. Add one to get started.</div>}
                        columns={inspectionColumns({ onEdit: openEdit, onDelete: (i) => setActiveModal({ type: 'delete', inspection: i }) })} />
                </Card>
                {inspections.last_page > 1 && (
                    <div className="flex items-center justify-center gap-1">
                        {inspections.links.map((link, i) => link.url
                            ? <Link key={i} href={link.url} className={`rounded-lg px-3 py-1.5 text-sm transition-colors ${link.active ? 'bg-amber-500 font-semibold text-white' : 'text-amber-900/70 hover:bg-yellow-100'}`} dangerouslySetInnerHTML={{ __html: link.label }} />
                            : <span key={i} className="px-3 py-1.5 text-sm text-amber-900/30" dangerouslySetInnerHTML={{ __html: link.label }} />
                        )}
                    </div>
                )}
            </div>

            <CreateInspectionModal isOpen={activeModal?.type === 'create'} hives={hives} weatherConditions={weatherConditions} floraTypes={floraTypes} form={createForm} createWeatherIds={createWeatherIds} createFloraIds={createFloraIds} onWeatherChange={setCreateWeatherIds} onFloraChange={setCreateFloraIds} onSubmit={submitCreate} onClose={close} />
            {activeModal?.type === 'view' && viewInspection && (
                <ViewInspectionModal inspection={viewInspection} inspectionIndex={viewIndex!} totalInspections={inspections.data.length} hasPrev={hasPrev} hasNext={hasNext}
                    onPrev={() => setActiveModal((p) => p?.type === 'view' && p.index > 0 ? { type: 'view', index: p.index - 1 } : p)}
                    onNext={() => setActiveModal((p) => p?.type === 'view' && p.index < inspections.data.length - 1 ? { type: 'view', index: p.index + 1 } : p)}
                    onEdit={() => {
 close(); openEdit(viewInspection, true); 
}} onClose={close} />
            )}
            {activeModal?.type === 'edit' && (
                <EditInspectionModal isOpen instant={editInstant} hiveName={activeModal.inspection.hive?.name} weatherConditions={weatherConditions} floraTypes={floraTypes} form={editForm} editWeatherIds={editWeatherIds} editFloraIds={editFloraIds} onWeatherChange={setEditWeatherIds} onFloraChange={setEditFloraIds} onSubmit={openEditConfirm} onClose={() => {
 setEditInstant(false); close(); 
}} />
            )}
            <InspectionConfirmModals activeModal={confirmableModal} deleting={deleting} editProcessing={editForm.processing} instant={editInstant} onConfirmEdit={confirmEdit} onConfirmDelete={confirmDelete} onClose={close} />
        </AuthenticatedLayout>
    );
}
