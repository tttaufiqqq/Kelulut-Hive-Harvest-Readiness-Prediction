import { Head, Link, router } from '@inertiajs/react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useState, useEffect } from 'react';
import { Button } from '@/components/core/button';
import { Card } from '@/components/core/card';
import { Modal } from '@/components/core/modal';
import { SelectField } from '@/components/core/select-field';
import { AdminLayout } from '@/layouts/admin-layout';
import type { Harvest, PaginatedHarvests } from '@/types';

type ActiveModal = { type: 'view'; index: number } | null;

type Props = {
    harvests: PaginatedHarvests;
    stats:    { total: number; total_weight: number; avg_weight: number };
    hives:    { id: number; name: string }[];
    filters:  { hive_id?: string };
};

function ProductivityBadge({ level }: { level: Harvest['productivity_level'] }) {
    if (!level) return <span className="text-amber-900/30">—</span>;

    const styles: Record<string, string> = {
        Low:    'bg-rose-100 text-rose-700',
        Medium: 'bg-amber-100 text-amber-700',
        High:   'bg-emerald-100 text-emerald-700',
    };

    return (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${styles[level] ?? 'bg-gray-100 text-gray-500'}`}>
            {level}
        </span>
    );
}

export default function AdminHarvestsIndex({ harvests, stats, hives, filters }: Props) {
    const [activeModal, setActiveModal] = useState<ActiveModal>(null);
    const close = () => setActiveModal(null);

    const viewIndex   = activeModal?.type === 'view' ? activeModal.index : null;
    const viewHarvest = viewIndex !== null ? harvests.data[viewIndex] : null;
    const hasPrev     = viewIndex !== null && viewIndex > 0;
    const hasNext     = viewIndex !== null && viewIndex < harvests.data.length - 1;

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
                setActiveModal(prev => prev?.type === 'view' && prev.index < harvests.data.length - 1
                    ? { type: 'view', index: prev.index + 1 } : prev);
            }
        };
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, [viewIndex, harvests.data.length]);

    const hiveOptions = (items: { id: number; name: string }[]) => [
        { value: '', label: 'All Hives' },
        ...items.map(h => ({ value: String(h.id), label: h.name })),
    ];

    const onHiveFilter = (val: string) => {
        router.get(route('admin.harvests.index'), val ? { hive_id: val } : {}, { preserveState: true, replace: true });
    };

    return (
        <AdminLayout>
            <Head title="Harvests — Admin" />

            <div className="space-y-6">

                {/* Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card>
                        <p className="text-xs font-bold uppercase tracking-widest text-amber-900/40 mb-1">Total Records</p>
                        <p className="text-3xl font-black text-amber-900">{stats.total}</p>
                    </Card>
                    <Card>
                        <p className="text-xs font-bold uppercase tracking-widest text-amber-900/40 mb-1">Total Weight</p>
                        <p className="text-3xl font-black text-amber-900">{stats.total_weight} <span className="text-base font-medium">kg</span></p>
                    </Card>
                    <Card>
                        <p className="text-xs font-bold uppercase tracking-widest text-amber-900/40 mb-1">Avg per Harvest</p>
                        <p className="text-3xl font-black text-amber-900">{stats.avg_weight} <span className="text-base font-medium">kg</span></p>
                    </Card>
                </div>

                {/* Header */}
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h3 className="text-lg font-bold text-amber-900">All Harvest Records</h3>
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
                                    <th className="text-left px-6 py-3 text-xs font-bold uppercase tracking-widest text-amber-900/50">Weight (kg)</th>
                                    <th className="text-left px-6 py-3 text-xs font-bold uppercase tracking-widest text-amber-900/50 hidden md:table-cell">Productivity</th>
                                    <th className="text-left px-6 py-3 text-xs font-bold uppercase tracking-widest text-amber-900/50 hidden lg:table-cell">Color</th>
                                    <th className="text-left px-6 py-3 text-xs font-bold uppercase tracking-widest text-amber-900/50 hidden lg:table-cell">Flavor</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-yellow-50">
                                {harvests.data.length === 0 && (
                                    <tr>
                                        <td colSpan={7} className="px-6 py-10 text-center text-amber-900/40 text-sm">
                                            No harvest records yet.
                                        </td>
                                    </tr>
                                )}
                                {harvests.data.map((harvest, index) => (
                                    <tr key={harvest.id} className="hover:bg-yellow-50/30 transition-colors cursor-pointer" onClick={() => setActiveModal({ type: 'view', index })}>
                                        <td className="px-6 py-4 font-medium text-amber-950">{harvest.hive?.name ?? '—'}</td>
                                        <td className="px-6 py-4 text-amber-900/70 hidden md:table-cell">{harvest.beekeeper?.name ?? '—'}</td>
                                        <td className="px-6 py-4 text-amber-900/70">
                                            {new Date(harvest.harvest_date).toLocaleDateString()}
                                        </td>
                                        <td className="px-6 py-4 text-amber-900/70">{harvest.weight} kg</td>
                                        <td className="px-6 py-4 hidden md:table-cell">
                                            <ProductivityBadge level={harvest.productivity_level} />
                                        </td>
                                        <td className="px-6 py-4 text-amber-900/70 hidden lg:table-cell">{harvest.color?.name ?? '—'}</td>
                                        <td className="px-6 py-4 text-amber-900/70 hidden lg:table-cell">{harvest.flavor?.name ?? '—'}</td>
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

            {activeModal?.type === 'view' && viewHarvest && (
                <Modal isOpen onClose={close} title="Harvest Details" maxWidth="md">
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
                                {viewIndex! + 1} / {harvests.data.length}
                            </span>
                            <button
                                onClick={() => setActiveModal(prev => prev?.type === 'view' && prev.index < harvests.data.length - 1 ? { type: 'view', index: prev.index + 1 } : prev)}
                                disabled={!hasNext}
                                className="p-1.5 rounded-xl transition-colors hover:bg-yellow-100 disabled:opacity-20 disabled:cursor-not-allowed"
                            >
                                <ChevronRight className="w-4 h-4 text-amber-900" />
                            </button>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <p className="text-xs font-bold uppercase tracking-widest text-amber-900/40 mb-1">Hive</p>
                                <p className="font-medium text-amber-950">{viewHarvest.hive?.name ?? '—'}</p>
                            </div>
                            <div>
                                <p className="text-xs font-bold uppercase tracking-widest text-amber-900/40 mb-1">Beekeeper</p>
                                <p className="font-medium text-amber-950">{viewHarvest.beekeeper?.name ?? '—'}</p>
                            </div>
                            <div>
                                <p className="text-xs font-bold uppercase tracking-widest text-amber-900/40 mb-1">Date</p>
                                <p className="font-medium text-amber-950">
                                    {new Date(viewHarvest.harvest_date).toLocaleDateString()}
                                </p>
                            </div>
                            <div>
                                <p className="text-xs font-bold uppercase tracking-widest text-amber-900/40 mb-1">Weight</p>
                                <p className="font-medium text-amber-950">{viewHarvest.weight} kg</p>
                            </div>
                            <div>
                                <p className="text-xs font-bold uppercase tracking-widest text-amber-900/40 mb-1">Productivity</p>
                                <ProductivityBadge level={viewHarvest.productivity_level} />
                            </div>
                            <div>
                                <p className="text-xs font-bold uppercase tracking-widest text-amber-900/40 mb-1">Color</p>
                                <p className="font-medium text-amber-950">{viewHarvest.color?.name ?? '—'}</p>
                            </div>
                            <div>
                                <p className="text-xs font-bold uppercase tracking-widest text-amber-900/40 mb-1">Flavor</p>
                                <p className="font-medium text-amber-950">{viewHarvest.flavor?.name ?? '—'}</p>
                            </div>
                        </div>
                        {viewHarvest.notes && (
                            <div>
                                <p className="text-xs font-bold uppercase tracking-widest text-amber-900/40 mb-1">Notes</p>
                                <p className="text-sm text-amber-900/70 whitespace-pre-wrap">{viewHarvest.notes}</p>
                            </div>
                        )}
                        <p className="text-[10px] text-amber-900/25 text-center uppercase tracking-widest">Use arrow keys to navigate</p>
                        <div className="pt-2">
                            <Button type="button" variant="ghost" onClick={close} className="w-full">Close</Button>
                        </div>
                    </div>
                </Modal>
            )}
        </AdminLayout>
    );
}
