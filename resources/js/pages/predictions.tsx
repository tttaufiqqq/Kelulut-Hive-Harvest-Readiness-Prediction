import { Head, Link, router } from '@inertiajs/react';
import { ArrowLeft } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useEffect } from 'react';
import { Card } from '@/components/core/card';
import { Breadcrumbs } from '@/components/core/navigation';
import { AuthenticatedLayout } from '@/layouts/authenticated-layout';

// ─── Types ───────────────────────────────────────────────────────────────────

interface PredictionEntry {
    id: number;
    readiness_level: string;
    hri_value: number;
    confidence_score: number;
    prediction_timestamp: string;
    temp: number;
    humidity: number;
    mq2_value: number;
    mq3_value: number;
    mq5_value: number;
    mq135_value: number;
    record_timestamp: string;
}

interface Props {
    hive: { id: number; name: string };
    predictions: PredictionEntry[];
}

// ─── Readiness maps ───────────────────────────────────────────────────────────

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

// ─── Page ─────────────────────────────────────────────────────────────────────

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
            <div className="mx-auto max-w-4xl space-y-8 p-6 md:p-10">
                {/* ── Header ──────────────────────────────────────────────── */}
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

                {/* ── Latest prediction hero ───────────────────────────────── */}
                {latest ? (
                    <Card className="space-y-5 p-8">
                        <p className="text-[10px] font-black tracking-widest text-amber-900/50 uppercase">
                            Latest Prediction
                        </p>

                        {/* Readiness badge — pulse glow when ready */}
                        {latest.readiness_level === 'ready' ? (
                            <motion.span
                                className="inline-block rounded-full px-5 py-1.5 text-base font-bold text-white"
                                style={{
                                    backgroundColor:
                                        READINESS_COLORS[
                                            latest.readiness_level
                                        ],
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
                                {READINESS_LABELS[latest.readiness_level]}
                            </motion.span>
                        ) : (
                            <span
                                className="inline-block rounded-full px-5 py-1.5 text-base font-bold text-white"
                                style={{
                                    backgroundColor:
                                        READINESS_COLORS[
                                            latest.readiness_level
                                        ] ?? '#d97706',
                                }}
                            >
                                {READINESS_LABELS[latest.readiness_level] ??
                                    latest.readiness_level}
                            </span>
                        )}

                        {/* Confidence bar */}
                        <div>
                            <p className="mb-2 text-[10px] font-bold tracking-wider text-amber-900/40 uppercase">
                                Confidence —{' '}
                                {Math.round(latest.confidence_score * 100)}%
                            </p>
                            <div className="h-3 w-full overflow-hidden rounded-full bg-amber-100">
                                <motion.div
                                    className="h-full rounded-full"
                                    style={{
                                        backgroundColor:
                                            READINESS_COLORS[
                                                latest.readiness_level
                                            ] ?? '#d97706',
                                    }}
                                    initial={{ width: '0%' }}
                                    animate={{
                                        width: `${Math.round(latest.confidence_score * 100)}%`,
                                    }}
                                    transition={{
                                        duration: 0.8,
                                        ease: 'easeOut',
                                    }}
                                />
                            </div>
                        </div>

                        {/* HRI value + timestamp */}
                        <div className="grid grid-cols-2 gap-6 pt-2 text-center">
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
                                    Timestamp
                                </p>
                                <p className="mt-1 text-sm font-semibold text-amber-900">
                                    {latest.prediction_timestamp}
                                </p>
                            </div>
                        </div>
                    </Card>
                ) : (
                    <Card className="flex flex-col items-center justify-center gap-3 py-16">
                        <p className="font-bold text-amber-900">
                            No predictions yet
                        </p>
                        <p className="max-w-xs text-center text-sm text-amber-700/60">
                            Predictions appear once sensor data has been sent by
                            the ESP32 and processed by the ML model.
                        </p>
                    </Card>
                )}

                {/* ── Prediction history list ──────────────────────────────── */}
                {predictions.length > 0 && (
                    <div className="space-y-3">
                        <p className="text-[10px] font-black tracking-widest text-amber-900/50 uppercase">
                            Last {predictions.length} Predictions
                        </p>
                        <AnimatePresence initial={false}>
                            {predictions.map((pred) => {
                                const color =
                                    READINESS_COLORS[pred.readiness_level] ??
                                    '#d97706';
                                const label =
                                    READINESS_LABELS[pred.readiness_level] ??
                                    pred.readiness_level;

                                return (
                                    <motion.div
                                        key={pred.id}
                                        initial={{
                                            opacity: 0,
                                            y: -16,
                                            scale: 0.97,
                                        }}
                                        animate={{ opacity: 1, y: 0, scale: 1 }}
                                        exit={{ opacity: 0, scale: 0.97 }}
                                        transition={{
                                            type: 'spring',
                                            stiffness: 300,
                                            damping: 30,
                                        }}
                                    >
                                        <Card className="space-y-3">
                                            {/* Row: badge + confidence + timestamp */}
                                            <div className="flex flex-wrap items-center justify-between gap-2">
                                                <span
                                                    className="rounded-full px-3 py-0.5 text-xs font-bold text-white"
                                                    style={{
                                                        backgroundColor: color,
                                                    }}
                                                >
                                                    {label}
                                                </span>
                                                <div className="flex items-center gap-4 text-xs font-semibold text-amber-900/60">
                                                    <span>
                                                        HRI{' '}
                                                        {Math.round(
                                                            pred.hri_value *
                                                                100,
                                                        )}
                                                        %
                                                    </span>
                                                    <span>·</span>
                                                    <span>
                                                        Confidence{' '}
                                                        {Math.round(
                                                            pred.confidence_score *
                                                                100,
                                                        )}
                                                        %
                                                    </span>
                                                    <span>·</span>
                                                    <span>
                                                        {
                                                            pred.prediction_timestamp
                                                        }
                                                    </span>
                                                </div>
                                            </div>

                                            {/* Sensor snapshot */}
                                            <div className="grid grid-cols-3 gap-2 pt-1 sm:grid-cols-6">
                                                {[
                                                    {
                                                        label: 'Temp',
                                                        value: `${pred.temp}°C`,
                                                    },
                                                    {
                                                        label: 'Humidity',
                                                        value: `${pred.humidity}%`,
                                                    },
                                                    {
                                                        label: 'MQ2',
                                                        value: `${pred.mq2_value}`,
                                                    },
                                                    {
                                                        label: 'MQ3',
                                                        value: `${pred.mq3_value}`,
                                                    },
                                                    {
                                                        label: 'MQ5',
                                                        value: `${pred.mq5_value}`,
                                                    },
                                                    {
                                                        label: 'MQ135',
                                                        value: `${pred.mq135_value}`,
                                                    },
                                                ].map((s) => (
                                                    <div
                                                        key={s.label}
                                                        className="rounded-xl bg-amber-50 px-3 py-2 text-center"
                                                    >
                                                        <p className="text-[9px] font-bold tracking-wider text-amber-900/40 uppercase">
                                                            {s.label}
                                                        </p>
                                                        <p className="text-sm font-bold text-amber-900">
                                                            {s.value}
                                                        </p>
                                                    </div>
                                                ))}
                                            </div>
                                        </Card>
                                    </motion.div>
                                );
                            })}
                        </AnimatePresence>
                    </div>
                )}
            </div>
        </AuthenticatedLayout>
    );
}
