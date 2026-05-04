import { Head, Link, router } from '@inertiajs/react';
import { ArrowLeft } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { useEffect } from 'react';
import { Card } from '@/components/core/card';
import { Breadcrumbs } from '@/components/core/navigation';
import { AuthenticatedLayout } from '@/layouts/authenticated-layout';
import { cn } from '@/lib/utils';

interface ThresholdMatchSummary {
    id: number;
    sensor_type: string;
    level: string;
    meaning: string | null;
    recommended_action: string | null;
    min_value: number;
    max_value: number;
    reading: number | null;
}

interface PredictionEntry {
    id: number;
    sensor_log_id: number | null;
    device_identifier: string | null;
    readiness_level: string;
    hri_value: number;
    confidence_score: number;
    prediction_timestamp: string | null;
    prediction_timestamp_label: string | null;
    record_timestamp: string | null;
    record_timestamp_label: string | null;
    sensor_values: {
        temp: number;
        humidity: number;
        mq2_value: number;
        mq3_value: number;
        mq5_value: number;
        mq135_value: number;
    };
    threshold_match_summaries: ThresholdMatchSummary[];
}

interface Props {
    hive: { id: number; name: string };
    predictions: PredictionEntry[];
}

const READINESS_LABELS: Record<string, string> = {
    not_ready: 'Not Ready',
    approaching: 'Approaching',
    nearly_ready: 'Nearly Ready',
    ready: 'Ready to Harvest',
};

const READINESS_COLORS: Record<string, string> = {
    not_ready: '#dc2626',
    approaching: '#d97706',
    nearly_ready: '#ca8a04',
    ready: '#16a34a',
};

const THRESHOLD_LEVEL_STYLES: Record<string, string> = {
    normal: 'bg-emerald-100 text-emerald-700',
    warning: 'bg-amber-100 text-amber-700',
    critical: 'bg-rose-100 text-rose-700',
};

const THRESHOLD_LEVEL_PRIORITY: Record<string, number> = {
    normal: 1,
    warning: 2,
    critical: 3,
};

const PROCESS_STEPS = [
    {
        title: 'IoT Data Received',
        description: 'ESP32 posts the latest hive reading.',
    },
    {
        title: 'Sensor Log Saved',
        description: 'The raw reading is stored for the hive.',
    },
    {
        title: 'Thresholds Matched',
        description: 'Sensor values are compared with rule ranges.',
    },
    {
        title: 'ML Called',
        description: 'The stored reading is sent to the Flask model.',
    },
    {
        title: 'Prediction Returned',
        description: 'The model responds with readiness and confidence.',
    },
    {
        title: 'Result Stored',
        description: 'The final readiness result is saved for the page.',
    },
];

function getReadinessLabel(level: string) {
    return READINESS_LABELS[level] ?? level;
}

function getReadinessColor(level: string) {
    return READINESS_COLORS[level] ?? '#d97706';
}

function formatSensorLabel(sensorType: string) {
    const labels: Record<string, string> = {
        temp: 'Temperature',
        humidity: 'Humidity',
        mq2: 'MQ2',
        mq3: 'MQ3',
        mq5: 'MQ5',
        mq135: 'MQ135',
    };

    return labels[sensorType] ?? sensorType.toUpperCase();
}

function formatSensorReading(
    sensorType: string,
    reading: number | null,
    decimals = 1,
) {
    if (reading === null) {
        return 'N/A';
    }

    if (sensorType === 'temp') {
        return `${reading.toFixed(decimals)}°C`;
    }

    if (sensorType === 'humidity') {
        return `${reading.toFixed(decimals)}%`;
    }

    return `${Math.round(reading)} ADC`;
}

function getThresholdOverview(matches: ThresholdMatchSummary[]) {
    if (matches.length === 0) {
        return {
            highestLevel: null,
            matchedSensors: [] as string[],
            totalMatches: 0,
        };
    }

    const highestLevel = matches.reduce(
        (current, match) => {
            if (!current) {
                return match.level;
            }

            return THRESHOLD_LEVEL_PRIORITY[match.level] >
                THRESHOLD_LEVEL_PRIORITY[current]
                ? match.level
                : current;
        },
        '' as string | null,
    );

    const matchedSensors = Array.from(
        new Set(matches.map((match) => formatSensorLabel(match.sensor_type))),
    );

    return {
        highestLevel,
        matchedSensors,
        totalMatches: matches.length,
    };
}

function ReadinessBadge({
    level,
    className,
}: {
    level: string;
    className?: string;
}) {
    return (
        <span
            className={cn(
                'inline-flex items-center rounded-full px-4 py-1.5 text-sm font-bold text-white shadow-sm',
                className,
            )}
            style={{ backgroundColor: getReadinessColor(level) }}
        >
            {getReadinessLabel(level)}
        </span>
    );
}

function PredictionHeader({ hive }: Pick<Props, 'hive'>) {
    return (
        <div className="flex flex-col gap-2">
            <Breadcrumbs
                items={[
                    { label: 'Home', href: '/' },
                    { label: 'My Hives', href: '/dashboard' },
                    { label: hive.name, href: '/dashboard' },
                    { label: 'Live Predictions' },
                ]}
            />
            <div className="flex items-center gap-3">
                <Link
                    href="/dashboard"
                    className="flex h-9 w-9 items-center justify-center rounded-full bg-amber-100 text-amber-900 transition-colors hover:bg-amber-200"
                >
                    <ArrowLeft className="h-4 w-4" />
                </Link>
                <div className="flex-1">
                    <h1 className="text-2xl font-black text-amber-900">
                        Live Predictions
                    </h1>
                    <div className="mt-1 flex items-center gap-2">
                        <motion.div
                            className="h-2 w-2 shrink-0 rounded-full bg-emerald-500"
                            animate={{ opacity: [1, 0.3, 1] }}
                            transition={{
                                duration: 1.2,
                                repeat: Infinity,
                                ease: 'easeInOut',
                            }}
                        />
                        <span className="text-xs font-bold tracking-wider whitespace-nowrap text-emerald-600 uppercase">
                            Live
                        </span>
                        <span className="text-amber-900/20">·</span>
                        <p className="truncate text-sm text-amber-700">
                            {hive.name} — ML Harvest Readiness
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}

function LatestPredictionHero({ prediction }: { prediction: PredictionEntry }) {
    const confidencePct = Math.round(prediction.confidence_score * 100);
    const hriPct = Math.round(prediction.hri_value * 100);

    return (
        <Card className="space-y-6 overflow-hidden border-none bg-gradient-to-br from-[#f7c94a] via-[#eda521] to-[#d78914] p-8 text-amber-950 shadow-[0_30px_60px_-38px_rgba(120,53,15,0.75)]">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="space-y-4">
                    <p className="text-[10px] font-black tracking-widest text-amber-950/55 uppercase">
                        Latest Prediction
                    </p>
                    <div className="flex flex-wrap items-center gap-3">
                        {prediction.readiness_level === 'ready' ? (
                            <motion.span
                                className="inline-flex items-center rounded-full px-5 py-1.5 text-base font-bold text-white"
                                style={{
                                    backgroundColor: getReadinessColor(
                                        prediction.readiness_level,
                                    ),
                                }}
                                animate={{
                                    boxShadow: [
                                        '0 0 0px rgba(22,163,74,0.45)',
                                        '0 0 18px rgba(22,163,74,0.55)',
                                        '0 0 0px rgba(22,163,74,0.45)',
                                    ],
                                }}
                                transition={{
                                    duration: 2,
                                    repeat: Infinity,
                                    ease: 'easeInOut',
                                }}
                            >
                                {getReadinessLabel(prediction.readiness_level)}
                            </motion.span>
                        ) : (
                            <ReadinessBadge
                                level={prediction.readiness_level}
                                className="text-base"
                            />
                        )}
                        <span className="rounded-full border border-white/35 bg-white/20 px-3 py-1 text-xs font-bold tracking-widest text-amber-950/70 uppercase">
                            ML Result
                        </span>
                    </div>
                    <p className="max-w-2xl text-sm text-amber-950/75">
                        The latest hive reading has been stored, interpreted
                        against sensor thresholds, and scored by the ML model
                        for harvest readiness.
                    </p>
                </div>

                <div className="grid gap-3 rounded-[2rem] border border-white/20 bg-white/12 p-4 text-sm text-amber-950/75 sm:grid-cols-2 lg:min-w-[320px]">
                    <div>
                        <p className="text-[10px] font-bold tracking-widest text-amber-950/45 uppercase">
                            Device
                        </p>
                        <p className="mt-1 font-semibold text-amber-950">
                            {prediction.device_identifier ?? 'Unknown device'}
                        </p>
                    </div>
                    <div>
                        <p className="text-[10px] font-bold tracking-widest text-amber-950/45 uppercase">
                            Sensor Log
                        </p>
                        <p className="mt-1 font-semibold text-amber-950">
                            #{prediction.sensor_log_id ?? 'N/A'}
                        </p>
                    </div>
                    <div>
                        <p className="text-[10px] font-bold tracking-widest text-amber-950/45 uppercase">
                            Reading Captured
                        </p>
                        <p className="mt-1 font-semibold text-amber-950">
                            {prediction.record_timestamp_label ?? 'N/A'}
                        </p>
                    </div>
                    <div>
                        <p className="text-[10px] font-bold tracking-widest text-amber-950/45 uppercase">
                            Prediction Stored
                        </p>
                        <p className="mt-1 font-semibold text-amber-950">
                            {prediction.prediction_timestamp_label ?? 'N/A'}
                        </p>
                    </div>
                </div>
            </div>

            <div>
                <div className="mb-2 flex items-center justify-between text-[10px] font-bold tracking-wider text-amber-950/45 uppercase">
                    <span>Confidence</span>
                    <span>{confidencePct}%</span>
                </div>
                <div className="h-3 w-full overflow-hidden rounded-full bg-white/25">
                    <motion.div
                        className="h-full rounded-full bg-amber-950/75"
                        initial={{ width: '0%' }}
                        animate={{ width: `${confidencePct}%` }}
                        transition={{ duration: 0.8, ease: 'easeOut' }}
                    />
                </div>
            </div>

            <div className="grid gap-6 border-t border-white/20 pt-2 text-center sm:grid-cols-3">
                <div>
                    <p className="text-[10px] font-bold tracking-wider text-amber-950/45 uppercase">
                        HRI Value
                    </p>
                    <p className="text-3xl font-black text-amber-950">
                        {hriPct}%
                    </p>
                </div>
                <div>
                    <p className="text-[10px] font-bold tracking-wider text-amber-950/45 uppercase">
                        Threshold Matches
                    </p>
                    <p className="text-3xl font-black text-amber-950">
                        {prediction.threshold_match_summaries.length}
                    </p>
                </div>
                <div>
                    <p className="text-[10px] font-bold tracking-wider text-amber-950/45 uppercase">
                        Final Decision
                    </p>
                    <p className="text-lg font-bold text-amber-950">
                        {getReadinessLabel(prediction.readiness_level)}
                    </p>
                </div>
            </div>
        </Card>
    );
}

function PredictionProcessPanel({
    prediction,
}: {
    prediction: PredictionEntry;
}) {
    const endStepIndex = PROCESS_STEPS.length - 1;

    return (
        <Card className="space-y-5 border border-amber-100/90 bg-white/95">
            <div className="flex flex-col gap-2 lg:flex-row lg:items-end lg:justify-between">
                <div>
                    <p className="text-[10px] font-black tracking-widest text-amber-900/50 uppercase">
                        Prediction Process
                    </p>
                    <h2 className="mt-2 text-lg font-bold text-amber-900">
                        How the latest reading becomes a stored ML result
                    </h2>
                </div>
                <p className="max-w-xl text-sm text-amber-900/55">
                    The rule-based threshold interpretation supports the story,
                    while the final readiness result belongs to the ML
                    prediction that is stored for this reading.
                </p>
            </div>

            <div className="rounded-[2rem] border border-amber-100 bg-gradient-to-br from-amber-50/85 via-white to-amber-50/60 p-4 sm:p-5">
                <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-[repeat(6,minmax(0,1fr))] xl:gap-0">
                    {PROCESS_STEPS.map((step, index) => {
                        const isEndStep = index === endStepIndex;

                        return (
                            <div
                                key={step.title}
                                className="flex items-stretch xl:min-w-0 xl:items-center"
                            >
                                <motion.div
                                    className={cn(
                                        'relative flex-1 rounded-[1.5rem] border border-amber-100 bg-white/90 p-4 shadow-[0_18px_30px_-28px_rgba(120,53,15,0.7)]',
                                        isEndStep &&
                                            'border-amber-200 bg-amber-50/90',
                                    )}
                                    initial={{ opacity: 0, y: 16 }}
                                    animate={
                                        isEndStep
                                            ? {
                                                  opacity: 1,
                                                  y: 0,
                                                  boxShadow: [
                                                      '0 18px 30px -28px rgba(120,53,15,0.45)',
                                                      '0 24px 38px -28px rgba(217,119,6,0.45)',
                                                      '0 18px 30px -28px rgba(120,53,15,0.45)',
                                                  ],
                                              }
                                            : { opacity: 1, y: 0 }
                                    }
                                    transition={
                                        isEndStep
                                            ? {
                                                  opacity: {
                                                      duration: 0.35,
                                                      delay: index * 0.08,
                                                      ease: 'easeOut',
                                                  },
                                                  y: {
                                                      duration: 0.35,
                                                      delay: index * 0.08,
                                                      ease: 'easeOut',
                                                  },
                                                  boxShadow: {
                                                      duration: 2.6,
                                                      repeat: Infinity,
                                                      ease: 'easeInOut',
                                                  },
                                              }
                                            : {
                                                  duration: 0.35,
                                                  delay: index * 0.08,
                                                  ease: 'easeOut',
                                              }
                                    }
                                >
                                    <div className="flex items-center gap-3">
                                        <span
                                            className={cn(
                                                'flex h-8 w-8 items-center justify-center rounded-full bg-amber-100 text-xs font-black text-amber-900',
                                                isEndStep &&
                                                    'bg-amber-900 text-amber-50',
                                            )}
                                        >
                                            0{index + 1}
                                        </span>
                                        <div className="min-w-0">
                                            <p className="text-sm font-bold text-amber-900">
                                                {step.title}
                                            </p>
                                            <p className="mt-1 text-xs font-semibold tracking-widest text-amber-900/40 uppercase">
                                                {isEndStep
                                                    ? 'Stored output'
                                                    : 'Pipeline step'}
                                            </p>
                                        </div>
                                    </div>

                                    <p className="mt-3 text-sm leading-6 text-amber-900/60">
                                        {step.description}
                                    </p>

                                    {isEndStep && (
                                        <div className="mt-4 rounded-[1rem] border border-amber-200 bg-amber-100/70 px-3 py-2">
                                            <p className="text-[10px] font-bold tracking-widest text-amber-900/45 uppercase">
                                                Final ML result
                                            </p>
                                            <p className="mt-1 text-sm font-semibold text-amber-900">
                                                {getReadinessLabel(
                                                    prediction.readiness_level,
                                                )}{' '}
                                                ·{' '}
                                                {Math.round(
                                                    prediction.confidence_score *
                                                        100,
                                                )}
                                                % confidence
                                            </p>
                                        </div>
                                    )}
                                </motion.div>

                                {index < endStepIndex && (
                                    <div className="hidden xl:flex xl:w-8 xl:items-center xl:justify-center">
                                        <motion.div
                                            className="h-[2px] w-full rounded-full bg-gradient-to-r from-amber-200 via-amber-300 to-amber-200"
                                            initial={{
                                                opacity: 0,
                                                scaleX: 0.6,
                                            }}
                                            animate={{
                                                opacity: [0.55, 1, 0.55],
                                                scaleX: 1,
                                            }}
                                            transition={{
                                                duration: 1.8,
                                                delay: index * 0.1,
                                                repeat: Infinity,
                                                ease: 'easeInOut',
                                            }}
                                        />
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>

            <div className="grid gap-4 rounded-[1.5rem] border border-dashed border-amber-200 bg-amber-50/50 p-4 text-sm text-amber-900/65 lg:grid-cols-2">
                <p>
                    Reading captured at{' '}
                    <span className="font-semibold text-amber-900">
                        {prediction.record_timestamp_label ?? 'N/A'}
                    </span>
                    .
                </p>
                <p>
                    ML result stored at{' '}
                    <span className="font-semibold text-amber-900">
                        {prediction.prediction_timestamp_label ?? 'N/A'}
                    </span>
                    .
                </p>
            </div>
        </Card>
    );
}

function ThresholdAnalysisCard({
    prediction,
}: {
    prediction: PredictionEntry;
}) {
    const overview = getThresholdOverview(prediction.threshold_match_summaries);

    return (
        <Card className="space-y-5 border border-amber-100/90 bg-white/95">
            <div className="flex items-start justify-between gap-3">
                <div>
                    <p className="text-[10px] font-black tracking-widest text-amber-900/45 uppercase">
                        Threshold Analysis
                    </p>
                    <h2 className="mt-2 text-lg font-bold text-amber-900">
                        Rule-based sensor interpretation
                    </h2>
                </div>
                <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-800">
                    {overview.totalMatches} match
                    {overview.totalMatches === 1 ? '' : 'es'}
                </span>
            </div>

            {overview.highestLevel ? (
                <div className="rounded-[1.5rem] border border-amber-100 bg-amber-50/80 p-4">
                    <div className="flex flex-wrap items-center gap-2">
                        <span
                            className={cn(
                                'rounded-full px-3 py-1 text-xs font-bold capitalize',
                                THRESHOLD_LEVEL_STYLES[overview.highestLevel] ??
                                    'bg-stone-100 text-stone-700',
                            )}
                        >
                            {overview.highestLevel}
                        </span>
                        <p className="text-sm text-amber-900/70">
                            Highest threshold severity seen for this reading.
                        </p>
                    </div>
                    <div className="mt-4 flex flex-wrap gap-2">
                        {overview.matchedSensors.map((sensor) => (
                            <span
                                key={sensor}
                                className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-amber-900 shadow-sm"
                            >
                                {sensor}
                            </span>
                        ))}
                    </div>
                </div>
            ) : (
                <div className="rounded-[1.5rem] border border-dashed border-amber-200 bg-amber-50/60 p-4 text-sm text-amber-900/60">
                    No threshold matches were recorded for this reading. The
                    pipeline can still proceed to the ML prediction stage.
                </div>
            )}

            <div className="space-y-3">
                {prediction.threshold_match_summaries
                    .slice(0, 3)
                    .map((match) => (
                        <div
                            key={match.id}
                            className="rounded-[1.25rem] border border-amber-100 p-4"
                        >
                            <div className="flex flex-wrap items-center justify-between gap-2">
                                <p className="font-semibold text-amber-900">
                                    {formatSensorLabel(match.sensor_type)}
                                </p>
                                <span
                                    className={cn(
                                        'rounded-full px-2.5 py-1 text-[11px] font-bold capitalize',
                                        THRESHOLD_LEVEL_STYLES[match.level] ??
                                            'bg-stone-100 text-stone-700',
                                    )}
                                >
                                    {match.level}
                                </span>
                            </div>
                            <p className="mt-2 text-sm text-amber-900/65">
                                {match.meaning ??
                                    'Threshold matched for this sensor.'}
                            </p>
                            <p className="mt-2 text-xs font-semibold text-amber-900/45 uppercase">
                                Reading{' '}
                                {formatSensorReading(
                                    match.sensor_type,
                                    match.reading,
                                )}{' '}
                                · Range {match.min_value} to {match.max_value}
                            </p>
                        </div>
                    ))}
            </div>
        </Card>
    );
}

function MlPredictionCard({ prediction }: { prediction: PredictionEntry }) {
    const confidencePct = Math.round(prediction.confidence_score * 100);

    return (
        <Card className="space-y-5 border border-amber-100/90 bg-white/95">
            <div className="flex items-start justify-between gap-3">
                <div>
                    <p className="text-[10px] font-black tracking-widest text-amber-900/45 uppercase">
                        ML Prediction
                    </p>
                    <h2 className="mt-2 text-lg font-bold text-amber-900">
                        Final readiness decision
                    </h2>
                </div>
                <ReadinessBadge level={prediction.readiness_level} />
            </div>

            <div className="rounded-[1.5rem] border border-amber-100 bg-gradient-to-br from-white to-amber-50/80 p-5">
                <div className="grid gap-5 sm:grid-cols-3">
                    <div>
                        <p className="text-[10px] font-bold tracking-widest text-amber-900/40 uppercase">
                            HRI Value
                        </p>
                        <p className="mt-1 text-3xl font-black text-amber-900">
                            {Math.round(prediction.hri_value * 100)}%
                        </p>
                    </div>
                    <div>
                        <p className="text-[10px] font-bold tracking-widest text-amber-900/40 uppercase">
                            Confidence
                        </p>
                        <p className="mt-1 text-3xl font-black text-amber-900">
                            {confidencePct}%
                        </p>
                    </div>
                    <div>
                        <p className="text-[10px] font-bold tracking-widest text-amber-900/40 uppercase">
                            Stored At
                        </p>
                        <p className="mt-1 text-sm font-semibold text-amber-900">
                            {prediction.prediction_timestamp_label ?? 'N/A'}
                        </p>
                    </div>
                </div>

                <div className="mt-5">
                    <div className="mb-2 flex items-center justify-between text-[10px] font-bold tracking-widest text-amber-900/40 uppercase">
                        <span>Model confidence</span>
                        <span>{confidencePct}%</span>
                    </div>
                    <div className="h-3 w-full overflow-hidden rounded-full bg-amber-100">
                        <div
                            className="h-full rounded-full"
                            style={{
                                width: `${confidencePct}%`,
                                backgroundColor: getReadinessColor(
                                    prediction.readiness_level,
                                ),
                            }}
                        />
                    </div>
                </div>
            </div>

            <p className="text-sm text-amber-900/60">
                This panel owns the final harvest readiness result. Thresholds
                provide rule-based context, but the stored outcome comes from
                the ML model response.
            </p>
        </Card>
    );
}

function SensorSnapshot({ prediction }: { prediction: PredictionEntry }) {
    const sensors = [
        { label: 'Temp', value: `${prediction.sensor_values.temp}°C` },
        { label: 'Humidity', value: `${prediction.sensor_values.humidity}%` },
        { label: 'MQ2', value: `${prediction.sensor_values.mq2_value}` },
        { label: 'MQ3', value: `${prediction.sensor_values.mq3_value}` },
        { label: 'MQ5', value: `${prediction.sensor_values.mq5_value}` },
        { label: 'MQ135', value: `${prediction.sensor_values.mq135_value}` },
    ];

    return (
        <div className="grid grid-cols-2 gap-2 pt-1 sm:grid-cols-3 xl:grid-cols-6">
            {sensors.map((sensor) => (
                <div
                    key={sensor.label}
                    className="rounded-xl bg-amber-50 px-3 py-2 text-center"
                >
                    <p className="text-[9px] font-bold tracking-wider text-amber-900/40 uppercase">
                        {sensor.label}
                    </p>
                    <p className="text-sm font-bold text-amber-900">
                        {sensor.value}
                    </p>
                </div>
            ))}
        </div>
    );
}

function PredictionHistory({ predictions }: Pick<Props, 'predictions'>) {
    return (
        <div className="space-y-3">
            <p className="text-[10px] font-black tracking-widest text-amber-900/50 uppercase">
                Recent Prediction History
            </p>
            <AnimatePresence initial={false}>
                {predictions.map((prediction) => {
                    const thresholdOverview = getThresholdOverview(
                        prediction.threshold_match_summaries,
                    );

                    return (
                        <motion.div
                            key={prediction.id}
                            initial={{ opacity: 0, y: -16, scale: 0.97 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.97 }}
                            transition={{
                                type: 'spring',
                                stiffness: 300,
                                damping: 30,
                            }}
                        >
                            <Card className="space-y-4">
                                <div className="flex flex-col gap-3 xl:flex-row xl:items-start xl:justify-between">
                                    <div className="space-y-3">
                                        <div className="flex flex-wrap items-center gap-2">
                                            <ReadinessBadge
                                                level={
                                                    prediction.readiness_level
                                                }
                                            />
                                            <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-800">
                                                {prediction.device_identifier ??
                                                    'Unknown device'}
                                            </span>
                                            <span className="text-xs font-semibold text-amber-900/55">
                                                Sensor log #
                                                {prediction.sensor_log_id ??
                                                    'N/A'}
                                            </span>
                                        </div>

                                        <div className="flex flex-wrap items-center gap-4 text-xs font-semibold text-amber-900/60">
                                            <span>
                                                HRI{' '}
                                                {Math.round(
                                                    prediction.hri_value * 100,
                                                )}
                                                %
                                            </span>
                                            <span>
                                                Confidence{' '}
                                                {Math.round(
                                                    prediction.confidence_score *
                                                        100,
                                                )}
                                                %
                                            </span>
                                            <span>
                                                Thresholds{' '}
                                                {
                                                    prediction
                                                        .threshold_match_summaries
                                                        .length
                                                }
                                            </span>
                                        </div>
                                    </div>

                                    <div className="rounded-[1.25rem] bg-amber-50/80 px-4 py-3 text-sm text-amber-900/65 xl:min-w-[270px]">
                                        <p className="font-semibold text-amber-900">
                                            {prediction.prediction_timestamp_label ??
                                                'N/A'}
                                        </p>
                                        <p className="mt-1 text-xs">
                                            {thresholdOverview.highestLevel
                                                ? `Highest threshold severity: ${thresholdOverview.highestLevel}`
                                                : 'No threshold matches recorded'}
                                        </p>
                                    </div>
                                </div>

                                <SensorSnapshot prediction={prediction} />
                            </Card>
                        </motion.div>
                    );
                })}
            </AnimatePresence>
        </div>
    );
}

function EmptyPredictionState() {
    return (
        <Card className="flex flex-col items-center justify-center gap-3 py-16">
            <p className="font-bold text-amber-900">No predictions yet</p>
            <p className="max-w-xs text-center text-sm text-amber-700/60">
                Predictions appear once sensor data has been sent by the ESP32
                and processed by the ML model.
            </p>
        </Card>
    );
}

export default function Predictions({ hive, predictions }: Props) {
    const latest = predictions[0] ?? null;

    useEffect(() => {
        const id = setInterval(() => {
            router.reload({ only: ['predictions'] });
        }, 10000);

        return () => clearInterval(id);
    }, []);

    return (
        <AuthenticatedLayout>
            <Head title={`Live Predictions — ${hive.name}`} />

            <div className="mx-auto max-w-6xl space-y-8 p-6 md:p-10">
                <PredictionHeader hive={hive} />

                {latest ? (
                    <>
                        <LatestPredictionHero prediction={latest} />
                        <PredictionProcessPanel prediction={latest} />

                        <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
                            <ThresholdAnalysisCard prediction={latest} />
                            <MlPredictionCard prediction={latest} />
                        </div>

                        <PredictionHistory predictions={predictions} />
                    </>
                ) : (
                    <EmptyPredictionState />
                )}
            </div>
        </AuthenticatedLayout>
    );
}
