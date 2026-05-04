import { Head, Link, usePage } from '@inertiajs/react';
import { Bug as Bee, MapPin, Thermometer, Droplets, BarChart3, Wind, Leaf, LineChart, Activity } from 'lucide-react';
import { motion } from 'motion/react';
import { useState } from 'react';
import { BeekeeperTabs } from '@/components/core/beekeeper-tabs';
import { Card } from '@/components/core/card';
import { Alert, Progress } from '@/components/core/feedback';
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

function HiveListCard({
    hive,
    isSelected,
    onSelect,
}: {
    hive: HiveCard;
    isSelected: boolean;
    onSelect: () => void;
}) {
    return (
        <motion.div whileHover={{ y: -2 }} whileTap={{ scale: 0.98 }} className="h-full">
            <Card
                className={cn(
                    'h-full cursor-pointer border-2 transition-all lg:min-h-[182px]',
                    isSelected
                        ? 'border-yellow-400 ring-4 ring-yellow-400/10'
                        : 'border-gray-200',
                )}
                onClick={onSelect}
            >
                <div className="mb-4 flex items-start justify-between gap-3">
                    <div className="min-w-0">
                        <h3 className="text-lg font-bold text-amber-900">
                            {hive.name}
                        </h3>
                        <p className="text-sm italic text-amber-700">
                            {hive.species ?? 'Unknown species'}
                        </p>
                    </div>
                    {hive.location && (
                        <div className="flex shrink-0 items-center gap-1 rounded-lg bg-yellow-50 p-1.5 text-xs text-amber-700">
                            <MapPin className="h-3 w-3" /> {hive.location}
                        </div>
                    )}
                </div>
                <div className="mb-4 grid grid-cols-3 gap-4 text-sm">
                    <div className="flex flex-col gap-1">
                        <span className="text-[10px] font-medium tracking-wider text-amber-600/60 uppercase">
                            Age
                        </span>
                        <span className="font-semibold">{hive.age_months}m</span>
                    </div>
                    <div className="flex flex-col gap-1">
                        <span className="text-[10px] font-medium tracking-wider text-amber-600/60 uppercase">
                            Harvests
                        </span>
                        <span className="font-semibold">
                            {hive.harvest_count}
                        </span>
                    </div>
                    <div className="flex flex-col gap-1">
                        <span className="text-[10px] font-medium tracking-wider text-amber-600/60 uppercase">
                            Status
                        </span>
                        <span
                            className={cn(
                                'text-xs font-semibold',
                                hive.status === 'active'
                                    ? 'text-emerald-600'
                                    : 'text-rose-500',
                            )}
                        >
                            {hive.status === 'active' ? 'Active' : 'Inactive'}
                        </span>
                    </div>
                </div>
                <div className="mt-auto space-y-1">
                    <div className="flex justify-between text-[10px] font-bold tracking-widest text-amber-900/40 uppercase">
                        <span>Readiness</span>
                        <span>{Math.round(hive.hri_value * 100)}%</span>
                    </div>
                    <Progress
                        value={hive.hri_value * 100}
                        barColor={
                            READINESS_BAR_COLOR[hive.readiness_level ?? ''] ??
                            'bg-yellow-400'
                        }
                    />
                </div>
            </Card>
        </motion.div>
    );
}

function ReadinessBadge({ level }: { level: string | null }) {
    if (!level) {
        return <span className="text-amber-900/40 text-sm">No data yet</span>;
    }

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

                <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:items-stretch lg:gap-6">

                    <div className="flex flex-col gap-4">
                        {/* ── Left: no hives empty state ──────────────────── */}
                        {hives.length === 0 && (
                            <div className="rounded-3xl border-4 border-dashed border-yellow-200 py-16 text-center lg:min-h-[560px]">
                                <div className="mb-4 inline-block rounded-full bg-yellow-100 p-6">
                                    <Bee className="h-10 w-10 text-yellow-600" />
                                </div>
                                <p className="font-semibold text-amber-900">
                                    No hives assigned yet.
                                </p>
                                <p className="mt-1 text-sm text-amber-700/60">
                                    Contact your admin to register a hive.
                                </p>
                            </div>
                        )}

                        {/* ── Left: hive list ─────────────────────────────── */}
                        {hives.map((hive) => (
                            <HiveListCard
                                key={hive.id}
                                hive={hive}
                                isSelected={selectedHive?.id === hive.id}
                                onSelect={() => setSelectedHive(hive)}
                            />
                        ))}
                    </div>

                    {/* ── Right column ───────────────────────────────────── */}
                    {selectedHive ? (
                        <motion.div
                            key={selectedHive.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="flex flex-col gap-4 lg:h-full"
                        >
                            <div className="flex flex-col gap-2 lg:flex-[1.15]">
                                <p className="text-xs font-bold uppercase tracking-widest text-amber-900/40">
                                    Viewing:{' '}
                                    <span className="text-amber-900">
                                        {selectedHive.name}
                                    </span>
                                </p>
                                <Card className="relative flex flex-1 overflow-hidden border-none bg-gradient-to-br from-yellow-400 to-amber-500 p-8 text-white">
                                    <div className="absolute top-0 right-0 p-8 opacity-10">
                                        <Leaf className="h-32 w-32" />
                                    </div>
                                    <div className="relative z-10 flex h-full w-full flex-col">
                                        <div className="mb-2 flex items-center justify-between gap-3">
                                            <div className="flex items-center gap-2">
                                                <Leaf className="h-5 w-5" />
                                                <span className="text-sm font-bold tracking-widest opacity-80 uppercase">
                                                    Readiness Score
                                                </span>
                                            </div>
                                            <Link
                                                href={route('analytics.show', {
                                                    hive: selectedHive.id,
                                                })}
                                                className="flex items-center gap-2 rounded-full bg-white/20 px-4 py-2 text-sm font-bold backdrop-blur-sm transition-colors hover:bg-white/30"
                                            >
                                                <LineChart className="h-4 w-4" />
                                                Analytics
                                            </Link>
                                        </div>
                                        <div className="flex items-baseline gap-4">
                                            <span className="text-7xl font-black tracking-tighter">
                                                {Math.round(
                                                    selectedHive.hri_value *
                                                        100,
                                                )}
                                                %
                                            </span>
                                            <div className="rounded-full bg-white/20 px-4 py-1 text-sm font-bold backdrop-blur-sm">
                                                {selectedHive.readiness_level
                                                    ? (READINESS_LABELS[
                                                          selectedHive
                                                              .readiness_level
                                                      ] ??
                                                      selectedHive.readiness_level)
                                                    : 'No prediction yet'}
                                            </div>
                                        </div>
                                        {selectedHive.readiness_level &&
                                            selectedHive.readiness_level !==
                                                'ready' && (
                                                <div className="mt-3 mb-1">
                                                    <p className="mb-2 text-xs opacity-70">
                                                        Hive needs more time to
                                                        mature. Target: 80%
                                                        readiness for harvest.
                                                    </p>
                                                    <div className="relative h-2 w-full overflow-visible rounded-full bg-white/20">
                                                        <div
                                                            className="h-full rounded-full bg-white/70"
                                                            style={{
                                                                width: `${Math.min(Math.round(selectedHive.hri_value * 100), 100)}%`,
                                                            }}
                                                        />
                                                        <div
                                                            className="absolute top-1/2 h-4 w-0.5 -translate-y-1/2 rounded-full bg-white"
                                                            style={{
                                                                left: '80%',
                                                            }}
                                                            title="80% harvest target"
                                                        />
                                                    </div>
                                                    <div className="mt-1 flex justify-between text-[10px] opacity-60">
                                                        <span>0%</span>
                                                        <span>Target 80%</span>
                                                        <span>100%</span>
                                                    </div>
                                                </div>
                                            )}
                                        <div className="mt-auto flex items-center gap-6 pt-4">
                                            <div>
                                                <p className="mb-1 text-xs font-bold tracking-wider opacity-70 uppercase">
                                                    Total Harvests
                                                </p>
                                                <p className="text-xl font-bold">
                                                    {selectedHive.harvest_count}
                                                </p>
                                            </div>
                                            <div className="h-10 w-px bg-white/20" />
                                            <div>
                                                <p className="mb-1 text-xs font-bold tracking-wider opacity-70 uppercase">
                                                    Hive Age
                                                </p>
                                                <p className="text-xl font-bold">
                                                    {selectedHive.age_months}{' '}
                                                    months
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </Card>
                            </div>

                            {(selectedHive.avg_temperature != null ||
                                selectedHive.avg_humidity != null ||
                                selectedHive.avg_mq2 != null) && (
                                <div className="lg:flex-[1]">
                                    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                                        {[
                                            {
                                                icon: Thermometer,
                                                color: 'text-orange-400',
                                                label: 'Avg Temp',
                                                subtitle: 'DHT11',
                                                adcTooltip: undefined,
                                                value:
                                                    selectedHive.avg_temperature !=
                                                    null
                                                        ? `${selectedHive.avg_temperature}°C`
                                                        : '—',
                                            },
                                            {
                                                icon: Droplets,
                                                color: 'text-blue-400',
                                                label: 'Avg Humidity',
                                                subtitle: 'DHT11',
                                                adcTooltip: undefined,
                                                value:
                                                    selectedHive.avg_humidity !=
                                                    null
                                                        ? `${selectedHive.avg_humidity}%`
                                                        : '—',
                                            },
                                            {
                                                icon: BarChart3,
                                                color: 'text-purple-400',
                                                label: 'Avg MQ2',
                                                subtitle: 'Air Quality',
                                                adcTooltip:
                                                    'Raw sensor reading (Analog-to-Digital Converter)',
                                                value:
                                                    selectedHive.avg_mq2 != null
                                                        ? `${selectedHive.avg_mq2} ADC`
                                                        : '—',
                                            },
                                            {
                                                icon: Wind,
                                                color: 'text-teal-400',
                                                label: 'Avg MQ3',
                                                subtitle: 'Gas Sensor',
                                                adcTooltip:
                                                    'Raw sensor reading (Analog-to-Digital Converter)',
                                                value:
                                                    selectedHive.avg_mq3 != null
                                                        ? `${selectedHive.avg_mq3} ADC`
                                                        : '—',
                                            },
                                            {
                                                icon: Wind,
                                                color: 'text-cyan-400',
                                                label: 'Avg MQ5',
                                                subtitle: 'LPG/Smoke',
                                                adcTooltip:
                                                    'Raw sensor reading (Analog-to-Digital Converter)',
                                                value:
                                                    selectedHive.avg_mq5 != null
                                                        ? `${selectedHive.avg_mq5} ADC`
                                                        : '—',
                                            },
                                            {
                                                icon: Wind,
                                                color: 'text-indigo-400',
                                                label: 'Avg MQ135',
                                                subtitle: 'CO2/Air',
                                                adcTooltip:
                                                    'Raw sensor reading (Analog-to-Digital Converter)',
                                                value:
                                                    selectedHive.avg_mq135 !=
                                                    null
                                                        ? `${selectedHive.avg_mq135} ADC`
                                                        : '—',
                                            },
                                        ].map((s) => (
                                            <Card
                                                key={s.label}
                                                className="flex h-full flex-col justify-between p-5"
                                            >
                                                <div className="mb-1 flex items-center gap-2">
                                                    <s.icon
                                                        className={`h-4 w-4 ${s.color}`}
                                                    />
                                                    <span className="text-xs font-bold tracking-wider text-amber-900/50 uppercase">
                                                        {s.label}
                                                    </span>
                                                </div>
                                                <p className="mb-2 text-[10px] font-medium text-amber-900/35">
                                                    {s.subtitle}
                                                </p>
                                                <p
                                                    className="text-2xl font-black text-amber-900"
                                                    title={s.adcTooltip}
                                                >
                                                    {s.value}
                                                </p>
                                            </Card>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <div className="lg:flex-[0.65]">
                                <Card className="flex h-full flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                    <div>
                                        <p className="mb-1 text-xs font-bold tracking-widest text-amber-900/40 uppercase">
                                            Latest Prediction
                                        </p>
                                        <ReadinessBadge
                                            level={selectedHive.readiness_level}
                                        />
                                        {!selectedHive.readiness_level && (
                                            <p className="mt-2 text-xs text-amber-900/40">
                                                Predictions appear once sensor
                                                data has been collected and
                                                processed by the ML model.
                                            </p>
                                        )}
                                    </div>
                                    <Link
                                        href={route('predictions.live', {
                                            hive: selectedHive.id,
                                        })}
                                        className="flex shrink-0 items-center gap-2 self-start rounded-full bg-amber-100 px-4 py-2 text-sm font-bold text-amber-900 transition-colors hover:bg-amber-200 sm:self-auto lg:min-w-[220px] lg:justify-center"
                                    >
                                        <Activity className="h-4 w-4" />
                                        View Live Predictions
                                    </Link>
                                </Card>
                            </div>
                        </motion.div>
                    ) : (
                        <motion.div
                            key="empty"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="flex min-h-[400px] flex-col items-center justify-center rounded-3xl border-4 border-dashed border-yellow-200 p-12 text-center lg:min-h-full"
                        >
                            <div className="mb-6 rounded-full bg-yellow-100 p-6">
                                <Bee className="w-10 h-10 text-yellow-600" />
                            </div>
                            <h3 className="mb-2 text-2xl font-bold text-amber-900">
                                Select a Hive
                            </h3>
                            <p className="max-w-xs text-amber-700">
                                Choose one of your hives from the list to see
                                its readiness score and sensor summary.
                            </p>
                        </motion.div>
                    )}
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
