import { Head, Link, router } from '@inertiajs/react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useState, useEffect } from 'react';
import { Button } from '@/components/core/button';
import { Card } from '@/components/core/card';
import { Modal } from '@/components/core/modal';
import { SelectField } from '@/components/core/select-field';
import { AdminLayout } from '@/layouts/admin-layout';
import { fmtDate } from '@/lib/format';
import type { Harvest, PaginatedHarvests } from '@/types';

type ActiveModal = { type: 'view'; index: number } | null;

type Props = {
    harvests: PaginatedHarvests;
    stats: { total: number; total_weight: number; avg_weight: number };
    hives: { id: number; name: string }[];
    filters: { hive_id?: string; productivity?: string };
};

function ProductivityBadge({
    level,
}: {
    level: Harvest['productivity_level'];
}) {
    if (!level) {
        return <span className="text-amber-900/30">—</span>;
    }

    const key = level.toLowerCase();
    const styles: Record<string, string> = {
        low: 'bg-rose-100 text-rose-700',
        medium: 'bg-amber-100 text-amber-700',
        high: 'bg-emerald-100 text-emerald-700',
    };
    const label = key.charAt(0).toUpperCase() + key.slice(1);

    return (
        <span
            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-bold ${styles[key] ?? 'bg-gray-100 text-gray-500'}`}
        >
            {label}
        </span>
    );
}

export default function AdminHarvestsIndex({
    harvests,
    stats,
    hives,
    filters,
}: Props) {
    const [activeModal, setActiveModal] = useState<ActiveModal>(null);
    const close = () => setActiveModal(null);

    const viewIndex = activeModal?.type === 'view' ? activeModal.index : null;
    const viewHarvest = viewIndex !== null ? harvests.data[viewIndex] : null;
    const hasPrev = viewIndex !== null && viewIndex > 0;
    const hasNext = viewIndex !== null && viewIndex < harvests.data.length - 1;

    useEffect(() => {
        if (viewIndex === null) {
            return;
        }

        const handler = (e: KeyboardEvent) => {
            if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
                e.preventDefault();
                setActiveModal((prev) =>
                    prev?.type === 'view' && prev.index > 0
                        ? { type: 'view', index: prev.index - 1 }
                        : prev,
                );
            }

            if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
                e.preventDefault();
                setActiveModal((prev) =>
                    prev?.type === 'view' &&
                    prev.index < harvests.data.length - 1
                        ? { type: 'view', index: prev.index + 1 }
                        : prev,
                );
            }
        };
        window.addEventListener('keydown', handler);

        return () => window.removeEventListener('keydown', handler);
    }, [viewIndex, harvests.data.length]);

    const applyFilters = (patch: Partial<typeof filters>) => {
        const next = { ...filters, ...patch };
        const params: Record<string, string> = {};

        if (next.hive_id) {
            params.hive_id = next.hive_id;
        }

        if (next.productivity) {
            params.productivity = next.productivity;
        }

        router.get(route('admin.harvests.index'), params, {
            preserveState: true,
            replace: true,
        });
    };

    return (
        <AdminLayout>
            <Head title="Harvests — Admin" />

            <div className="space-y-6">
                {/* Stats */}
                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                    <Card>
                        <p className="mb-1 text-xs font-bold tracking-widest text-amber-900/40 uppercase">
                            Total Records
                        </p>
                        <p className="text-3xl font-black text-amber-900">
                            {stats.total}
                        </p>
                    </Card>
                    <Card>
                        <p className="mb-1 text-xs font-bold tracking-widest text-amber-900/40 uppercase">
                            Total Weight
                        </p>
                        <p className="text-3xl font-black text-amber-900">
                            {stats.total_weight}{' '}
                            <span className="text-base font-medium">kg</span>
                        </p>
                    </Card>
                    <Card>
                        <p className="mb-1 text-xs font-bold tracking-widest text-amber-900/40 uppercase">
                            Avg per Harvest
                        </p>
                        <p className="text-3xl font-black text-amber-900">
                            {stats.avg_weight}{' '}
                            <span className="text-base font-medium">kg</span>
                        </p>
                    </Card>
                </div>

                {/* Header */}
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h3 className="text-lg font-bold text-amber-900">
                            All Harvest Records
                        </h3>
                        <p className="text-sm text-amber-900/50">
                            {stats.total} record{stats.total !== 1 ? 's' : ''}{' '}
                            across all beekeepers
                        </p>
                    </div>
                    <div className="flex gap-2">
                        <div className="w-44">
                            <SelectField
                                value={filters.hive_id ?? ''}
                                onChange={(val) =>
                                    applyFilters({ hive_id: val })
                                }
                                options={[
                                    { value: '', label: 'All Hives' },
                                    ...hives.map((h) => ({
                                        value: String(h.id),
                                        label: h.name,
                                    })),
                                ]}
                            />
                        </div>
                        <div className="w-36">
                            <SelectField
                                value={filters.productivity ?? ''}
                                onChange={(val) =>
                                    applyFilters({ productivity: val })
                                }
                                options={[
                                    { value: '', label: 'All Productivity' },
                                    { value: 'high', label: 'High' },
                                    { value: 'medium', label: 'Medium' },
                                    { value: 'low', label: 'Low' },
                                ]}
                            />
                        </div>
                    </div>
                </div>

                {/* Table */}
                <Card className="overflow-hidden p-0">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-yellow-100 bg-yellow-50/50">
                                    <th className="px-6 py-3 text-left text-xs font-bold tracking-widest text-amber-900/50 uppercase">
                                        Hive
                                    </th>
                                    <th className="hidden px-6 py-3 text-left text-xs font-bold tracking-widest text-amber-900/50 uppercase md:table-cell">
                                        Beekeeper
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-bold tracking-widest text-amber-900/50 uppercase">
                                        Date
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-bold tracking-widest text-amber-900/50 uppercase">
                                        Weight (kg)
                                    </th>
                                    <th className="hidden px-6 py-3 text-left text-xs font-bold tracking-widest text-amber-900/50 uppercase md:table-cell">
                                        Productivity
                                    </th>
                                    <th className="hidden px-6 py-3 text-left text-xs font-bold tracking-widest text-amber-900/50 uppercase lg:table-cell">
                                        Color
                                    </th>
                                    <th className="hidden px-6 py-3 text-left text-xs font-bold tracking-widest text-amber-900/50 uppercase lg:table-cell">
                                        Flavor
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-yellow-50">
                                {harvests.data.length === 0 && (
                                    <tr>
                                        <td
                                            colSpan={7}
                                            className="px-6 py-10 text-center text-sm text-amber-900/40"
                                        >
                                            No harvest records yet.
                                        </td>
                                    </tr>
                                )}
                                {harvests.data.map((harvest, index) => (
                                    <tr
                                        key={harvest.id}
                                        className="cursor-pointer transition-colors hover:bg-yellow-50/30"
                                        onClick={() =>
                                            setActiveModal({
                                                type: 'view',
                                                index,
                                            })
                                        }
                                    >
                                        <td className="px-6 py-4 font-medium text-amber-950">
                                            {harvest.hive?.name ?? '—'}
                                        </td>
                                        <td className="hidden px-6 py-4 text-amber-900/70 md:table-cell">
                                            {harvest.beekeeper?.name ?? '—'}
                                        </td>
                                        <td className="px-6 py-4 text-amber-900/70">
                                            {fmtDate(harvest.harvest_date)}
                                        </td>
                                        <td className="px-6 py-4 text-amber-900/70">
                                            {harvest.weight} kg
                                        </td>
                                        <td className="hidden px-6 py-4 md:table-cell">
                                            <ProductivityBadge
                                                level={
                                                    harvest.productivity_level
                                                }
                                            />
                                        </td>
                                        <td className="hidden px-6 py-4 text-amber-900/70 lg:table-cell">
                                            {harvest.color?.name ?? '—'}
                                        </td>
                                        <td className="hidden px-6 py-4 text-amber-900/70 lg:table-cell">
                                            {harvest.flavor?.name ?? '—'}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </Card>

                {/* Pagination */}
                {harvests.last_page > 1 && (
                    <div className="flex items-center justify-center gap-1">
                        {harvests.links.map((link, i) =>
                            link.url ? (
                                <Link
                                    key={i}
                                    href={link.url}
                                    className={`rounded-lg px-3 py-1.5 text-sm transition-colors ${
                                        link.active
                                            ? 'bg-amber-500 font-semibold text-white'
                                            : 'text-amber-900/70 hover:bg-yellow-100'
                                    }`}
                                    dangerouslySetInnerHTML={{
                                        __html: link.label,
                                    }}
                                />
                            ) : (
                                <span
                                    key={i}
                                    className="px-3 py-1.5 text-sm text-amber-900/30"
                                    dangerouslySetInnerHTML={{
                                        __html: link.label,
                                    }}
                                />
                            ),
                        )}
                    </div>
                )}
            </div>

            {activeModal?.type === 'view' && viewHarvest && (
                <Modal
                    isOpen
                    onClose={close}
                    title="Harvest Details"
                    maxWidth="md"
                >
                    <div className="space-y-4">
                        <div className="-mt-1 mb-1 flex items-center justify-end gap-1">
                            <button
                                onClick={() =>
                                    setActiveModal((prev) =>
                                        prev?.type === 'view' && prev.index > 0
                                            ? {
                                                  type: 'view',
                                                  index: prev.index - 1,
                                              }
                                            : prev,
                                    )
                                }
                                disabled={!hasPrev}
                                className="rounded-xl p-1.5 transition-colors hover:bg-yellow-100 disabled:cursor-not-allowed disabled:opacity-20"
                            >
                                <ChevronLeft className="h-4 w-4 text-amber-900" />
                            </button>
                            <span className="min-w-[3rem] text-center text-xs font-bold text-amber-900/40 tabular-nums">
                                {viewIndex! + 1} / {harvests.data.length}
                            </span>
                            <button
                                onClick={() =>
                                    setActiveModal((prev) =>
                                        prev?.type === 'view' &&
                                        prev.index < harvests.data.length - 1
                                            ? {
                                                  type: 'view',
                                                  index: prev.index + 1,
                                              }
                                            : prev,
                                    )
                                }
                                disabled={!hasNext}
                                className="rounded-xl p-1.5 transition-colors hover:bg-yellow-100 disabled:cursor-not-allowed disabled:opacity-20"
                            >
                                <ChevronRight className="h-4 w-4 text-amber-900" />
                            </button>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <p className="mb-1 text-xs font-bold tracking-widest text-amber-900/40 uppercase">
                                    Hive
                                </p>
                                <p className="font-medium text-amber-950">
                                    {viewHarvest.hive?.name ?? '—'}
                                </p>
                            </div>
                            <div>
                                <p className="mb-1 text-xs font-bold tracking-widest text-amber-900/40 uppercase">
                                    Beekeeper
                                </p>
                                <p className="font-medium text-amber-950">
                                    {viewHarvest.beekeeper?.name ?? '—'}
                                </p>
                            </div>
                            <div>
                                <p className="mb-1 text-xs font-bold tracking-widest text-amber-900/40 uppercase">
                                    Date
                                </p>
                                <p className="font-medium text-amber-950">
                                    {fmtDate(viewHarvest.harvest_date)}
                                </p>
                            </div>
                            <div>
                                <p className="mb-1 text-xs font-bold tracking-widest text-amber-900/40 uppercase">
                                    Weight
                                </p>
                                <p className="font-medium text-amber-950">
                                    {viewHarvest.weight} kg
                                </p>
                            </div>
                            <div>
                                <p className="mb-1 text-xs font-bold tracking-widest text-amber-900/40 uppercase">
                                    Productivity
                                </p>
                                <ProductivityBadge
                                    level={viewHarvest.productivity_level}
                                />
                            </div>
                            <div>
                                <p className="mb-1 text-xs font-bold tracking-widest text-amber-900/40 uppercase">
                                    Color
                                </p>
                                <p className="font-medium text-amber-950">
                                    {viewHarvest.color?.name ?? '—'}
                                </p>
                            </div>
                            <div>
                                <p className="mb-1 text-xs font-bold tracking-widest text-amber-900/40 uppercase">
                                    Flavor
                                </p>
                                <p className="font-medium text-amber-950">
                                    {viewHarvest.flavor?.name ?? '—'}
                                </p>
                            </div>
                        </div>
                        {viewHarvest.notes && (
                            <div>
                                <p className="mb-1 text-xs font-bold tracking-widest text-amber-900/40 uppercase">
                                    Notes
                                </p>
                                <p className="text-sm whitespace-pre-wrap text-amber-900/70">
                                    {viewHarvest.notes}
                                </p>
                            </div>
                        )}
                        <p className="text-center text-[10px] tracking-widest text-amber-900/25 uppercase">
                            Use arrow keys to navigate
                        </p>
                        <div className="pt-2">
                            <Button
                                type="button"
                                variant="ghost"
                                onClick={close}
                                className="w-full"
                            >
                                Close
                            </Button>
                        </div>
                    </div>
                </Modal>
            )}
        </AdminLayout>
    );
}
