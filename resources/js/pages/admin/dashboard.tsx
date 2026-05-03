import { Head, router } from '@inertiajs/react';
import { TrendingUp, AlertTriangle, Clock, Users, Thermometer, Droplets, Wind, ChevronLeft, ChevronRight } from 'lucide-react';
import { useState, useEffect } from 'react';
import {
    ResponsiveContainer,
    BarChart, Bar,
    XAxis, YAxis, CartesianGrid, Tooltip, Legend,
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
    status: 'ready' | 'growing' | 'alert' | 'offline';
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
    ready:   'bg-emerald-100 text-emerald-700',
    growing: 'bg-yellow-100 text-yellow-700',
    alert:   'bg-red-100 text-red-700',
    offline: 'bg-gray-100 text-gray-500',
};

const READINESS_LABEL: Record<HiveData['status'], string> = {
    ready:   'Ready to Harvest',
    growing: 'Approaching Readiness',
    alert:   'Needs Attention',
    offline: 'Sensor Offline',
};

// ── Sensor warning thresholds ──────────────────────────────────────────
const WARN_TEMP_ABOVE  = 35;   // °C
const WARN_HUMID_ABOVE = 85;   // %
const WARN_CO2_ABOVE   = 800;  // ADC (MQ135)

// ── AdminDashboard ─────────────────────────────────────────────────────
export default function AdminDashboard({ stats, hives = [], productivityRanking = [], crossSiteComparison = [] }: Props) {
    const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setMounted(true);
    }, []);

    const sortedHives  = [...hives].sort((a, b) => b.readiness - a.readiness);
    const selectedHive = selectedIndex !== null ? sortedHives[selectedIndex] : null;

    const readyCount = hives.filter(h => h.status === 'ready').length;
    const alertCount = hives.filter(h => h.status === 'alert' || h.status === 'offline').length;

    const hasPrev = selectedIndex !== null && selectedIndex > 0;
    const hasNext = selectedIndex !== null && selectedIndex < sortedHives.length - 1;

    useEffect(() => {
        if (selectedIndex === null) return;

        const handler = (e: KeyboardEvent) => {
            if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
                e.preventDefault();
                setSelectedIndex(prev => prev !== null && prev > 0 ? prev - 1 : prev);
            }
            if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
                e.preventDefault();
                setSelectedIndex(prev => prev !== null && prev < sortedHives.length - 1 ? prev + 1 : prev);
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
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <Card
                        className="flex items-center gap-4 border-l-4 border-l-red-400 cursor-pointer hover:bg-yellow-50/50 transition-colors"
                        onClick={() => router.visit(route('admin.sensors.index'))}
                    >
                        <div className="bg-red-100 p-3 rounded-2xl shrink-0">
                            <AlertTriangle className="w-5 h-5 text-red-500" />
                        </div>
                        <div>
                            <p className="text-2xl font-black text-amber-950">{alertCount}</p>
                            <p className="text-xs font-bold uppercase tracking-widest text-amber-900/50">Need Attention</p>
                        </div>
                    </Card>

                    <Card
                        className="flex items-center gap-4 border-l-4 border-l-emerald-400 cursor-pointer hover:bg-yellow-50/50 transition-colors"
                        onClick={() => router.visit(route('admin.sensors.index'))}
                    >
                        <div className="bg-emerald-100 p-3 rounded-2xl shrink-0">
                            <TrendingUp className="w-5 h-5 text-emerald-600" />
                        </div>
                        <div>
                            <p className="text-2xl font-black text-amber-950">{readyCount}</p>
                            <p className="text-xs font-bold uppercase tracking-widest text-amber-900/50">Ready to Harvest</p>
                        </div>
                    </Card>

                    <Card
                        className="flex items-center gap-4 border-l-4 border-l-amber-400 cursor-pointer hover:bg-yellow-50/50 transition-colors"
                        onClick={() => router.visit(route('admin.beekeepers.index'))}
                    >
                        <div className="bg-amber-100 p-3 rounded-2xl shrink-0">
                            <Clock className="w-5 h-5 text-amber-600" />
                        </div>
                        <div>
                            <p className="text-2xl font-black text-amber-950">{stats.pending}</p>
                            <p className="text-xs font-bold uppercase tracking-widest text-amber-900/50">Pending Invites</p>
                        </div>
                    </Card>
                </div>

                {/* ── Live Hive Monitor ──────────────────────────────────── */}
                <Card>
                    <h3 className="text-sm font-black uppercase tracking-widest text-amber-900/60 mb-4">Live Hive Monitor</h3>
                    {hives.length === 0 ? (
                        <p className="text-sm text-amber-900/40 text-center py-6">No hives registered yet.</p>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b border-yellow-100">
                                        <th className="text-left py-2 px-3 text-xs font-bold uppercase tracking-widest text-amber-900/40">#</th>
                                        <th className="text-left py-2 px-3 text-xs font-bold uppercase tracking-widest text-amber-900/40">Hive</th>
                                        <th className="text-left py-2 px-3 text-xs font-bold uppercase tracking-widest text-amber-900/40">Beekeeper</th>
                                        <th className="text-left py-2 px-3 text-xs font-bold uppercase tracking-widest text-amber-900/40 hidden md:table-cell">Species</th>
                                        <th className="text-center py-2 px-3 text-xs font-bold uppercase tracking-widest text-amber-900/40">
                                            <Thermometer className="w-3 h-3 inline mr-1" />Temp
                                        </th>
                                        <th className="text-center py-2 px-3 text-xs font-bold uppercase tracking-widest text-amber-900/40">
                                            <Droplets className="w-3 h-3 inline mr-1" />Humid
                                        </th>
                                        <th className="text-center py-2 px-3 text-xs font-bold uppercase tracking-widest text-amber-900/40">
                                            <Wind className="w-3 h-3 inline mr-1" />MQ135
                                        </th>
                                        <th className="text-center py-2 px-3 text-xs font-bold uppercase tracking-widest text-amber-900/40">HRI</th>
                                        <th className="text-center py-2 px-3 text-xs font-bold uppercase tracking-widest text-amber-900/40">Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {sortedHives.map((hive, index) => (
                                        <tr
                                            key={hive.id}
                                            onClick={() => setSelectedIndex(index)}
                                            className="border-b border-yellow-50 hover:bg-yellow-50/50 transition-colors cursor-pointer"
                                        >
                                            <td className="py-3 px-3 text-xs font-bold text-amber-900/40 tabular-nums">{index + 1}</td>
                                            <td className="py-3 px-3 font-bold text-amber-900">{hive.hive_name}</td>
                                            <td className="py-3 px-3 text-amber-800">{hive.beekeeper}</td>
                                            <td className="py-3 px-3 text-amber-700 italic hidden md:table-cell text-xs">{hive.species}</td>
                                            <td className="py-3 px-3 text-center text-amber-800">
                                                {hive.temp > 0 ? `${hive.temp}°C` : '—'}
                                            </td>
                                            <td className="py-3 px-3 text-center text-amber-800">
                                                {hive.humidity > 0 ? `${hive.humidity}%` : '—'}
                                            </td>
                                            <td className="py-3 px-3 text-center">
                                                <span className={hive.co2 > WARN_CO2_ABOVE ? 'text-red-600 font-bold' : 'text-amber-800'}>
                                                    {hive.co2 > 0 ? hive.co2 : '—'}
                                                </span>
                                            </td>
                                            <td className="py-3 px-3 text-center">
                                                <div className="flex items-center justify-center gap-2">
                                                    <div className="w-16 h-1.5 bg-yellow-100 rounded-full overflow-hidden">
                                                        <div
                                                            className="h-full bg-yellow-400 rounded-full"
                                                            style={{ width: `${hive.readiness}%` }}
                                                        />
                                                    </div>
                                                    <span className="text-xs font-bold text-amber-900">{hive.readiness}%</span>
                                                </div>
                                            </td>
                                            <td className="py-3 px-3 text-center">
                                                <span className={`px-2 py-1 rounded-lg text-xs font-bold capitalize ${STATUS_BADGE[hive.status]}`}>
                                                    {hive.status}
                                                </span>
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
                        <h3 className="text-sm font-black uppercase tracking-widest text-amber-900/60 mb-4">Productivity Ranking</h3>
                        <ResponsiveContainer width="100%" height={Math.max(120, productivityRanking.length * 48)}>
                            <BarChart
                                layout="vertical"
                                data={productivityRanking}
                                margin={{ left: 16, right: 24, top: 4, bottom: 4 }}
                            >
                                <CartesianGrid strokeDasharray="3 3" stroke="#fef3c7" horizontal={false} />
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
                                    contentStyle={{ borderRadius: 12, border: '1px solid #fef3c7', fontSize: 12 }}
                                    formatter={(v: number) => [`${v} kg`, 'Harvest Weight']}
                                />
                                <Bar dataKey="total_weight" fill="#F59E0B" radius={[0, 6, 6, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </Card>
                )}

                {/* ── P6.4 Cross-Site Comparison ─────────────────────────── */}
                {mounted && crossSiteComparison.length > 0 && (
                    <Card>
                        <h3 className="text-sm font-black uppercase tracking-widest text-amber-900/60 mb-4">Cross-Site Comparison</h3>
                        <ResponsiveContainer width="100%" height={240}>
                            <BarChart data={crossSiteComparison} margin={{ left: 0, right: 16, top: 4, bottom: 4 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#fef3c7" />
                                <XAxis dataKey="site_name" tick={{ fontSize: 11, fill: '#92400e' }} axisLine={false} tickLine={false} />
                                <YAxis yAxisId="hri" orientation="left" unit="%" tick={{ fontSize: 11, fill: '#92400e' }} axisLine={false} tickLine={false} />
                                <YAxis yAxisId="weight" orientation="right" unit=" kg" tick={{ fontSize: 11, fill: '#92400e' }} axisLine={false} tickLine={false} />
                                <Tooltip
                                    contentStyle={{ borderRadius: 12, border: '1px solid #fef3c7', fontSize: 12 }}
                                />
                                <Legend wrapperStyle={{ fontSize: 11, paddingTop: 8 }} />
                                <Bar yAxisId="hri"    dataKey="avg_hri_pct"  name="Avg HRI (%)"     fill="#F59E0B" radius={[4, 4, 0, 0]} />
                                <Bar yAxisId="weight" dataKey="total_weight" name="Total Harvest (kg)" fill="#6EE7B7" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </Card>
                )}

                {/* ── Beekeeper Summary ──────────────────────────────────── */}
                <div className="flex items-center gap-2 text-xs text-amber-900/40 font-bold uppercase tracking-widest px-1">
                    <Users className="w-3.5 h-3.5" />
                    <span>{stats.total} beekeepers</span>
                    <span className="opacity-30">·</span>
                    <span className="text-emerald-600">{stats.active} active</span>
                    <span className="opacity-30">·</span>
                    <span className="text-amber-600">{stats.pending} pending</span>
                </div>

            </div>

            {/* ── Hive Detail Modal ──────────────────────────────────────── */}
            <Modal
                isOpen={selectedHive !== null}
                onClose={() => setSelectedIndex(null)}
                title={selectedHive?.hive_name ?? ''}
                maxWidth="lg"
            >
                {selectedHive && (() => {
                    const hive = selectedHive;

                    return (
                        <div className="space-y-6">

                            {/* Navigation + status row */}
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <span className={`px-3 py-1 rounded-lg text-xs font-bold capitalize ${STATUS_BADGE[hive.status]}`}>
                                        {hive.status}
                                    </span>
                                    <span className="text-xs text-amber-900/50">{READINESS_LABEL[hive.status]}</span>
                                </div>
                                <div className="flex items-center gap-1">
                                    <button
                                        onClick={() => hasPrev && setSelectedIndex(prev => prev! - 1)}
                                        disabled={!hasPrev}
                                        className="p-1.5 rounded-xl transition-colors hover:bg-yellow-100 disabled:opacity-20 disabled:cursor-not-allowed"
                                    >
                                        <ChevronLeft className="w-4 h-4 text-amber-900" />
                                    </button>
                                    <span className="text-xs text-amber-900/40 font-bold tabular-nums min-w-[3rem] text-center">
                                        {selectedIndex! + 1} / {sortedHives.length}
                                    </span>
                                    <button
                                        onClick={() => hasNext && setSelectedIndex(prev => prev! + 1)}
                                        disabled={!hasNext}
                                        className="p-1.5 rounded-xl transition-colors hover:bg-yellow-100 disabled:opacity-20 disabled:cursor-not-allowed"
                                    >
                                        <ChevronRight className="w-4 h-4 text-amber-900" />
                                    </button>
                                </div>
                            </div>

                            {/* HRI score bar */}
                            <div>
                                <div className="flex justify-between mb-2">
                                    <p className="text-xs font-bold uppercase tracking-widest text-amber-900/40">HRI Confidence</p>
                                    <span className="text-sm font-black text-amber-950">{hive.readiness}%</span>
                                </div>
                                <div className="w-full h-3 bg-yellow-100 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-yellow-400 rounded-full transition-all duration-300"
                                        style={{ width: `${hive.readiness}%` }}
                                    />
                                </div>
                            </div>

                            {/* Beekeeper + species */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-yellow-50/50 rounded-2xl p-4">
                                    <p className="text-xs font-bold uppercase tracking-widest text-amber-900/40 mb-1">Beekeeper</p>
                                    <p className="text-sm font-bold text-amber-950">{hive.beekeeper}</p>
                                </div>
                                <div className="bg-yellow-50/50 rounded-2xl p-4">
                                    <p className="text-xs font-bold uppercase tracking-widest text-amber-900/40 mb-1">Species</p>
                                    <p className="text-xs font-medium text-amber-800 italic">{hive.species}</p>
                                </div>
                            </div>

                            {/* Sensor readings */}
                            <div>
                                <p className="text-xs font-bold uppercase tracking-widest text-amber-900/40 mb-3">Latest Sensor Readings</p>
                                <div className="grid grid-cols-2 gap-3">
                                    {[
                                        { icon: Thermometer, label: 'Temperature', value: hive.temp > 0 ? `${hive.temp}°C` : '—',    warn: hive.temp > WARN_TEMP_ABOVE },
                                        { icon: Droplets,    label: 'Humidity',    value: hive.humidity > 0 ? `${hive.humidity}%` : '—', warn: hive.humidity > WARN_HUMID_ABOVE },
                                        { icon: Wind,        label: 'MQ135 (VOC)', value: hive.co2 > 0 ? String(hive.co2) : '—',    warn: hive.co2 > WARN_CO2_ABOVE },
                                    ].map((sensor) => (
                                        <div key={sensor.label} className="flex items-center justify-between bg-yellow-50/50 rounded-xl px-4 py-3">
                                            <div className="flex items-center gap-3">
                                                <sensor.icon className="w-4 h-4 text-amber-900/40" />
                                                <span className="text-sm text-amber-900">{sensor.label}</span>
                                            </div>
                                            <span className={`text-sm font-bold ${sensor.warn ? 'text-red-600' : 'text-amber-950'}`}>
                                                {sensor.value}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Keyboard hint */}
                            <p className="text-[10px] text-amber-900/25 text-center uppercase tracking-widest">
                                Use arrow keys to navigate hives
                            </p>

                        </div>
                    );
                })()}
            </Modal>
        </AdminLayout>
    );
}
