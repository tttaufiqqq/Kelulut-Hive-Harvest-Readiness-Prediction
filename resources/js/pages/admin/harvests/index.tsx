import { Head, Link } from '@inertiajs/react';
import { Card } from '@/components/core/card';
import { AdminLayout } from '@/layouts/admin-layout';
import type { Harvest, PaginatedHarvests } from '@/types';

type Props = {
    harvests: PaginatedHarvests;
    stats: { total: number; total_weight: number; avg_weight: number };
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

export default function AdminHarvestsIndex({ harvests, stats }: Props) {
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
                <div>
                    <h3 className="text-lg font-bold text-amber-900">All Harvest Records</h3>
                    <p className="text-sm text-amber-900/50">{stats.total} record{stats.total !== 1 ? 's' : ''} across all beekeepers</p>
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
                                {harvests.data.map((harvest) => (
                                    <tr key={harvest.id} className="hover:bg-yellow-50/30 transition-colors">
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
        </AdminLayout>
    );
}
