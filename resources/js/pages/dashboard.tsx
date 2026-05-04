import { Head, Link, usePage } from '@inertiajs/react';
import { Bug as Bee, MapPin, Thermometer, Droplets, BarChart3, Wind, Leaf, LineChart, Activity } from 'lucide-react';
import { motion } from 'motion/react';
import { useState } from 'react';
import { Card } from '@/components/core/card';
import { Alert, Progress } from '@/components/core/feedback';
import { BeekeeperTabs } from '@/components/core/beekeeper-tabs';
import { Breadcrumbs } from '@/components/core/navigation';
import { AuthenticatedLayout } from '@/layouts/authenticated-layout';
import { cn } from '@/lib/utils';

type HiveCard = {
    id: number;
    name: string;
    species: string | null;
    location: string | null;
    status: 'active' | 'inactive';
    age_months: number;
    harvest_count: number;
    readiness_level: string | null;
    hri_value: number;
    avg_temperature: number | null;
    avg_humidity: number | null;
    avg_mq2: number | null;
    avg_mq3: number | null;
    avg_mq5: number | null;
    avg_mq135: number | null;
};

type Props = {
    hives: HiveCard[];
};

const READINESS_LABELS: Record<string, string> = {
    not_ready:    'Not Ready',
    approaching:  'Approaching',
    nearly_ready: 'Nearly Ready',
    ready:        'Ready to Harvest',
};

const READINESS_STYLES: Record<string, string> = {
    not_ready:    'bg-rose-100 text-rose-700',
    approaching:  'bg-amber-100 text-amber-700',
    nearly_ready: 'bg-yellow-100 text-yellow-700',
    ready:        'bg-emerald-100 text-emerald-700',
};

const READINESS_BAR_COLOR: Record<string, string> = {
    not_ready:    'bg-rose-400',
    approaching:  'bg-amber-400',
    nearly_ready: 'bg-yellow-400',
    ready:        'bg-emerald-400',
};

function ReadinessBadge({ level }: { level: string | null }) {
    if (!level) return <span className="text-amber-900/40 text-sm">No data yet</span>;
    return (
        <span className={cn('inline-flex items-center px-3 py-1 rounded-full text-sm font-bold', READINESS_STYLES[level] ?? 'bg-gray-100 text-gray-500')}>
            {READINESS_LABELS[level] ?? level}
        </span>
    );
}

export default function Dashboard({ hives }: Props) {
    const { props } = usePage<{ flash?: { success?: string; error?: string } }>();
    const flash = props.flash;

    const [selectedHive, setSelectedHive] = useState<HiveCard | null>(() => hives[0] ?? null);

    return (
        <AuthenticatedLayout>
            <Head title="My Hives" />
            <div className="p-6 md:p-10 max-w-6xl mx-auto space-y-8">

                {/* Breadcrumb + page nav */}
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <Breadcrumbs items={[{ label: 'Home', href: '/' }, { label: 'My Hives' }]} />
                    <BeekeeperTabs active="dashboard" />
                </div>

                {flash?.success && <Alert variant="success">{flash.success}</Alert>}
                {flash?.error   && <Alert variant="error">{flash.error}</Alert>}

                {/* ── Your Hives heading ──────────────────────────────────── */}
                <h3 className="text-xl font-bold text-amber-900">Your Hives</h3>

                {/* ── Flat row-aligned grid ────────────────────────────────── */}
                {/* Each hive card and its corresponding right section share
                    the same CSS grid row so heights align automatically.     */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-x-8 gap-y-4">

                    {/* ── Left: no hives empty state ──────────────────── */}
                    {hives.length === 0 && (
                        <div className="lg:col-span-5 lg:col-start-1 lg:row-start-1 text-center py-16 border-4 border-dashed border-yellow-200 rounded-3xl">
                            <div className="bg-yellow-100 p-6 rounded-full mb-4 inline-block">
                                <Bee className="w-10 h-10 text-yellow-600" />
                            </div>
                            <p className="text-amber-900 font-semibold">No hives assigned yet.</p>
                            <p className="text-amber-700/60 text-sm mt-1">Contact your admin to register a hive.</p>
                        </div>
                    )}

                    {/* ── Left: hive card 1 (row 1) ───────────────────── */}
                    {hives[0] && (
                        <motion.div
                            key={hives[0].id}
                            whileHover={{ y: -2 }} whileTap={{ scale: 0.98 }}
                            className="lg:col-span-5 lg:col-start-1 lg:row-start-1 h-full"
                        >
                            <Card
                                className={cn(
                                    'h-full cursor-pointer transition-all border-2',
                                    selectedHive?.id === hives[0].id
                                        ? 'border-yellow-400 ring-4 ring-yellow-400/10'
                                        : 'border-gray-200'
                                )}
                                onClick={() => setSelectedHive(hives[0])}
                            >
                                <div className="flex justify-between items-start mb-4">
                                    <div>
                                        <h3 className="font-bold text-lg text-amber-900">{hives[0].name}</h3>
                                        <p className="text-sm text-amber-700 italic">{hives[0].species ?? 'Unknown species'}</p>
                                    </div>
                                    {hives[0].location && (
                                        <div className="bg-yellow-50 p-1.5 rounded-lg flex items-center gap-1 text-xs text-amber-700">
                                            <MapPin className="w-3 h-3" /> {hives[0].location}
                                        </div>
                                    )}
                                </div>
                                <div className="grid grid-cols-3 gap-4 text-sm mb-4">
                                    <div className="flex flex-col gap-1">
                                        <span className="text-amber-600/60 font-medium uppercase text-[10px] tracking-wider">Age</span>
                                        <span className="font-semibold">{hives[0].age_months}m</span>
                                    </div>
                                    <div className="flex flex-col gap-1">
                                        <span className="text-amber-600/60 font-medium uppercase text-[10px] tracking-wider">Harvests</span>
                                        <span className="font-semibold">{hives[0].harvest_count}</span>
                                    </div>
                                    <div className="flex flex-col gap-1">
                                        <span className="text-amber-600/60 font-medium uppercase text-[10px] tracking-wider">Status</span>
                                        <span className={cn('font-semibold text-xs', hives[0].status === 'active' ? 'text-emerald-600' : 'text-rose-500')}>
                                            {hives[0].status === 'active' ? 'Active' : 'Inactive'}
                                        </span>
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest text-amber-900/40">
                                        <span>Readiness</span>
                                        <span>{Math.round(hives[0].hri_value * 100)}%</span>
                                    </div>
                                    <Progress value={hives[0].hri_value * 100} barColor={READINESS_BAR_COLOR[hives[0].readiness_level ?? ''] ?? 'bg-yellow-400'} />
                                </div>
                            </Card>
                        </motion.div>
                    )}

                    {/* ── Left: hive card 2 (row 2) ───────────────────── */}
                    {hives[1] && (
                        <motion.div
                            key={hives[1].id}
                            whileHover={{ y: -2 }} whileTap={{ scale: 0.98 }}
                            className="lg:col-span-5 lg:col-start-1 lg:row-start-2 h-full"
                        >
                            <Card
                                className={cn(
                                    'h-full cursor-pointer transition-all border-2',
                                    selectedHive?.id === hives[1].id
                                        ? 'border-yellow-400 ring-4 ring-yellow-400/10'
                                        : 'border-gray-200'
                                )}
                                onClick={() => setSelectedHive(hives[1])}
                            >
                                <div className="flex justify-between items-start mb-4">
                                    <div>
                                        <h3 className="font-bold text-lg text-amber-900">{hives[1].name}</h3>
                                        <p className="text-sm text-amber-700 italic">{hives[1].species ?? 'Unknown species'}</p>
                                    </div>
                                    {hives[1].location && (
                                        <div className="bg-yellow-50 p-1.5 rounded-lg flex items-center gap-1 text-xs text-amber-700">
                                            <MapPin className="w-3 h-3" /> {hives[1].location}
                                        </div>
                                    )}
                                </div>
                                <div className="grid grid-cols-3 gap-4 text-sm mb-4">
                                    <div className="flex flex-col gap-1">
                                        <span className="text-amber-600/60 font-medium uppercase text-[10px] tracking-wider">Age</span>
                                        <span className="font-semibold">{hives[1].age_months}m</span>
                                    </div>
                                    <div className="flex flex-col gap-1">
                                        <span className="text-amber-600/60 font-medium uppercase text-[10px] tracking-wider">Harvests</span>
                                        <span className="font-semibold">{hives[1].harvest_count}</span>
                                    </div>
                                    <div className="flex flex-col gap-1">
                                        <span className="text-amber-600/60 font-medium uppercase text-[10px] tracking-wider">Status</span>
                                        <span className={cn('font-semibold text-xs', hives[1].status === 'active' ? 'text-emerald-600' : 'text-rose-500')}>
                                            {hives[1].status === 'active' ? 'Active' : 'Inactive'}
                                        </span>
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest text-amber-900/40">
                                        <span>Readiness</span>
                                        <span>{Math.round(hives[1].hri_value * 100)}%</span>
                                    </div>
                                    <Progress value={hives[1].hri_value * 100} barColor={READINESS_BAR_COLOR[hives[1].readiness_level ?? ''] ?? 'bg-yellow-400'} />
                                </div>
                            </Card>
                        </motion.div>
                    )}

                    {/* ── Left: hive cards 3+ (row 3+, no right counterpart) */}
                    {hives.slice(2).map((hive, idx) => (
                        <motion.div
                            key={hive.id}
                            whileHover={{ y: -2 }} whileTap={{ scale: 0.98 }}
                            className="lg:col-span-5 lg:col-start-1"
                            style={{ gridRowStart: idx + 3 }}
                        >
                            <Card
                                className={cn(
                                    'cursor-pointer transition-all border-2',
                                    selectedHive?.id === hive.id
                                        ? 'border-yellow-400 ring-4 ring-yellow-400/10'
                                        : 'border-gray-200'
                                )}
                                onClick={() => setSelectedHive(hive)}
                            >
                                <div className="flex justify-between items-start mb-4">
                                    <div>
                                        <h3 className="font-bold text-lg text-amber-900">{hive.name}</h3>
                                        <p className="text-sm text-amber-700 italic">{hive.species ?? 'Unknown species'}</p>
                                    </div>
                                    {hive.location && (
                                        <div className="bg-yellow-50 p-1.5 rounded-lg flex items-center gap-1 text-xs text-amber-700">
                                            <MapPin className="w-3 h-3" /> {hive.location}
                                        </div>
                                    )}
                                </div>
                                <div className="grid grid-cols-3 gap-4 text-sm mb-4">
                                    <div className="flex flex-col gap-1">
                                        <span className="text-amber-600/60 font-medium uppercase text-[10px] tracking-wider">Age</span>
                                        <span className="font-semibold">{hive.age_months}m</span>
                                    </div>
                                    <div className="flex flex-col gap-1">
                                        <span className="text-amber-600/60 font-medium uppercase text-[10px] tracking-wider">Harvests</span>
                                        <span className="font-semibold">{hive.harvest_count}</span>
                                    </div>
                                    <div className="flex flex-col gap-1">
                                        <span className="text-amber-600/60 font-medium uppercase text-[10px] tracking-wider">Status</span>
                                        <span className={cn('font-semibold text-xs', hive.status === 'active' ? 'text-emerald-600' : 'text-rose-500')}>
                                            {hive.status === 'active' ? 'Active' : 'Inactive'}
                                        </span>
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest text-amber-900/40">
                                        <span>Readiness</span>
                                        <span>{Math.round(hive.hri_value * 100)}%</span>
                                    </div>
                                    <Progress value={hive.hri_value * 100} barColor={READINESS_BAR_COLOR[hive.readiness_level ?? ''] ?? 'bg-yellow-400'} />
                                </div>
                            </Card>
                        </motion.div>
                    ))}

                    {/* ── Right row 1: Viewing label + Readiness Score card ─ */}
                    {selectedHive ? (
                        <motion.div
                            key={selectedHive.id + '-r'}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="lg:col-span-7 lg:col-start-6 lg:row-start-1 flex flex-col gap-2"
                        >
                            <p className="text-xs font-bold uppercase tracking-widest text-amber-900/40">
                                Viewing: <span className="text-amber-900">{selectedHive.name}</span>
                            </p>
                            <Card className="flex-1 bg-gradient-to-br from-yellow-400 to-amber-500 text-white border-none p-8 relative overflow-hidden">
                                <div className="absolute top-0 right-0 p-8 opacity-10">
                                    <Leaf className="w-32 h-32" />
                                </div>
                                <div className="relative z-10">
                                    <div className="flex items-center justify-between mb-2">
                                        <div className="flex items-center gap-2">
                                            <Leaf className="w-5 h-5" />
                                            <span className="text-sm font-bold uppercase tracking-widest opacity-80">Readiness Score</span>
                                        </div>
                                        <Link
                                            href={route('analytics.show', { hive: selectedHive.id })}
                                            className="flex items-center gap-2 bg-white/20 hover:bg-white/30 backdrop-blur-sm px-4 py-2 rounded-full text-sm font-bold transition-colors"
                                        >
                                            <LineChart className="w-4 h-4" />
                                            Analytics
                                        </Link>
                                    </div>
                                    <div className="flex items-baseline gap-4">
                                        <span className="text-7xl font-black tracking-tighter">
                                            {Math.round(selectedHive.hri_value * 100)}%
                                        </span>
                                        <div className="bg-white/20 backdrop-blur-sm px-4 py-1 rounded-full text-sm font-bold">
                                            {selectedHive.readiness_level
                                                ? (READINESS_LABELS[selectedHive.readiness_level] ?? selectedHive.readiness_level)
                                                : 'No prediction yet'}
                                        </div>
                                    </div>
                                    {selectedHive.readiness_level && selectedHive.readiness_level !== 'ready' && (
                                        <div className="mt-3 mb-1">
                                            <p className="text-xs opacity-70 mb-2">Hive needs more time to mature. Target: 80% readiness for harvest.</p>
                                            <div className="relative w-full h-2 bg-white/20 rounded-full overflow-visible">
                                                <div
                                                    className="h-full bg-white/70 rounded-full"
                                                    style={{ width: `${Math.min(Math.round(selectedHive.hri_value * 100), 100)}%` }}
                                                />
                                                <div
                                                    className="absolute top-1/2 -translate-y-1/2 w-0.5 h-4 bg-white rounded-full"
                                                    style={{ left: '80%' }}
                                                    title="80% harvest target"
                                                />
                                            </div>
                                            <div className="flex justify-between text-[10px] opacity-60 mt-1">
                                                <span>0%</span>
                                                <span>Target 80%</span>
                                                <span>100%</span>
                                            </div>
                                        </div>
                                    )}
                                    <div className="mt-4 flex items-center gap-6">
                                        <div>
                                            <p className="text-xs font-bold uppercase tracking-wider opacity-70 mb-1">Total Harvests</p>
                                            <p className="text-xl font-bold">{selectedHive.harvest_count}</p>
                                        </div>
                                        <div className="w-px h-10 bg-white/20" />
                                        <div>
                                            <p className="text-xs font-bold uppercase tracking-wider opacity-70 mb-1">Hive Age</p>
                                            <p className="text-xl font-bold">{selectedHive.age_months} months</p>
                                        </div>
                                    </div>
                                </div>
                            </Card>
                        </motion.div>
                    ) : (
                        <motion.div
                            key="empty"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="lg:col-span-7 lg:col-start-6 lg:row-start-1 lg:row-span-2 flex flex-col items-center justify-center min-h-[400px] text-center p-12 border-4 border-dashed border-yellow-200 rounded-3xl"
                        >
                            <div className="bg-yellow-100 p-6 rounded-full mb-6">
                                <Bee className="w-12 h-12 text-yellow-600" />
                            </div>
                            <h3 className="text-2xl font-bold text-amber-900 mb-2">Select a Hive</h3>
                            <p className="text-amber-700 max-w-xs">
                                Choose one of your hives from the list to see its readiness score and sensor summary.
                            </p>
                        </motion.div>
                    )}

                    {/* ── Right row 2: Sensor metric cards ────────────────── */}
                    {selectedHive && (selectedHive.avg_temperature != null || selectedHive.avg_humidity != null || selectedHive.avg_mq2 != null) && (
                        <motion.div
                            key={selectedHive.id + '-s'}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.05 }}
                            className="lg:col-span-7 lg:col-start-6 lg:row-start-2"
                        >
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                                {[
                                    { icon: Thermometer, color: 'text-orange-400', label: 'Avg Temp',     subtitle: 'DHT11',       adcTooltip: undefined,                                            value: selectedHive.avg_temperature != null ? `${selectedHive.avg_temperature}°C` : '—' },
                                    { icon: Droplets,    color: 'text-blue-400',   label: 'Avg Humidity', subtitle: 'DHT11',       adcTooltip: undefined,                                            value: selectedHive.avg_humidity    != null ? `${selectedHive.avg_humidity}%`    : '—' },
                                    { icon: BarChart3,   color: 'text-purple-400', label: 'Avg MQ2',      subtitle: 'Air Quality', adcTooltip: 'Raw sensor reading (Analog-to-Digital Converter)',   value: selectedHive.avg_mq2   != null ? `${selectedHive.avg_mq2} ADC`   : '—' },
                                    { icon: Wind,        color: 'text-teal-400',   label: 'Avg MQ3',      subtitle: 'Gas Sensor',  adcTooltip: 'Raw sensor reading (Analog-to-Digital Converter)',   value: selectedHive.avg_mq3   != null ? `${selectedHive.avg_mq3} ADC`   : '—' },
                                    { icon: Wind,        color: 'text-cyan-400',   label: 'Avg MQ5',      subtitle: 'LPG/Smoke',   adcTooltip: 'Raw sensor reading (Analog-to-Digital Converter)',   value: selectedHive.avg_mq5   != null ? `${selectedHive.avg_mq5} ADC`   : '—' },
                                    { icon: Wind,        color: 'text-indigo-400', label: 'Avg MQ135',    subtitle: 'CO2/Air',     adcTooltip: 'Raw sensor reading (Analog-to-Digital Converter)',   value: selectedHive.avg_mq135 != null ? `${selectedHive.avg_mq135} ADC` : '—' },
                                ].map((s) => (
                                    <Card key={s.label} className="p-5 flex flex-col justify-between">
                                        <div className="flex items-center gap-2 mb-1">
                                            <s.icon className={`w-4 h-4 ${s.color}`} />
                                            <span className="text-xs font-bold uppercase tracking-wider text-amber-900/50">{s.label}</span>
                                        </div>
                                        <p className="text-[10px] text-amber-900/35 font-medium mb-2">{s.subtitle}</p>
                                        <p className="text-2xl font-black text-amber-900" title={s.adcTooltip}>{s.value}</p>
                                    </Card>
                                ))}
                            </div>
                        </motion.div>
                    )}

                    {/* ── Right row 3: Latest Prediction ──────────────────── */}
                    {selectedHive && (
                        <motion.div
                            key={selectedHive.id + '-p'}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 }}
                            className="lg:col-span-7 lg:col-start-6 lg:row-start-3"
                        >
                            <Card className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                <div>
                                    <p className="text-xs font-bold uppercase tracking-widest text-amber-900/40 mb-1">Latest Prediction</p>
                                    <ReadinessBadge level={selectedHive.readiness_level} />
                                    {!selectedHive.readiness_level && (
                                        <p className="text-xs text-amber-900/40 mt-2">
                                            Predictions appear once sensor data has been collected and processed by the ML model.
                                        </p>
                                    )}
                                </div>
                                <Link
                                    href={route('predictions.live', { hive: selectedHive.id })}
                                    className="self-start sm:self-auto shrink-0 flex items-center gap-2 bg-amber-100 hover:bg-amber-200 text-amber-900 px-4 py-2 rounded-full text-sm font-bold transition-colors"
                                >
                                    <Activity className="w-4 h-4" />
                                    View Live Predictions
                                </Link>
                            </Card>
                        </motion.div>
                    )}

                </div>
            </div>
        </AuthenticatedLayout>
    );
}
