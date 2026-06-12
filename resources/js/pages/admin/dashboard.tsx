import { Head, router } from '@inertiajs/react';
import { AlertTriangle, Clock, TrendingUp, Users } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Card } from '@/components/core/display/card';
import { AdminLayout } from '@/layouts/admin-layout';
import { CrossSiteComparisonChart } from './dashboard/CrossSiteComparisonChart';
import { FleetHriLineChart } from './dashboard/FleetHriLineChart';
import { HiveMonitorGrid } from './dashboard/HiveMonitorGrid';
import { HiveMonitorModal } from './dashboard/HiveMonitorModal';
import { ProductivityRankingTable } from './dashboard/ProductivityRankingTable';
import { ReadinessSnapshot } from './dashboard/ReadinessSnapshot';
import { STATUS_TO_LEVEL, type CrossSiteItem, type FleetTrendItem, type HiveData, type ProductivityItem } from './dashboard/constants';

export type { HiveData };

type ReadinessSnapshotResponse = { has_data: boolean; data: { level: string; count: number }[] };

type Props = {
    stats: { total: number; pending: number; active: number };
    hives: HiveData[];
    productivityRanking: ProductivityItem[];
    crossSiteComparison: CrossSiteItem[];
    fleetHriTrend: FleetTrendItem[];
};

export default function AdminDashboard({ stats, hives = [], productivityRanking = [], crossSiteComparison = [], fleetHriTrend = [] }: Props) {
    const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
    const [mounted, setMounted] = useState(false);
    const [snapshotDate, setSnapshotDate] = useState<string | null>(null);
    const [snapshotData, setSnapshotData] = useState<{ level: string; count: number }[] | null>(null);
    const [snapshotLoading, setSnapshotLoading] = useState(false);
    const [monitorDate, setMonitorDate] = useState<string | null>(null);
    const [monitorData, setMonitorData] = useState<HiveData[] | null>(null);
    const [monitorLoading, setMonitorLoading] = useState(false);

    useEffect(() => { setMounted(true); }, []); // eslint-disable-line react-hooks/set-state-in-effect

    useEffect(() => {
        if (!snapshotDate) { setSnapshotData(null); return; } // eslint-disable-line react-hooks/set-state-in-effect
        let cancelled = false;
        setSnapshotLoading(true);
        fetch(`/admin/dashboard/readiness-snapshot?date=${snapshotDate}`, { headers: { Accept: 'application/json' } })
            .then((res) => res.json() as Promise<ReadinessSnapshotResponse>)
            .then((payload) => { if (!cancelled) setSnapshotData(payload.has_data ? payload.data : []); }) // eslint-disable-line react-hooks/set-state-in-effect
            .catch(() => { if (!cancelled) setSnapshotData([]); }) // eslint-disable-line react-hooks/set-state-in-effect
            .finally(() => { if (!cancelled) setSnapshotLoading(false); }); // eslint-disable-line react-hooks/set-state-in-effect
        return () => { cancelled = true; };
    }, [snapshotDate]);

    useEffect(() => {
        if (!monitorDate) { setMonitorData(null); return; } // eslint-disable-line react-hooks/set-state-in-effect
        let cancelled = false;
        setMonitorLoading(true);
        fetch(`/admin/dashboard/hive-monitor-snapshot?date=${monitorDate}`, { headers: { Accept: 'application/json' } })
            .then((res) => res.json() as Promise<{ has_data: boolean; data: HiveData[] }>)
            .then((payload) => { if (!cancelled) setMonitorData(payload.data); }) // eslint-disable-line react-hooks/set-state-in-effect
            .catch(() => { if (!cancelled) setMonitorData([]); }) // eslint-disable-line react-hooks/set-state-in-effect
            .finally(() => { if (!cancelled) setMonitorLoading(false); }); // eslint-disable-line react-hooks/set-state-in-effect
        return () => { cancelled = true; };
    }, [monitorDate]);

    const activeHives = monitorDate !== null ? (monitorData ?? []) : hives;
    const isMonitorLive = monitorDate === null;
    const sortedHives = [...activeHives].sort((a, b) => b.readiness - a.readiness);
    const selectedHive = selectedIndex !== null ? sortedHives[selectedIndex] : null;
    const readyCount = hives.filter((h) => h.status === 'ready').length;
    const alertCount = hives.filter((h) => h.status === 'alert').length;
    const hasPrev = selectedIndex !== null && selectedIndex > 0;
    const hasNext = selectedIndex !== null && selectedIndex < sortedHives.length - 1;
    const adminDonutData = useMemo(() => {
        const counts: Record<string, number> = {};
        for (const hive of hives) { const level = STATUS_TO_LEVEL[hive.status]; counts[level] = (counts[level] ?? 0) + 1; }
        return Object.entries(counts).map(([level, count]) => ({ level, count }));
    }, [hives]);
    const activeDonutData = snapshotDate !== null ? (snapshotData ?? []) : adminDonutData;
    const isLiveMode = snapshotDate === null;

    useEffect(() => {
        if (selectedIndex === null) return;
        const handler = (e: KeyboardEvent) => {
            if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') { e.preventDefault(); setSelectedIndex((prev) => prev !== null && prev > 0 ? prev - 1 : prev); }
            if (e.key === 'ArrowRight' || e.key === 'ArrowDown') { e.preventDefault(); setSelectedIndex((prev) => prev !== null && prev < sortedHives.length - 1 ? prev + 1 : prev); }
        };
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, [selectedIndex, sortedHives.length]);

    return (
        <AdminLayout>
            <Head title="Admin Dashboard" />
            <div className="space-y-6">
                <div className="flex flex-col gap-4">
                    <div className="flex items-center gap-2 px-1 text-xs font-bold tracking-widest text-amber-900/60 uppercase">
                        <Users className="h-3.5 w-3.5" />
                        <span>{stats.total} beekeepers</span>
                        <span className="opacity-30">·</span>
                        <span className="text-emerald-600">{stats.active} active</span>
                        <span className="opacity-30">·</span>
                        <span className="text-amber-600">{stats.pending} pending</span>
                    </div>
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                        <Card className="flex cursor-pointer items-start gap-4 border-l-4 border-l-red-400 transition-colors hover:bg-yellow-50/50" onClick={() => router.visit(route('admin.sensors.index'))}>
                            <div className="mt-1 shrink-0 rounded-2xl bg-red-100 p-3"><AlertTriangle className="h-5 w-5 text-red-500" /></div>
                            <div>
                                <p className="text-2xl font-black text-amber-950">{alertCount}</p>
                                <p className="text-xs font-bold tracking-widest text-amber-900/70 uppercase">Need Attention</p>
                                <p className="mt-0.5 text-xs text-amber-900/60">Hives with sensor readings exceeding safe thresholds today</p>
                            </div>
                        </Card>
                        <Card className="flex cursor-pointer items-start gap-4 border-l-4 border-l-emerald-400 transition-colors hover:bg-yellow-50/50" onClick={() => router.visit(route('admin.sensors.index'))}>
                            <div className="mt-1 shrink-0 rounded-2xl bg-emerald-100 p-3"><TrendingUp className="h-5 w-5 text-emerald-600" /></div>
                            <div>
                                <p className="text-2xl font-black text-amber-950">{readyCount}</p>
                                <p className="text-xs font-bold tracking-widest text-amber-900/70 uppercase">Ready to Harvest</p>
                                <p className="mt-0.5 text-xs text-amber-900/60">Hives predicted by ML model as ready for honey harvest today</p>
                            </div>
                        </Card>
                        <Card className="flex cursor-pointer items-start gap-4 border-l-4 border-l-amber-400 transition-colors hover:bg-yellow-50/50" onClick={() => router.visit(route('admin.beekeepers.index'))}>
                            <div className="mt-1 shrink-0 rounded-2xl bg-amber-100 p-3"><Clock className="h-5 w-5 text-amber-600" /></div>
                            <div>
                                <p className="text-2xl font-black text-amber-950">{stats.pending}</p>
                                <p className="text-xs font-bold tracking-widest text-amber-900/70 uppercase">Pending Invites</p>
                                <p className="mt-0.5 text-xs text-amber-900/60">Beekeeper accounts invited but not yet activated</p>
                            </div>
                        </Card>
                    </div>
                </div>

                <ReadinessSnapshot isLiveMode={isLiveMode} snapshotDate={snapshotDate} snapshotLoading={snapshotLoading} donutData={activeDonutData} onDateChange={setSnapshotDate} />
                <HiveMonitorGrid sortedHives={sortedHives} isMonitorLive={isMonitorLive} monitorDate={monitorDate} monitorLoading={monitorLoading} onSelect={setSelectedIndex} onDateChange={setMonitorDate} />
                <FleetHriLineChart data={fleetHriTrend} />
                <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                    <ProductivityRankingTable items={productivityRanking} mounted={mounted} />
                    <CrossSiteComparisonChart items={crossSiteComparison} productivityCount={productivityRanking.length} mounted={mounted} />
                </div>
            </div>

            <HiveMonitorModal hive={selectedHive} isOpen={selectedHive !== null} hasPrev={hasPrev} hasNext={hasNext} selectedIndex={selectedIndex} totalHives={sortedHives.length} onPrev={() => setSelectedIndex((prev) => prev! - 1)} onNext={() => setSelectedIndex((prev) => prev! + 1)} onClose={() => setSelectedIndex(null)} />
        </AdminLayout>
    );
}
