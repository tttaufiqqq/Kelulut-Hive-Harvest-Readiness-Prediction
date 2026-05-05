import { Head, Link, router } from '@inertiajs/react';
import { ArrowLeft, ChevronDown, ChevronRight } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { useEffect, useState } from 'react';
import { Card } from '@/components/core/card';
import { Breadcrumbs } from '@/components/core/navigation';
import { AuthenticatedLayout } from '@/layouts/authenticated-layout';

interface PredictionEntry {
    id: number;
    readiness_level: string;
    hri_value: number;
    confidence_score: number;
    raw_readiness_level: string | null;
    model_version: string | null;
    warning_state: string;
    prediction_warning: string | null;
    guardrail_action: string | null;
    out_of_distribution: boolean;
    prediction_timestamp: string | null;
    prediction_timestamp_label: string | null;
    record_timestamp: string | null;
    record_timestamp_label: string | null;
    device_identifier: string | null;
    sensor_values: {
        temp: number;
        humidity: number;
        mq2_value: number;
        mq3_value: number;
        mq5_value: number;
        mq135_value: number;
    };
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

const TRUST_STYLES: Record<string, string> = {
    normal: 'bg-emerald-100 text-emerald-700',
    warning: 'bg-amber-100 text-amber-800',
    critical: 'bg-rose-100 text-rose-700',
};

function getReadinessLabel(level: string) {
    return READINESS_LABELS[level] ?? level;
}

function getReadinessColor(level: string) {
    return READINESS_COLORS[level] ?? '#d97706';
}

function formatRawConfidence(score: number) {
    if (score >= 0.9995) {
        return 'Approx. 99.9%+';
    }

    return `${(score * 100).toFixed(1)}%`;
}

function getConfidenceBarWidth(score: number) {
    return `${Math.min(score * 100, 99.9).toFixed(1)}%`;
}

function getTrustLabel(prediction: PredictionEntry) {
    if (prediction.warning_state === 'critical') {
        return 'Low trust';
    }

    if (prediction.warning_state === 'warning') {
        return 'Use caution';
    }

    return 'Trusted';
}

function getTrustStyle(state: string) {
    return TRUST_STYLES[state] ?? 'bg-stone-100 text-stone-700';
}

function formatPredictionTime(prediction: PredictionEntry) {
    return (
        prediction.prediction_timestamp_label ??
        prediction.prediction_timestamp ??
        'N/A'
    );
}

function formatCapturedTime(prediction: PredictionEntry) {
    return (
        prediction.record_timestamp_label ??
        prediction.record_timestamp ??
        'N/A'
    );
}

function SensorSnapshot({ prediction }: { prediction: PredictionEntry }) {
    const sensors = [
        {
            label: 'Temp',
            value: `${prediction.sensor_values.temp}°C`,
        },
        {
            label: 'Humidity',
            value: `${prediction.sensor_values.humidity}%`,
        },
        {
            label: 'MQ2',
            value: `${prediction.sensor_values.mq2_value}`,
        },
        {
            label: 'MQ3',
            value: `${prediction.sensor_values.mq3_value}`,
        },
        {
            label: 'MQ5',
            value: `${prediction.sensor_values.mq5_value}`,
        },
        {
            label: 'MQ135',
            value: `${prediction.sensor_values.mq135_value}`,
        },
    ];

    return (
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-6">
            {sensors.map((sensor) => (
                <div
                    key={sensor.label}
                    className="rounded-xl bg-amber-50 px-3 py-3 text-center"
                >
                    <p className="text-[9px] font-bold tracking-wider text-amber-900/40 uppercase">
                        {sensor.label}
                    </p>
                    <p className="mt-1 text-sm font-bold text-amber-900">
                        {sensor.value}
                    </p>
                </div>
            ))}
        </div>
    );
}

function EmptyPredictionState() {
    return (
        <Card className="flex flex-col items-center justify-center gap-3 py-16 text-center">
            <p className="font-bold text-amber-900">No predictions yet</p>
            <p className="max-w-xs text-sm text-amber-700/60">
                Predictions appear once sensor data has been sent by the ESP32
                and processed by the ML model.
            </p>
        </Card>
    );
}

function PredictionTrustNotice({
    prediction,
}: {
    prediction: PredictionEntry;
}) {
    if (
        prediction.warning_state === 'normal' &&
        !prediction.prediction_warning &&
        !prediction.out_of_distribution
    ) {
        return null;
    }

    return (
        <div className="rounded-2xl border border-amber-200 bg-amber-50/80 px-4 py-3">
            <div className="flex flex-wrap items-center gap-2">
                <span
                    className={`rounded-full px-3 py-1 text-xs font-bold ${getTrustStyle(prediction.warning_state)}`}
                >
                    {getTrustLabel(prediction)}
                </span>
                <span className="text-xs font-semibold text-amber-900/60">
                    Raw model confidence{' '}
                    {formatRawConfidence(prediction.confidence_score)}
                </span>
            </div>
            <p className="mt-2 text-sm text-amber-900/75">
                {prediction.prediction_warning ??
                    'This result was flagged by the safety layer, so interpret the raw model score carefully.'}
            </p>
        </div>
    );
}

export default function Predictions({ hive, predictions }: Props) {
    const latest = predictions[0] ?? null;
    const [showHistory, setShowHistory] = useState(false);

    useEffect(() => {
        const id = setInterval(() => {
            router.reload({ only: ['predictions'] });
        }, 10000);

        return () => clearInterval(id);
    }, []);

    return (
        <AuthenticatedLayout>
            <Head title={`Live Predictions — ${hive.name}`} />

            <div className="mx-auto max-w-4xl space-y-8 p-6 md:p-10">
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

                {latest ? (
                    <>
                        <Card className="space-y-6 p-8">
                            <p className="text-[10px] font-black tracking-widest text-amber-900/50 uppercase">
                                Latest Prediction
                            </p>

                            {latest.readiness_level === 'ready' ? (
                                <motion.span
                                    className="inline-block rounded-full px-5 py-1.5 text-base font-bold text-white"
                                    style={{
                                        backgroundColor: getReadinessColor(
                                            latest.readiness_level,
                                        ),
                                    }}
                                    animate={{
                                        boxShadow: [
                                            '0 0 0px #16a34a',
                                            '0 0 18px #16a34a',
                                            '0 0 0px #16a34a',
                                        ],
                                    }}
                                    transition={{
                                        duration: 2,
                                        repeat: Infinity,
                                        ease: 'easeInOut',
                                    }}
                                >
                                    {getReadinessLabel(latest.readiness_level)}
                                </motion.span>
                            ) : (
                                <span
                                    className="inline-block rounded-full px-5 py-1.5 text-base font-bold text-white"
                                    style={{
                                        backgroundColor: getReadinessColor(
                                            latest.readiness_level,
                                        ),
                                    }}
                                >
                                    {getReadinessLabel(latest.readiness_level)}
                                </span>
                            )}

                            <div>
                                <p className="mb-2 text-[10px] font-bold tracking-wider text-amber-900/40 uppercase">
                                    Raw Model Confidence —{' '}
                                    {formatRawConfidence(
                                        latest.confidence_score,
                                    )}
                                </p>
                                <div className="h-3 w-full overflow-hidden rounded-full bg-amber-100">
                                    <motion.div
                                        className="h-full rounded-full"
                                        style={{
                                            backgroundColor: getReadinessColor(
                                                latest.readiness_level,
                                            ),
                                        }}
                                        initial={{ width: '0%' }}
                                        animate={{
                                            width: getConfidenceBarWidth(
                                                latest.confidence_score,
                                            ),
                                        }}
                                        transition={{
                                            duration: 0.8,
                                            ease: 'easeOut',
                                        }}
                                    />
                                </div>
                            </div>

                            <div className="grid gap-6 pt-2 text-center sm:grid-cols-2 lg:grid-cols-4">
                                <div>
                                    <p className="text-[10px] font-bold tracking-wider text-amber-900/40 uppercase">
                                        HRI Value
                                    </p>
                                    <p className="text-3xl font-black text-amber-900">
                                        {Math.round(latest.hri_value * 100)}%
                                    </p>
                                </div>
                                <div>
                                    <p className="text-[10px] font-bold tracking-wider text-amber-900/40 uppercase">
                                        Trust
                                    </p>
                                    <span
                                        className={`inline-flex rounded-full px-3 py-1 text-sm font-bold ${getTrustStyle(latest.warning_state)}`}
                                    >
                                        {getTrustLabel(latest)}
                                    </span>
                                </div>
                                <div>
                                    <p className="text-[10px] font-bold tracking-wider text-amber-900/40 uppercase">
                                        Captured
                                    </p>
                                    <p className="mt-1 text-sm font-semibold text-amber-900">
                                        {formatCapturedTime(latest)}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-[10px] font-bold tracking-wider text-amber-900/40 uppercase">
                                        Device
                                    </p>
                                    <p className="mt-1 text-sm font-semibold text-amber-900">
                                        {latest.device_identifier ??
                                            'Unknown device'}
                                    </p>
                                </div>
                            </div>

                            <PredictionTrustNotice prediction={latest} />
                        </Card>

                        <Card className="space-y-4 p-6">
                            <div className="flex flex-wrap items-center justify-between gap-2">
                                <div>
                                    <p className="text-[10px] font-black tracking-widest text-amber-900/50 uppercase">
                                        Current Sensor Snapshot
                                    </p>
                                    <p className="mt-1 text-sm text-amber-700">
                                        Latest reading used for the most recent
                                        prediction.
                                    </p>
                                </div>
                                <p className="text-sm font-semibold text-amber-900/70">
                                    {formatPredictionTime(latest)}
                                </p>
                            </div>
                            <SensorSnapshot prediction={latest} />
                        </Card>

                        <Card className="space-y-4 p-5">
                            <div className="flex flex-wrap items-center justify-between gap-3">
                                <div>
                                    <p className="text-[10px] font-black tracking-widest text-amber-900/50 uppercase">
                                        Recent Predictions
                                    </p>
                                    <p className="mt-1 text-sm text-amber-700">
                                        Older readings are available when you
                                        need extra context.
                                    </p>
                                </div>
                                <button
                                    type="button"
                                    onClick={() =>
                                        setShowHistory((current) => !current)
                                    }
                                    className="inline-flex items-center gap-2 rounded-full border border-amber-200 bg-white px-4 py-2 text-sm font-semibold text-amber-900 transition-colors hover:bg-amber-50"
                                >
                                    {showHistory ? (
                                        <ChevronDown className="h-4 w-4" />
                                    ) : (
                                        <ChevronRight className="h-4 w-4" />
                                    )}
                                    {showHistory
                                        ? 'Hide history'
                                        : `Show history (${predictions.length})`}
                                </button>
                            </div>

                            <AnimatePresence initial={false}>
                                {showHistory && (
                                    <motion.div
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: 'auto' }}
                                        exit={{ opacity: 0, height: 0 }}
                                        transition={{
                                            duration: 0.22,
                                            ease: 'easeOut',
                                        }}
                                        className="space-y-3 overflow-hidden"
                                    >
                                        {predictions.map((prediction) => (
                                            <motion.div
                                                key={prediction.id}
                                                initial={{ opacity: 0, y: -12 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                exit={{ opacity: 0, y: -8 }}
                                                transition={{
                                                    duration: 0.2,
                                                    ease: 'easeOut',
                                                }}
                                            >
                                                <Card className="space-y-4 p-5">
                                                    <div className="flex flex-wrap items-center justify-between gap-3">
                                                        <span
                                                            className="rounded-full px-3 py-1 text-xs font-bold text-white"
                                                            style={{
                                                                backgroundColor:
                                                                    getReadinessColor(
                                                                        prediction.readiness_level,
                                                                    ),
                                                            }}
                                                        >
                                                            {getReadinessLabel(
                                                                prediction.readiness_level,
                                                            )}
                                                        </span>
                                                        <div className="flex flex-wrap items-center gap-3 text-xs font-semibold text-amber-900/60">
                                                            <span>
                                                                HRI{' '}
                                                                {Math.round(
                                                                    prediction.hri_value *
                                                                        100,
                                                                )}
                                                                %
                                                            </span>
                                                            <span>
                                                                Raw confidence{' '}
                                                                {formatRawConfidence(
                                                                    prediction.confidence_score,
                                                                )}
                                                            </span>
                                                            <span
                                                                className={`rounded-full px-2 py-0.5 ${getTrustStyle(prediction.warning_state)}`}
                                                            >
                                                                {getTrustLabel(
                                                                    prediction,
                                                                )}
                                                            </span>
                                                            <span>
                                                                {formatPredictionTime(
                                                                    prediction,
                                                                )}
                                                            </span>
                                                        </div>
                                                    </div>

                                                    {prediction.warning_state !==
                                                        'normal' &&
                                                        prediction.prediction_warning && (
                                                            <p className="text-sm text-amber-900/70">
                                                                {
                                                                    prediction.prediction_warning
                                                                }
                                                            </p>
                                                        )}

                                                    <SensorSnapshot
                                                        prediction={prediction}
                                                    />
                                                </Card>
                                            </motion.div>
                                        ))}
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </Card>
                    </>
                ) : (
                    <EmptyPredictionState />
                )}
            </div>
        </AuthenticatedLayout>
    );
}
