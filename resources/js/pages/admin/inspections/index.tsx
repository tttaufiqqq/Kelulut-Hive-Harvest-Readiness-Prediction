import { Head, Link, router } from '@inertiajs/react';
import { useState } from 'react';
import { Button } from '@/components/core/button';
import { Card } from '@/components/core/card';
import { Modal } from '@/components/core/modal';
import { SelectField } from '@/components/core/select-field';
import { AdminLayout } from '@/layouts/admin-layout';
import type { Inspection, MasterWeatherCondition, PaginatedInspections } from '@/types';

type Props = {
    inspections: PaginatedInspections;
    stats:       { total: number };
    hives:       { id: number; name: string }[];
    filters:     { hive_id?: string };
};

type ActiveModal = { type: 'view'; inspection: Inspection } | null;

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

function BloomingBadge({ status }: { status: Inspection['blooming_status'] }) {
    if (!status) return <span className="text-amber-900/30">—</span>;
    return (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${BLOOMING_STYLES[status] ?? 'bg-gray-100 text-gray-500'}`}>
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

export default function AdminInspectionsIndex({ inspections, stats, hives, filters }: Props) {
    const [activeModal, setActiveModal] = useState<ActiveModal>(null);
    const close = () => setActiveModal(null);

    const hiveOptions = (items: { id: number; name: string }[]) => [
        { value: '', label: 'All Hives' },
        ...items.map(h => ({ value: String(h.id), label: h.name })),
    ];

    const onHiveFilter = (val: string) => {
        router.get(route('admin.inspections.index'), val ? { hive_id: val } : {}, { preserveState: true, replace: true });
    };

    return (
        <AdminLayout>
            <Head title="Inspections — Admin" />

            <div className="space-y-6">

                {/* Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card>
                        <p className="text-xs font-bold uppercase tracking-widest text-amber-900/40 mb-1">Total Inspections</p>
                        <p className="text-3xl font-black text-amber-900">{stats.total}</p>
                    </Card>
                </div>

                {/* Header */}
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h3 className="text-lg font-bold text-amber-900">All Inspection Records</h3>
                        <p className="text-sm text-amber-900/50">{stats.total} record{stats.total !== 1 ? 's' : ''} across all beekeepers</p>
                    </div>
                    <div className="w-48">
                        <SelectField
                            value={filters.hive_id ?? ''}
                            onChange={onHiveFilter}
                            options={hiveOptions(hives)}
                        />
                    </div>
                </div>

                {/* Table */}
                <Card className="overflow-hidden p-0">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="bg-yellow-50/50 border-b border-yellow-100">
                                    <th className="text-left px-6 py-3 text-xs font-bold uppercase tracking-widest text-amber-900/50">Hive</th>
                                    <th className="text-left px-6 py-3 text-xs font-bold uppercase tracking-widest text-amber-900/50 hidden md:table-cell">Beekeeper</th>
                                    <th className="text-left px-6 py-3 text-xs font-bold uppercase tracking-widest text-amber-900/50">Date</th>
                                    <th className="text-left px-6 py-3 text-xs font-bold uppercase tracking-widest text-amber-900/50 hidden md:table-cell">Blooming</th>
                                    <th className="text-left px-6 py-3 text-xs font-bold uppercase tracking-widest text-amber-900/50 hidden lg:table-cell">Weather</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-yellow-50">
                                {inspections.data.length === 0 && (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-10 text-center text-amber-900/40 text-sm">
                                            No inspection records yet.
                                        </td>
                                    </tr>
                                )}
                                {inspections.data.map((inspection) => (
                                    <tr key={inspection.id} className="hover:bg-yellow-50/30 transition-colors cursor-pointer" onClick={() => setActiveModal({ type: 'view', inspection })}>
                                        <td className="px-6 py-4 font-medium text-amber-950">{inspection.hive?.name ?? '—'}</td>
                                        <td className="px-6 py-4 text-amber-900/70 hidden md:table-cell">{inspection.beekeeper?.name ?? '—'}</td>
                                        <td className="px-6 py-4 text-amber-900/70">
                                            {new Date(inspection.inspection_date).toLocaleDateString()}
                                        </td>
                                        <td className="px-6 py-4 hidden md:table-cell">
                                            <BloomingBadge status={inspection.blooming_status} />
                                        </td>
                                        <td className="px-6 py-4 hidden lg:table-cell">
                                            <WeatherPills conditions={inspection.weather_conditions} />
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

            {activeModal?.type === 'view' && (
                <Modal isOpen onClose={close} title="Inspection Details" maxWidth="md">
                    <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <p className="text-xs font-bold uppercase tracking-widest text-amber-900/40 mb-1">Hive</p>
                                <p className="font-medium text-amber-950">{activeModal.inspection.hive?.name ?? '—'}</p>
                            </div>
                            <div>
                                <p className="text-xs font-bold uppercase tracking-widest text-amber-900/40 mb-1">Beekeeper</p>
                                <p className="font-medium text-amber-950">{activeModal.inspection.beekeeper?.name ?? '—'}</p>
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
                                <p className="text-xs font-bold uppercase tracking-widest text-amber-900/40 mb-1">Vegetation Density</p>
                                <p className="font-medium text-amber-950 capitalize">{activeModal.inspection.vegetation_density ?? '—'}</p>
                            </div>
                            <div>
                                <p className="text-xs font-bold uppercase tracking-widest text-amber-900/40 mb-1">Nectar Availability</p>
                                <p className="font-medium text-amber-950 capitalize">{activeModal.inspection.nectar_source_availability ?? '—'}</p>
                            </div>
                            <div>
                                <p className="text-xs font-bold uppercase tracking-widest text-amber-900/40 mb-1">Structural Damage</p>
                                <p className="font-medium text-amber-950 capitalize">{activeModal.inspection.structural_damage ?? '—'}</p>
                            </div>
                        </div>
                        <div>
                            <p className="text-xs font-bold uppercase tracking-widest text-amber-900/40 mb-1">Weather Conditions</p>
                            <WeatherPills conditions={activeModal.inspection.weather_conditions} />
                        </div>
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
                        <div className="pt-2">
                            <Button type="button" variant="ghost" onClick={close} className="w-full">Close</Button>
                        </div>
                    </div>
                </Modal>
            )}
        </AdminLayout>
    );
}
