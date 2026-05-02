import { Head, Link, usePage } from '@inertiajs/react';
import { Bug as Bee, MapPin, Thermometer, Droplets, BarChart3, Wind, Leaf, LineChart } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
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

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

                    {/* Left: Hive list */}
                    <div className="lg:col-span-5 space-y-6">
                        <div className="flex items-center justify-between">
                            <h3 className="text-xl font-bold text-amber-900">Your Hives</h3>
                        </div>

                        {hives.length === 0 ? (
                            <div className="text-center py-16 border-4 border-dashed border-yellow-200 rounded-3xl">
                                <div className="bg-yellow-100 p-6 rounded-full mb-4 inline-block">
                                    <Bee className="w-10 h-10 text-yellow-600" />
                                </div>
                                <p className="text-amber-900 font-semibold">No hives assigned yet.</p>
                                <p className="text-amber-700/60 text-sm mt-1">Contact your admin to register a hive.</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {hives.map((hive) => (
                                    <motion.div key={hive.id} whileHover={{ y: -2 }} whileTap={{ scale: 0.98 }}>
                                        <Card
                                            className={cn(
                                                'cursor-pointer transition-all border-2',
                                                selectedHive?.id === hive.id
                                                    ? 'border-yellow-400 ring-4 ring-yellow-400/10'
                                                    : 'border-transparent'
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
                            </div>
                        )}
                    </div>

                    {/* Right: Detail panel */}
                    <div className="lg:col-span-7">
                        <AnimatePresence mode="wait">
                            {selectedHive ? (
                                <motion.div
                                    key={selectedHive.id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                    className="space-y-6"
                                >
                                    <Card className="bg-gradient-to-br from-yellow-400 to-amber-500 text-white border-none p-8 relative overflow-hidden">
                                        <div className="absolute top-0 right-0 p-8 opacity-10">
                                            <Leaf className="w-32 h-32" />
                                        </div>
                                        <div className="relative z-10">
                                            <div className="flex items-center gap-2 mb-2">
                                                <Leaf className="w-5 h-5" />
                                                <span className="text-sm font-bold uppercase tracking-widest opacity-80">Readiness Score</span>
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
                                            <div className="mt-6 flex items-center justify-between">
                                                <div className="flex items-center gap-6">
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
                                                <Link
                                                    href={route('analytics.show', { hive: selectedHive.id })}
                                                    className="flex items-center gap-2 bg-white/20 hover:bg-white/30 backdrop-blur-sm px-4 py-2 rounded-full text-sm font-bold transition-colors"
                                                >
                                                    <LineChart className="w-4 h-4" />
                                                    Analytics
                                                </Link>
                                            </div>
                                        </div>
                                    </Card>

                                    {(selectedHive.avg_temperature !== null || selectedHive.avg_humidity !== null || selectedHive.avg_mq2 !== null) && (
                                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                                            {[
                                                { icon: Thermometer, color: 'text-orange-400', label: 'Avg Temp',     value: selectedHive.avg_temperature !== null ? `${selectedHive.avg_temperature}°C` : '—' },
                                                { icon: Droplets,    color: 'text-blue-400',   label: 'Avg Humidity', value: selectedHive.avg_humidity    !== null ? `${selectedHive.avg_humidity}%`    : '—' },
                                                { icon: BarChart3,   color: 'text-purple-400', label: 'Avg MQ2',      value: selectedHive.avg_mq2         !== null ? `${selectedHive.avg_mq2} ADC`      : '—' },
                                                { icon: Wind,        color: 'text-teal-400',   label: 'Avg MQ3',      value: selectedHive.avg_mq3         !== null ? `${selectedHive.avg_mq3} ADC`      : '—' },
                                                { icon: Wind,        color: 'text-cyan-400',   label: 'Avg MQ5',      value: selectedHive.avg_mq5         !== null ? `${selectedHive.avg_mq5} ADC`      : '—' },
                                                { icon: Wind,        color: 'text-indigo-400', label: 'Avg MQ135',    value: selectedHive.avg_mq135       !== null ? `${selectedHive.avg_mq135} ADC`    : '—' },
                                            ].map((s) => (
                                                <Card key={s.label} className="flex flex-col justify-between">
                                                    <div className="flex items-center gap-2 mb-2">
                                                        <s.icon className={`w-4 h-4 ${s.color}`} />
                                                        <span className="text-xs font-bold uppercase tracking-wider text-amber-900/50">{s.label}</span>
                                                    </div>
                                                    <p className="text-2xl font-black text-amber-900">{s.value}</p>
                                                </Card>
                                            ))}
                                        </div>
                                    )}

                                    <Card className="flex items-center justify-between gap-4">
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
                                            href={route('analytics.show', { hive: selectedHive.id })}
                                            className="shrink-0 flex items-center gap-2 bg-amber-100 hover:bg-amber-200 text-amber-900 px-4 py-2 rounded-full text-sm font-bold transition-colors"
                                        >
                                            <LineChart className="w-4 h-4" />
                                            Full Analytics
                                        </Link>
                                    </Card>
                                </motion.div>
                            ) : (
                                <motion.div
                                    key="empty"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    className="h-full flex flex-col items-center justify-center min-h-[400px] text-center p-12 border-4 border-dashed border-yellow-200 rounded-3xl"
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
                        </AnimatePresence>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
