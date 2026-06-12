import { Link } from '@inertiajs/react';
import {
    Activity,
    BarChart3,
    Droplets,
    Leaf,
    LineChart,
    Thermometer,
    Wind,
} from 'lucide-react';
import { motion } from 'motion/react';
import { Card } from '@/components/core/display/card';
import { MetricCard, ReadinessBadge } from '@/components/core/readiness-chart-cards';
import { cn } from '@/lib/utils';
import type { HiveCard } from './HiveListCard';

interface Props {
    hive: HiveCard;
    predictionContent: { accent: string; description: string };
}

const SENSOR_CARDS = (hive: HiveCard) => [
    { icon: Thermometer, color: 'text-orange-500', label: 'Avg Temp', subtitle: 'DHT11', adcTooltip: undefined, value: hive.avg_temperature != null ? `${hive.avg_temperature}°C` : '—' },
    { icon: Droplets, color: 'text-sky-500', label: 'Avg Humidity', subtitle: 'DHT11', adcTooltip: undefined, value: hive.avg_humidity != null ? `${hive.avg_humidity}%` : '—' },
    { icon: BarChart3, color: 'text-fuchsia-500', label: 'Avg MQ2', subtitle: 'Air Quality', adcTooltip: 'Raw sensor reading (Analog-to-Digital Converter)', value: hive.avg_mq2 != null ? `${hive.avg_mq2} ADC` : '—' },
    { icon: Wind, color: 'text-teal-500', label: 'Avg MQ3', subtitle: 'Gas Sensor', adcTooltip: 'Raw sensor reading (Analog-to-Digital Converter)', value: hive.avg_mq3 != null ? `${hive.avg_mq3} ADC` : '—' },
    { icon: Wind, color: 'text-cyan-500', label: 'Avg MQ5', subtitle: 'LPG / Smoke', adcTooltip: 'Raw sensor reading (Analog-to-Digital Converter)', value: hive.avg_mq5 != null ? `${hive.avg_mq5} ADC` : '—' },
    { icon: Wind, color: 'text-indigo-500', label: 'Avg MQ135', subtitle: 'CO2 / Air', adcTooltip: 'Raw sensor reading (Analog-to-Digital Converter)', value: hive.avg_mq135 != null ? `${hive.avg_mq135} ADC` : '—' },
];

const hasSensorData = (hive: HiveCard) =>
    hive.avg_temperature != null || hive.avg_humidity != null ||
    hive.avg_mq2 != null || hive.avg_mq3 != null ||
    hive.avg_mq5 != null || hive.avg_mq135 != null;

export function HiveDetailPanel({ hive, predictionContent }: Props) {
    return (
        <motion.div
            key={hive.id}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex h-full min-h-0 flex-col gap-6 lg:overflow-y-auto lg:pr-1"
        >
            <Card className="relative overflow-hidden border-none bg-gradient-to-br from-[#f7c94a] via-[#eda521] to-[#d78914] p-6 text-amber-950 shadow-[0_30px_60px_-38px_rgba(120,53,15,0.75)] sm:p-8">
                <div className="absolute top-0 right-0 p-6 opacity-[0.14]">
                    <Leaf className="h-36 w-36" />
                </div>
                <div className="relative z-10 flex h-full flex-col gap-6">
                    <div className="flex flex-col gap-5">
                        <div className="min-w-0 space-y-4">
                            <div className="flex items-center justify-between gap-3">
                                <div className="flex items-center gap-2 text-xs font-bold tracking-widest text-amber-950/55 uppercase">
                                    <Leaf className="h-4 w-4" /> Readiness Score
                                </div>
                                <Link
                                    href={route('analytics.show', { hive: hive.id })}
                                    className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-white/45 bg-white/70 px-3 py-2 text-xs font-semibold text-amber-950 shadow-sm backdrop-blur-sm transition-colors hover:bg-white/85 sm:px-4 sm:py-2.5 sm:text-sm"
                                >
                                    <LineChart className="h-3.5 w-3.5 sm:h-4 sm:w-4" /> Analytics
                                </Link>
                            </div>
                            <div className="space-y-3">
                                <div>
                                    <p className="text-xs font-bold tracking-widest text-amber-950/50 uppercase">Viewing</p>
                                    <h2 className="mt-1 text-lg font-bold text-amber-950 sm:text-xl">{hive.name}</h2>
                                </div>
                                <div className="flex flex-wrap items-center gap-2 text-sm text-amber-950/70">
                                    <span>{hive.species ?? 'Unknown species'}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
                        <div className="flex flex-wrap items-center gap-4">
                            <span className="text-5xl font-black text-amber-950 sm:text-6xl">
                                {Math.round(hive.hri_value * 100)}%
                            </span>
                            <ReadinessBadge level={hive.readiness_level} />
                        </div>
                        <div className="grid grid-cols-2 gap-0 xl:min-w-[320px]">
                            <div className="pr-4 sm:pr-6">
                                <p className="mb-1 text-xs font-bold tracking-widest text-amber-950/45 uppercase">Total Harvests</p>
                                <p className="text-3xl font-black text-amber-950">{hive.harvest_count}</p>
                            </div>
                            <div className="border-l border-white/25 pl-4 sm:pl-6">
                                <p className="mb-1 text-xs font-bold tracking-widest text-amber-950/45 uppercase">Hive Age</p>
                                <p className="text-3xl font-black text-amber-950">
                                    {hive.age_months} <span className="text-base font-medium">months</span>
                                </p>
                            </div>
                        </div>
                    </div>

                    {hive.readiness_level && hive.readiness_level !== 'ready' && (
                        <div>
                            <div className="flex flex-wrap items-center justify-between gap-2">
                                <p className="text-sm font-medium text-amber-950">Harvest target guidance</p>
                                <p className="text-xs font-bold tracking-widest text-amber-950/45 uppercase">Target 80%</p>
                            </div>
                            <p className="mt-2 text-sm text-amber-950/70">
                                This hive still needs more time before it reaches the recommended harvest threshold.
                            </p>
                            <div className="relative mt-4 h-2 w-full overflow-visible rounded-full bg-amber-950/12">
                                <div
                                    className="h-full rounded-full bg-amber-950/55"
                                    style={{ width: `${Math.min(Math.round(hive.hri_value * 100), 100)}%` }}
                                />
                                <div
                                    className="absolute top-1/2 h-4 w-0.5 -translate-y-1/2 rounded-full bg-amber-950"
                                    style={{ left: '80%' }}
                                    title="80% harvest target"
                                />
                            </div>
                            <div className="mt-2 flex justify-between text-xs font-bold text-amber-950/45">
                                <span>0%</span><span>80%</span><span>100%</span>
                            </div>
                        </div>
                    )}
                </div>
            </Card>

            {hasSensorData(hive) && (
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
                    {SENSOR_CARDS(hive).map((sensor) => (
                        <MetricCard
                            key={sensor.label}
                            icon={<sensor.icon className={`h-5 w-5 ${sensor.color}`} />}
                            label={sensor.label}
                            subtitle={sensor.subtitle}
                            value={<span title={sensor.adcTooltip}>{sensor.value}</span>}
                        />
                    ))}
                </div>
            )}

            <Card className={cn('border border-l-4 border-amber-100/80 bg-white p-6 shadow-sm', predictionContent.accent)}>
                <div className="flex flex-col gap-4 sm:grid sm:grid-cols-[minmax(0,220px)_minmax(0,1fr)_auto] sm:items-center sm:gap-6">
                    <div>
                        <p className="text-xs font-bold tracking-widest text-amber-900/40 uppercase">Latest Prediction</p>
                        <div className="mt-3">
                            <ReadinessBadge level={hive.readiness_level} />
                        </div>
                    </div>
                    <p className="text-sm text-amber-900/50">{predictionContent.description}</p>
                    <Link
                        href={route('predictions.live', { hive: hive.id })}
                        className="inline-flex min-w-[220px] items-center justify-center gap-2 rounded-full bg-amber-100 px-4 py-3 text-sm font-semibold text-amber-950 transition-colors hover:bg-amber-200"
                    >
                        <Activity className="h-4 w-4" /> View Live Predictions
                    </Link>
                </div>
            </Card>
        </motion.div>
    );
}
