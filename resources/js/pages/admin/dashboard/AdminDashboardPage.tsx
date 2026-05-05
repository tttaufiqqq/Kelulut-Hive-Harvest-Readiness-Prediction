import { Head, router } from '@inertiajs/react';
import {
    TrendingUp,
    AlertTriangle,
    Clock,
    Users,
    Thermometer,
    Droplets,
    Wind,
    ChevronLeft,
    ChevronRight,
} from 'lucide-react';
import { useState, useEffect } from 'react';
import {
    ResponsiveContainer,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
} from 'recharts';
import { Card } from '@/components/core/card';
import { Modal } from '@/components/core/modal';
import { AdminLayout } from '@/layouts/admin-layout';

// ── Types ──────────────────────────────────────────────────────────────
export type HiveData = {
    id: string;
    hive_name: string;
    beekeeper: string;
    species: string;
    weight: number;
    temp: number;
    humidity: number;
    co2: number;
    readiness: number;
    status: 'ready' | 'growing' | 'alert' | 'offline' | 'no_data';
    last_reading: string | null;
};

type ProductivityItem = {
    hive_name: string;
    beekeeper: string;
    total_weight: number;
    harvest_count: number;
};

type CrossSiteItem = {
    site_name: string;
    avg_hri_pct: number;
    total_weight: number;
    hive_count: number;
};

// ── Props ──────────────────────────────────────────────────────────────
type Props = {
    stats: {
        total: number;
        pending: number;
        active: number;
    };
    hives: HiveData[];
    productivityRanking: ProductivityItem[];
    crossSiteComparison: CrossSiteItem[];
};

// ── Display constants ──────────────────────────────────────────────────
const STATUS_BADGE: Record<HiveData['status'], string> = {
    ready: 'bg-emerald-100 text-emerald-700',
    growing: 'bg-yellow-100 text-yellow-700',
    alert: 'bg-red-100 text-red-700',
    offline: 'bg-gray-100 text-gray-500',
    no_data: 'bg-slate-100 text-slate-400',
};

const READINESS_LABEL: Record<HiveData['status'], string> = {
    ready: 'Ready to Harvest',
    growing: 'Approaching Readiness',
    alert: 'Needs Attention',
    offline: 'Sensor Offline',
    no_data: 'No Data Today',
};

const STATUS_LABEL: Record<HiveData['status'], string> = {
    ready: 'Ready',
    growing: 'Growing',
    alert: 'Alert',
    offline: 'Offline',
    no_data: 'No Data',
};

// ── Sensor warning thresholds ──────────────────────────────────────────
const WARN_TEMP_ABOVE = 35; // °C
const WARN_HUMID_ABOVE = 85; // %
const WARN_CO2_ABOVE = 800; // ADC (MQ135)

// ── Helpers ────────────────────────────────────────────────────────────
function formatLastReading(ts: string | null): string {
    if (!ts) {
        return '—';
    }

    const date = new Date(ts);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffDays === 0) {
        return `Today ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    }

    if (diffDays === 1) {
        return 'Yesterday';
    }

    return `${diffDays} days ago`;
}

// ── AdminDashboard ─────────────────────────────────────────────────────
export default function AdminDashboard({
    stats,
    hives = [],
    productivityRanking = [],
    crossSiteComparison = [],
}: Props) {
    const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setMounted(true);
    }, []);

    const sortedHives = [...hives].sort((a, b) => b.readiness - a.readiness);
    const selectedHive =
        selectedIndex !== null ? sortedHives[selectedIndex] : null;

    const readyCount = hives.filter((h) => h.status === 'ready').length;
    const alertCount = hives.filter((h) => h.status === 'alert').length;

    const hasPrev = selectedIndex !== null && selectedIndex > 0;
    const hasNext =
        selectedIndex !== null && selectedIndex < sortedHives.length - 1;

    useEffect(() => {
        if (selectedIndex === null) {
            return;
        }

        const handler = (e: KeyboardEvent) => {
            if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
                e.preventDefault();
                setSelectedIndex((prev) =>
                    prev !== null && prev > 0 ? prev - 1 : prev,
                );
            }

            if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
                e.preventDefault();
                setSelectedIndex((prev) =>
                    prev !== null && prev < sortedHives.length - 1
                        ? prev + 1
                        : prev,
                );
            }
        };
        window.addEventListener('keydown', handler);

        return () => window.removeEventListener('keydown', handler);
    }, [selectedIndex, sortedHives.length]);

    return (
        <AdminLayout>
            <Head title="Admin Dashboard — BuzzyHive 2.0" />

            <div className="space-y-6">
                {/* ── Action Cards ───────────────────────────────────────── */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                    <Card
                        className="flex cursor-pointer items-center gap-4 border-l-4 border-l-red-400 transition-colors hover:bg-yellow-50/50"
                        onClick={() =>
                            router.visit(route('admin.sensors.index'))
                        }
                    >
                        <div className="shrink-0 rounded-2xl bg-red-100 p-3">
                            <AlertTriangle className="h-5 w-5 text-red-500" />
                        </div>
                        <div>
                            <p className="text-2xl font-black text-amber-950">
                                {alertCount}
                            </p>
                            <p className="text-xs font-bold tracking-widest text-amber-900/50 uppercase">
                                Need Attention
                            </p>
                        </div>
                    </Card>

                    <Card
                        className="flex cursor-pointer items-center gap-4 border-l-4 border-l-emerald-400 transition-colors hover:bg-yellow-50/50"
                        onClick={() =>
                            router.visit(route('admin.sensors.index'))
                        }
                    >
                        <div className="shrink-0 rounded-2xl bg-emerald-100 p-3">
                            <TrendingUp className="h-5 w-5 text-emerald-600" />
                        </div>
                        <div>
                            <p className="text-2xl font-black text-amber-950">
                                {readyCount}
                            </p>
                            <p className="text-xs font-bold tracking-widest text-amber-900/50 uppercase">
                                Ready to Harvest
                            </p>
                        </div>
                    </Card>

                    <Card
                        className="flex cursor-pointer items-center gap-4 border-l-4 border-l-amber-400 transition-colors hover:bg-yellow-50/50"
                        onClick={() =>
                            router.visit(route('admin.beekeepers.index'))
                        }
                    >
                        <div className="shrink-0 rounded-2xl bg-amber-100 p-3">
                            <Clock className="h-5 w-5 text-amber-600" />
                        </div>
                        <div>
                            <p className="text-2xl font-black text-amber-950">
                                {stats.pending}
                            </p>
                            <p className="text-xs font-bold tracking-widest text-amber-900/50 uppercase">
                                Pending Invites
                            </p>
                        </div>
                    </Card>
                </div>

                {/* ── Live Hive Monitor ──────────────────────────────────── */}
                <Card className="overflow-hidden p-0">
                    <div className="px-4 pt-4 pb-2">
                        <h3 className="text-sm font-black tracking-widest text-amber-900/60 uppercase">
                            Live Hive Monitor
                        </h3>
                    </div>
                    {hives.length === 0 ? (
                        <p className="px-4 py-6 text-center text-sm text-amber-900/40">
                            No hives registered yet.
                        </p>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b border-yellow-100">
                                        <th className="px-3 py-2 text-left text-xs font-bold tracking-widest text-amber-900/40 uppercase">
                                            #
                                        </th>
                                        <th className="px-3 py-2 text-left text-xs font-bold tracking-widest text-amber-900/40 uppercase">
                                            Hive
                                        </th>
                                        <th className="hidden px-3 py-2 text-left text-xs font-bold tracking-widest text-amber-900/40 uppercase sm:table-cell">
                                            Beekeeper
                                        </th>
                                        <th className="hidden px-3 py-2 text-left text-xs font-bold tracking-widest text-amber-900/40 uppercase md:table-cell">
                                            Species
                                        </th>
                                        <th className="hidden px-3 py-2 text-center text-xs font-bold tracking-widest text-amber-900/40 uppercase md:table-cell">
                                            <Thermometer className="mr-1 inline h-3 w-3" />
                                            Temp
                                        </th>
                                        <th className="hidden px-3 py-2 text-center text-xs font-bold tracking-widest text-amber-900/40 uppercase md:table-cell">
                                            <Droplets className="mr-1 inline h-3 w-3" />
                                            Humid
                                        </th>
                                        <th className="hidden px-3 py-2 text-center text-xs font-bold tracking-widest text-amber-900/40 uppercase md:table-cell">
                                            <Wind className="mr-1 inline h-3 w-3" />
                                            MQ135
                                        </th>
                                        <th className="hidden px-3 py-2 text-center text-xs font-bold tracking-widest text-amber-900/40 uppercase md:table-cell">
                                            HRI
                                        </th>
                                        <th className="px-3 py-2 text-center text-xs font-bold tracking-widest text-amber-900/40 uppercase">
                                            Status
                                        </th>
                                        <th className="hidden px-3 py-2 text-center text-xs font-bold tracking-widest text-amber-900/40 uppercase md:table-cell">
                                            Last Reading
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {sortedHives.map((hive, index) => (
                                        <tr
                                            key={hive.id}
                                            onClick={() =>
                                                setSelectedIndex(index)
                                            }
                                            className="cursor-pointer border-b border-yellow-50 transition-colors hover:bg-yellow-50/50"
                                        >
                                            <td className="px-3 py-3 text-xs font-bold text-amber-900/40 tabular-nums">
                                                {index + 1}
                                            </td>
                                            <td className="px-3 py-3 font-bold text-amber-900">
                                                {hive.hive_name}
                                            </td>
                                            <td className="hidden px-3 py-3 text-amber-800 sm:table-cell">
                                                {hive.beekeeper}
                                            </td>
                                            <td className="hidden px-3 py-3 text-xs text-amber-700 italic md:table-cell">
                                                {hive.species}
                                            </td>
                                            <td className="hidden px-3 py-3 text-center text-amber-800 md:table-cell">
                                                {hive.temp > 0
                                                    ? `${hive.temp}°C`
                                                    : '—'}
                                            </td>
                                            <td className="hidden px-3 py-3 text-center text-amber-800 md:table-cell">
                                                {hive.humidity > 0
                                                    ? `${hive.humidity}%`
                                                    : '—'}
                                            </td>
                                            <td className="hidden px-3 py-3 text-center md:table-cell">
                                                <span
                                                    className={
                                                        hive.co2 >
                                                        WARN_CO2_ABOVE
                                                            ? 'font-bold text-red-600'
                                                            : 'text-amber-800'
                                                    }
                                                >
                                                    {hive.co2 > 0
                                                        ? hive.co2
                                                        : '—'}
                                                </span>
                                            </td>
                                            <td className="hidden px-3 py-3 text-center md:table-cell">
                                                <div className="flex items-center justify-center gap-2">
                                                    <div className="h-1.5 w-16 overflow-hidden rounded-full bg-yellow-100">
                                                        <div
                                                            className="h-full rounded-full bg-yellow-400"
                                                            style={{
                                                                width: `${hive.readiness}%`,
                                                            }}
                                                        />
                                                    </div>
                                                    <span className="text-xs font-bold text-amber-900">
                                                        {hive.readiness}%
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-3 py-3 text-center">
                                                <span
                                                    className={`rounded-lg px-2 py-1 text-xs font-bold ${STATUS_BADGE[hive.status]}`}
                                                >
                                                    {STATUS_LABEL[hive.status]}
                                                </span>
                                            </td>
                                            <td className="hidden px-3 py-3 text-center text-xs text-amber-900/50 md:table-cell">
                                                {formatLastReading(
                                                    hive.last_reading,
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </Card>

                {/* ── P6.3 Productivity Ranking ──────────────────────────── */}
                {mounted && productivityRanking.length > 0 && (
                    <Card>
                        <h3 className="mb-4 text-sm font-black tracking-widest text-amber-900/60 uppercase">
                            Productivity Ranking
                        </h3>
                        <ResponsiveContainer
                            width="100%"
                            height={Math.max(
                                120,
                                productivityRanking.length * 48,
                            )}
                        >
                            <BarChart
                                layout="vertical"
                                data={productivityRanking}
                                margin={{
                                    left: 16,
                                    right: 24,
                                    top: 4,
                                    bottom: 4,
                                }}
                            >
                                <CartesianGrid
                                    strokeDasharray="3 3"
                                    stroke="#fef3c7"
                                    horizontal={false}
                                />
                                <XAxis
                                    type="number"
                                    unit=" kg"
                                    tick={{ fontSize: 11, fill: '#92400e' }}
                                    axisLine={false}
                                    tickLine={false}
                                />
                                <YAxis
                                    dataKey="hive_name"
                                    type="category"
                                    width={80}
                                    tick={{ fontSize: 11, fill: '#92400e' }}
                                    axisLine={false}
                                    tickLine={false}
                                />
                                <Tooltip
                                    contentStyle={{
                                        borderRadius: 12,
                                        border: '1px solid #fef3c7',
                                        fontSize: 12,
                                    }}
                                    formatter={(v) => [
                                        `${v ?? 0} kg`,
                                        'Harvest Weight',
                                    ]}
                                />
                                <Bar
                                    dataKey="total_weight"
                                    fill="#F59E0B"
                                    radius={[0, 6, 6, 0]}
                                />
                            </BarChart>
                        </ResponsiveContainer>
                    </Card>
                )}

                {/* ── P6.4 Cross-Site Comparison ─────────────────────────── */}
                {mounted && crossSiteComparison.length > 0 && (
                    <Card>
                        <h3 className="mb-4 text-sm font-black tracking-widest text-amber-900/60 uppercase">
                            Cross-Site Comparison
                        </h3>
                        <ResponsiveContainer width="100%" height={240}>
                            <BarChart
                                data={crossSiteComparison}
                                margin={{
                                    left: 0,
                                    right: 16,
                                    top: 4,
                                    bottom: 4,
                                }}
                            >
                                <CartesianGrid
                                    strokeDasharray="3 3"
                                    stroke="#fef3c7"
                                />
                                <XAxis
                                    dataKey="site_name"
                                    tick={{ fontSize: 11, fill: '#92400e' }}
                                    axisLine={false}
                                    tickLine={false}
                                />
                                <YAxis
                                    yAxisId="hri"
                                    orientation="left"
                                    unit="%"
                                    tick={{ fontSize: 11, fill: '#92400e' }}
                                    axisLine={false}
                                    tickLine={false}
                                />
                                <YAxis
                                    yAxisId="weight"
                                    orientation="right"
                                    unit=" kg"
                                    tick={{ fontSize: 11, fill: '#92400e' }}
                                    axisLine={false}
                                    tickLine={false}
                                />
                                <Tooltip
                                    contentStyle={{
                                        borderRadius: 12,
                                        border: '1px solid #fef3c7',
                                        fontSize: 12,
                                    }}
                                />
                                <Legend
                                    wrapperStyle={{
                                        fontSize: 11,
                                        paddingTop: 8,
                                    }}
                                />
                                <Bar
                                    yAxisId="hri"
                                    dataKey="avg_hri_pct"
                                    name="Avg HRI (%)"
                                    fill="#F59E0B"
                                    radius={[4, 4, 0, 0]}
                                />
                                <Bar
                                    yAxisId="weight"
                                    dataKey="total_weight"
                                    name="Total Harvest (kg)"
                                    fill="#6EE7B7"
                                    radius={[4, 4, 0, 0]}
                                />
                            </BarChart>
                        </ResponsiveContainer>
                    </Card>
                )}

                {/* ── Beekeeper Summary ──────────────────────────────────── */}
                <div className="flex items-center gap-2 px-1 text-xs font-bold tracking-widest text-amber-900/40 uppercase">
                    <Users className="h-3.5 w-3.5" />
                    <span>{stats.total} beekeepers</span>
                    <span className="opacity-30">·</span>
                    <span className="text-emerald-600">
                        {stats.active} active
                    </span>
                    <span className="opacity-30">·</span>
                    <span className="text-amber-600">
                        {stats.pending} pending
                    </span>
                </div>
            </div>

            {/* ── Hive Detail Modal ──────────────────────────────────────── */}
            <Modal
                isOpen={selectedHive !== null}
                onClose={() => setSelectedIndex(null)}
                title={selectedHive?.hive_name ?? ''}
                maxWidth="lg"
            >
                {selectedHive &&
                    (() => {
                        const hive = selectedHive;

                        return (
                            <div className="space-y-6">
                                {/* Navigation + status row */}
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <span
                                            className={`rounded-lg px-3 py-1 text-xs font-bold ${STATUS_BADGE[hive.status]}`}
                                        >
                                            {STATUS_LABEL[hive.status]}
                                        </span>
                                        <span className="text-xs text-amber-900/50">
                                            {READINESS_LABEL[hive.status]}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <button
                                            onClick={() =>
                                                hasPrev &&
                                                setSelectedIndex(
                                                    (prev) => prev! - 1,
                                                )
                                            }
                                            disabled={!hasPrev}
                                            className="rounded-xl p-1.5 transition-colors hover:bg-yellow-100 disabled:cursor-not-allowed disabled:opacity-20"
                                        >
                                            <ChevronLeft className="h-4 w-4 text-amber-900" />
                                        </button>
                                        <span className="min-w-[3rem] text-center text-xs font-bold text-amber-900/40 tabular-nums">
                                            {selectedIndex! + 1} /{' '}
                                            {sortedHives.length}
                                        </span>
                                        <button
                                            onClick={() =>
                                                hasNext &&
                                                setSelectedIndex(
                                                    (prev) => prev! + 1,
                                                )
                                            }
                                            disabled={!hasNext}
                                            className="rounded-xl p-1.5 transition-colors hover:bg-yellow-100 disabled:cursor-not-allowed disabled:opacity-20"
                                        >
                                            <ChevronRight className="h-4 w-4 text-amber-900" />
                                        </button>
                                    </div>
                                </div>

                                {/* HRI score bar */}
                                <div>
                                    <div className="mb-2 flex justify-between">
                                        <p className="text-xs font-bold tracking-widest text-amber-900/40 uppercase">
                                            HRI Confidence
                                        </p>
                                        <span className="text-sm font-black text-amber-950">
                                            {hive.readiness}%
                                        </span>
                                    </div>
                                    <div className="h-3 w-full overflow-hidden rounded-full bg-yellow-100">
                                        <div
                                            className="h-full rounded-full bg-yellow-400 transition-all duration-300"
                                            style={{
                                                width:
                                                    hive.readiness > 0
                                                        ? `${hive.readiness}%`
                                                        : '0%',
                                                minWidth: 0,
                                            }}
                                        />
                                    </div>
                                </div>

                                {/* Beekeeper + species */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="rounded-2xl bg-yellow-50/50 p-4">
                                        <p className="mb-1 text-xs font-bold tracking-widest text-amber-900/40 uppercase">
                                            Beekeeper
                                        </p>
                                        <p className="text-sm font-bold text-amber-950">
                                            {hive.beekeeper}
                                        </p>
                                    </div>
                                    <div className="rounded-2xl bg-yellow-50/50 p-4">
                                        <p className="mb-1 text-xs font-bold tracking-widest text-amber-900/40 uppercase">
                                            Species
                                        </p>
                                        <p className="text-xs font-medium text-amber-800 italic">
                                            {hive.species}
                                        </p>
                                    </div>
                                </div>

                                {/* Sensor readings */}
                                <div>
                                    <div className="mb-3 flex items-baseline gap-2">
                                        <p className="text-xs font-bold tracking-widest text-amber-900/40 uppercase">
                                            Latest Sensor Readings
                                        </p>
                                        <span className="text-[10px] text-amber-900/30">
                                            {formatLastReading(
                                                hive.last_reading,
                                            )}
                                        </span>
                                    </div>
                                    {hive.status === 'no_data' ? (
                                        <div className="rounded-xl bg-yellow-50/50 py-4 text-center text-sm text-amber-900/40">
                                            No sensor data received today
                                        </div>
                                    ) : (
                                        <div className="grid grid-cols-1 gap-3">
                                            {[
                                                {
                                                    icon: Thermometer,
                                                    label: 'Temperature',
                                                    value:
                                                        hive.temp > 0
                                                            ? `${hive.temp}°C`
                                                            : '—',
                                                    warn:
                                                        hive.temp >
                                                        WARN_TEMP_ABOVE,
                                                },
                                                {
                                                    icon: Droplets,
                                                    label: 'Humidity',
                                                    value:
                                                        hive.humidity > 0
                                                            ? `${hive.humidity}%`
                                                            : '—',
                                                    warn:
                                                        hive.humidity >
                                                        WARN_HUMID_ABOVE,
                                                },
                                                {
                                                    icon: Wind,
                                                    label: 'MQ135 (VOC)',
                                                    value:
                                                        hive.co2 > 0
                                                            ? String(hive.co2)
                                                            : '—',
                                                    warn:
                                                        hive.co2 >
                                                        WARN_CO2_ABOVE,
                                                },
                                            ].map((sensor) => (
                                                <div
                                                    key={sensor.label}
                                                    className="flex items-center justify-between rounded-xl bg-yellow-50/50 px-4 py-3"
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <sensor.icon className="h-4 w-4 text-amber-900/40" />
                                                        <span className="text-sm text-amber-900">
                                                            {sensor.label}
                                                        </span>
                                                    </div>
                                                    <span
                                                        className={`text-sm font-bold ${sensor.warn ? 'text-red-600' : 'text-amber-950'}`}
                                                    >
                                                        {sensor.value}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {/* Keyboard hint */}
                                <p className="text-center text-[10px] tracking-widest text-amber-900/25 uppercase">
                                    Use arrow keys to navigate hives
                                </p>
                            </div>
                        );
                    })()}
            </Modal>
        </AdminLayout>
    );
}
