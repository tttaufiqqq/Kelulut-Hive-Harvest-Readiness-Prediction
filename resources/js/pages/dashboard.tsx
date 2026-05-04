import { Head, Link, usePage } from '@inertiajs/react';
import {
    Activity,
    BarChart3,
    Bug as Bee,
    Droplets,
    Leaf,
    LineChart,
    MapPin,
    Thermometer,
    Wind,
} from 'lucide-react';
import { motion } from 'motion/react';
import { useState } from 'react';
import { BeekeeperTabs } from '@/components/core/beekeeper-tabs';
import { Card } from '@/components/core/card';
import { Progress } from '@/components/core/feedback';
import { FlashAlerts } from '@/components/core/flash-alerts';
import type { FlashMessageBag } from '@/components/core/flash-alerts';
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
    not_ready: 'Not Ready',
    approaching: 'Approaching',
    nearly_ready: 'Nearly Ready',
    ready: 'Ready to Harvest',
};

const READINESS_STYLES: Record<string, string> = {
    not_ready: 'bg-rose-100 text-rose-700',
    approaching: 'bg-amber-100 text-amber-700',
    nearly_ready: 'bg-yellow-100 text-yellow-700',
    ready: 'bg-emerald-100 text-emerald-700',
};

const READINESS_BAR_COLOR: Record<string, string> = {
    not_ready: 'bg-rose-400',
    approaching: 'bg-amber-400',
    nearly_ready: 'bg-yellow-400',
    ready: 'bg-emerald-400',
};

const PREDICTION_CONTENT: Record<
    string,
    { accent: string; description: string }
> = {
    not_ready: {
        accent: 'border-l-rose-500',
        description:
            'The hive still needs more maturation time before harvest conditions are reliable.',
    },
    approaching: {
        accent: 'border-l-amber-400',
        description:
            'The readiness trend is improving. Keep monitoring for a stronger harvest window.',
    },
    nearly_ready: {
        accent: 'border-l-amber-500',
        description:
            'This hive is close to harvest range. Review the latest trend before making a visit.',
    },
    ready: {
        accent: 'border-l-emerald-500',
        description:
            'Signals are aligned for harvest. Open live predictions to confirm the latest reading.',
    },
};

function getPredictionContent(level: string | null) {
    if (!level) {
        return {
            accent: 'border-l-stone-300',
            description:
                'Predictions will appear once enough sensor data has been collected and processed by the model.',
        };
    }

    return (
        PREDICTION_CONTENT[level] ?? {
            accent: 'border-l-amber-300',
            description:
                'Monitor this hive in live predictions for the latest model output and sensor context.',
        }
    );
}

function HiveListCard({
    hive,
    isSelected,
    onSelect,
}: {
    hive: HiveCard;
    isSelected: boolean;
    onSelect: () => void;
}) {
    const readinessPercent = Math.round(hive.hri_value * 100);

    return (
        <motion.div
            whileHover={{ y: -3 }}
            whileTap={{ scale: 0.995 }}
            className="h-full"
        >
            <Card
                className={cn(
                    'group flex h-full cursor-pointer flex-col gap-4 border border-l-4 border-transparent bg-white/90 shadow-[0_16px_35px_-34px_rgba(120,53,15,0.9)] transition-all duration-200 lg:min-h-[188px]',
                    isSelected
                        ? 'border-l-yellow-400 bg-amber-50/80 shadow-[0_22px_44px_-34px_rgba(120,53,15,0.8)] ring-1 ring-amber-200/80'
                        : 'border-l-transparent shadow-none hover:bg-white hover:shadow-[0_20px_40px_-34px_rgba(120,53,15,0.65)] hover:ring-1 hover:ring-amber-100',
                )}
                onClick={onSelect}
            >
                <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                        <h3 className="text-lg font-bold text-amber-900">
                            {hive.name}
                        </h3>
                        <p className="mt-1 text-sm text-amber-900/50">
                            {hive.species ?? 'Unknown species'}
                        </p>
                    </div>
                    {hive.location && (
                        <div className="flex shrink-0 items-center gap-1.5 rounded-full bg-white/80 px-3 py-1.5 text-xs font-medium text-amber-900/70 shadow-sm">
                            <MapPin className="h-3.5 w-3.5" />
                            {hive.location}
                        </div>
                    )}
                </div>

                <div className="grid grid-cols-3 gap-4 text-sm">
                    <div className="flex flex-col gap-1">
                        <span className="text-xs font-bold tracking-widest text-amber-900/40 uppercase">
                            Age
                        </span>
                        <span className="font-medium text-amber-950">
                            {hive.age_months}m
                        </span>
                    </div>
                    <div className="flex flex-col gap-1">
                        <span className="text-xs font-bold tracking-widest text-amber-900/40 uppercase">
                            Harvests
                        </span>
                        <span className="font-medium text-amber-950">
                            {hive.harvest_count}
                        </span>
                    </div>
                    <div className="flex flex-col gap-1">
                        <span className="text-xs font-bold tracking-widest text-amber-900/40 uppercase">
                            Status
                        </span>
                        <span
                            className={cn(
                                'font-medium',
                                hive.status === 'active'
                                    ? 'text-emerald-700'
                                    : 'text-rose-600',
                            )}
                        >
                            {hive.status === 'active' ? 'Active' : 'Inactive'}
                        </span>
                    </div>
                </div>

                <div className="mt-auto space-y-2">
                    <div className="flex items-center justify-between text-xs font-bold tracking-widest text-amber-900/40 uppercase">
                        <span>Readiness</span>
                        <span>{readinessPercent}%</span>
                    </div>
                    <Progress
                        value={hive.hri_value * 100}
                        barColor={
                            READINESS_BAR_COLOR[hive.readiness_level ?? ''] ??
                            'bg-yellow-400'
                        }
                        showZeroPlaceholder
                    />
                </div>
            </Card>
        </motion.div>
    );
}

function ReadinessBadge({
    level,
    className,
}: {
    level: string | null;
    className?: string;
}) {
    const label = level ? (READINESS_LABELS[level] ?? level) : 'Awaiting Data';
    const tone = level
        ? (READINESS_STYLES[level] ?? 'bg-stone-100 text-stone-700')
        : 'bg-stone-100 text-stone-700';

    return (
        <span
            className={cn(
                'inline-flex items-center rounded-full px-3.5 py-1.5 text-sm font-bold shadow-sm',
                tone,
                className,
            )}
        >
            {label}
        </span>
    );
}

export default function Dashboard({ hives }: Props) {
    const { props } = usePage<{ flash?: FlashMessageBag }>();
    const flash = props.flash;

    const [selectedHive, setSelectedHive] = useState<HiveCard | null>(
        () => hives[0] ?? null,
    );

    const predictionContent = getPredictionContent(
        selectedHive?.readiness_level ?? null,
    );

    return (
        <AuthenticatedLayout>
            <Head title="My Hives" />

            <div className="mx-auto flex h-full max-w-7xl flex-col gap-6 p-6 md:p-8 lg:min-h-0 lg:px-10 lg:py-8">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <Breadcrumbs
                        items={[
                            { label: 'Home', href: '/' },
                            { label: 'My Hives' },
                        ]}
                    />
                    <BeekeeperTabs active="dashboard" />
                </div>

                <FlashAlerts
                    key={flash?.id ?? 'dashboard-flash'}
                    flash={flash}
                />

                <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
                    <div>
                        <h1 className="text-lg font-bold text-amber-900">
                            Your Hives
                        </h1>
                        <p className="text-sm text-amber-900/50">
                            Monitor readiness, recent sensor trends, and live
                            predictions from one dashboard.
                        </p>
                    </div>
                </div>

                <div className="grid min-h-0 flex-1 grid-cols-1 gap-6 lg:grid-cols-[minmax(0,7fr)_minmax(0,13fr)] lg:items-stretch">
                    <div className="flex min-h-0 flex-col gap-4 lg:overflow-y-auto lg:pr-2">
                        {hives.length === 0 && (
                            <Card className="flex min-h-[340px] flex-col items-center justify-center border-2 border-dashed border-yellow-200 bg-white/70 text-center shadow-none lg:min-h-full">
                                <div className="mb-4 rounded-full bg-yellow-100 p-6">
                                    <Bee className="h-10 w-10 text-yellow-600" />
                                </div>
                                <p className="text-lg font-bold text-amber-900">
                                    No hives assigned yet.
                                </p>
                                <p className="mt-2 max-w-sm text-sm text-amber-900/50">
                                    Contact your admin to register a hive and
                                    start tracking readiness data here.
                                </p>
                            </Card>
                        )}

                        {hives.map((hive) => (
                            <HiveListCard
                                key={hive.id}
                                hive={hive}
                                isSelected={selectedHive?.id === hive.id}
                                onSelect={() => setSelectedHive(hive)}
                            />
                        ))}
                    </div>

                    {selectedHive ? (
                        <motion.div
                            key={selectedHive.id}
                            initial={{ opacity: 0, y: 16 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="flex h-full min-h-0 flex-col gap-6 lg:overflow-y-auto lg:pr-1"
                        >
                            <Card className="relative overflow-hidden border-none bg-gradient-to-br from-[#f7c94a] via-[#eda521] to-[#d78914] p-6 text-amber-950 shadow-[0_30px_60px_-38px_rgba(120,53,15,0.75)] sm:p-8">
                                <div className="absolute inset-y-0 right-0 w-56 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.24),transparent_68%)]" />
                                <div className="absolute top-0 right-0 p-6 opacity-[0.14]">
                                    <Leaf className="h-36 w-36" />
                                </div>

                                <div className="relative z-10 flex h-full flex-col gap-6">
                                    <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                                        <div className="min-w-0 space-y-4">
                                            <div className="flex items-center gap-2 text-xs font-bold tracking-widest text-amber-950/55 uppercase">
                                                <Leaf className="h-4 w-4" />
                                                Readiness Score
                                            </div>
                                            <div className="space-y-3">
                                                <div>
                                                    <p className="text-xs font-bold tracking-widest text-amber-950/50 uppercase">
                                                        Viewing
                                                    </p>
                                                    <h2 className="mt-1 text-lg font-bold text-amber-950 sm:text-xl">
                                                        {selectedHive.name}
                                                    </h2>
                                                </div>
                                                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
                                                    <div className="flex flex-wrap items-center gap-2 text-sm text-amber-950/70">
                                                        <span>
                                                            {selectedHive.species ??
                                                                'Unknown species'}
                                                        </span>
                                                        {selectedHive.location && (
                                                            <span className="inline-flex max-w-full items-center gap-1.5 rounded-full bg-white/35 px-3 py-1 text-xs font-medium text-amber-950/80 backdrop-blur-sm">
                                                                <MapPin className="h-3.5 w-3.5 shrink-0" />
                                                                <span className="truncate">
                                                                    {
                                                                        selectedHive.location
                                                                    }
                                                                </span>
                                                            </span>
                                                        )}
                                                    </div>

                                                    <Link
                                                        href={route(
                                                            'analytics.show',
                                                            {
                                                                hive: selectedHive.id,
                                                            },
                                                        )}
                                                        className="inline-flex w-full items-center justify-center gap-2 self-start rounded-full border border-white/45 bg-white/70 px-4 py-2.5 text-sm font-semibold text-amber-950 shadow-sm backdrop-blur-sm transition-colors hover:bg-white/85 sm:w-auto lg:self-start"
                                                    >
                                                        <LineChart className="h-4 w-4" />
                                                        Analytics
                                                    </Link>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
                                        <div className="flex flex-wrap items-end gap-4">
                                            <span className="text-5xl font-black text-amber-950 sm:text-6xl">
                                                {Math.round(
                                                    selectedHive.hri_value *
                                                        100,
                                                )}
                                                %
                                            </span>
                                            <ReadinessBadge
                                                level={
                                                    selectedHive.readiness_level
                                                }
                                            />
                                        </div>

                                        <div className="grid gap-4 sm:grid-cols-2 xl:min-w-[320px]">
                                            <div className="rounded-2xl bg-white/22 px-4 py-3 backdrop-blur-sm">
                                                <p className="mb-1 text-xs font-bold tracking-widest text-amber-950/45 uppercase">
                                                    Total Harvests
                                                </p>
                                                <p className="text-3xl font-black text-amber-950">
                                                    {selectedHive.harvest_count}
                                                </p>
                                            </div>
                                            <div className="rounded-2xl bg-white/22 px-4 py-3 backdrop-blur-sm">
                                                <p className="mb-1 text-xs font-bold tracking-widest text-amber-950/45 uppercase">
                                                    Hive Age
                                                </p>
                                                <p className="text-3xl font-black text-amber-950">
                                                    {selectedHive.age_months}{' '}
                                                    <span className="text-base font-medium">
                                                        months
                                                    </span>
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    {selectedHive.readiness_level &&
                                        selectedHive.readiness_level !==
                                            'ready' && (
                                            <div className="rounded-2xl bg-white/18 p-4 backdrop-blur-sm">
                                                <div className="flex flex-wrap items-center justify-between gap-2">
                                                    <p className="text-sm font-medium text-amber-950">
                                                        Harvest target guidance
                                                    </p>
                                                    <p className="text-xs font-bold tracking-widest text-amber-950/45 uppercase">
                                                        Target 80%
                                                    </p>
                                                </div>
                                                <p className="mt-2 text-sm text-amber-950/70">
                                                    This hive still needs more
                                                    time before it reaches the
                                                    recommended harvest
                                                    threshold.
                                                </p>
                                                <div className="relative mt-4 h-2 w-full overflow-visible rounded-full bg-amber-950/12">
                                                    <div
                                                        className="h-full rounded-full bg-amber-950/55"
                                                        style={{
                                                            width: `${Math.min(Math.round(selectedHive.hri_value * 100), 100)}%`,
                                                        }}
                                                    />
                                                    <div
                                                        className="absolute top-1/2 h-4 w-0.5 -translate-y-1/2 rounded-full bg-amber-950"
                                                        style={{ left: '80%' }}
                                                        title="80% harvest target"
                                                    />
                                                </div>
                                                <div className="mt-2 flex justify-between text-xs font-bold text-amber-950/45">
                                                    <span>0%</span>
                                                    <span>80%</span>
                                                    <span>100%</span>
                                                </div>
                                            </div>
                                        )}
                                </div>
                            </Card>

                            {(selectedHive.avg_temperature != null ||
                                selectedHive.avg_humidity != null ||
                                selectedHive.avg_mq2 != null ||
                                selectedHive.avg_mq3 != null ||
                                selectedHive.avg_mq5 != null ||
                                selectedHive.avg_mq135 != null) && (
                                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
                                    {[
                                        {
                                            icon: Thermometer,
                                            color: 'text-orange-500',
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
                                            color: 'text-sky-500',
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
                                            color: 'text-fuchsia-500',
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
                                            color: 'text-teal-500',
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
                                            color: 'text-cyan-500',
                                            label: 'Avg MQ5',
                                            subtitle: 'LPG / Smoke',
                                            adcTooltip:
                                                'Raw sensor reading (Analog-to-Digital Converter)',
                                            value:
                                                selectedHive.avg_mq5 != null
                                                    ? `${selectedHive.avg_mq5} ADC`
                                                    : '—',
                                        },
                                        {
                                            icon: Wind,
                                            color: 'text-indigo-500',
                                            label: 'Avg MQ135',
                                            subtitle: 'CO2 / Air',
                                            adcTooltip:
                                                'Raw sensor reading (Analog-to-Digital Converter)',
                                            value:
                                                selectedHive.avg_mq135 != null
                                                    ? `${selectedHive.avg_mq135} ADC`
                                                    : '—',
                                        },
                                    ].map((sensor) => (
                                        <Card
                                            key={sensor.label}
                                            className="group flex h-full flex-col justify-between border border-amber-100/80 bg-white/95 transition-all duration-200 hover:-translate-y-0.5 hover:border-amber-200 hover:shadow-[0_22px_40px_-34px_rgba(120,53,15,0.75)]"
                                        >
                                            <div className="mb-4 flex items-start justify-between gap-3">
                                                <div className="rounded-2xl bg-amber-50 p-2.5">
                                                    <sensor.icon
                                                        className={`h-5 w-5 ${sensor.color}`}
                                                    />
                                                </div>
                                                <div className="min-w-0 text-right">
                                                    <p className="text-xs font-bold tracking-widest text-amber-900/50 uppercase">
                                                        {sensor.label}
                                                    </p>
                                                    <p className="mt-1 text-sm text-amber-900/50">
                                                        {sensor.subtitle}
                                                    </p>
                                                </div>
                                            </div>
                                            <p
                                                className="text-3xl font-black text-amber-900"
                                                title={sensor.adcTooltip}
                                            >
                                                {sensor.value}
                                            </p>
                                        </Card>
                                    ))}
                                </div>
                            )}

                            <Card
                                className={cn(
                                    'border border-l-4 border-amber-100/80 bg-white p-6 shadow-sm',
                                    predictionContent.accent,
                                )}
                            >
                                <div className="flex flex-col gap-4 sm:grid sm:grid-cols-[minmax(0,220px)_minmax(0,1fr)_auto] sm:items-center sm:gap-6">
                                    <div>
                                        <p className="text-xs font-bold tracking-widest text-amber-900/40 uppercase">
                                            Latest Prediction
                                        </p>
                                        <div className="mt-3">
                                            <ReadinessBadge
                                                level={
                                                    selectedHive.readiness_level
                                                }
                                            />
                                        </div>
                                    </div>

                                    <p className="text-sm text-amber-900/50">
                                        {predictionContent.description}
                                    </p>

                                    <Link
                                        href={route('predictions.live', {
                                            hive: selectedHive.id,
                                        })}
                                        className="inline-flex min-w-[220px] items-center justify-center gap-2 rounded-full bg-amber-100 px-4 py-3 text-sm font-semibold text-amber-950 transition-colors hover:bg-amber-200"
                                    >
                                        <Activity className="h-4 w-4" />
                                        View Live Predictions
                                    </Link>
                                </div>
                            </Card>
                        </motion.div>
                    ) : (
                        <motion.div
                            key="empty"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="flex min-h-[380px] flex-col items-center justify-center rounded-3xl border-2 border-dashed border-yellow-200 bg-white/60 p-12 text-center lg:min-h-full"
                        >
                            <div className="mb-6 rounded-full bg-yellow-100 p-6">
                                <Bee className="h-10 w-10 text-yellow-600" />
                            </div>
                            <h3 className="mb-2 text-lg font-bold text-amber-900">
                                Select a Hive
                            </h3>
                            <p className="max-w-sm text-sm text-amber-900/50">
                                Choose one of your hives from the list to review
                                readiness, sensor averages, and live prediction
                                details.
                            </p>
                        </motion.div>
                    )}
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
