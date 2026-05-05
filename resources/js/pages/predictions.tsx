import { Head, Link, router } from '@inertiajs/react';
import { ArrowLeft, ChevronLeft, ChevronRight } from 'lucide-react';
import { motion } from 'motion/react';
import { useEffect, useState } from 'react';
import {
    CartesianGrid,
    Legend,
    Line,
    LineChart,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from 'recharts';
import { Card } from '@/components/core/card';
import { Modal } from '@/components/core/modal';
import { Breadcrumbs } from '@/components/core/navigation';
import { ScrollArea } from '@/components/core/scroll-area';
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
    latestPrediction: PredictionEntry | null;
    predictionTrends: {
        id: number;
        label: string;
        hri_pct: number;
        confidence_pct: number;
        temp: number;
        humidity: number;
        warning_state: string;
    }[];
    historyPredictions: {
        data: PredictionEntry[];
        links: { url: string | null; label: string; active: boolean }[];
        current_page: number;
        last_page: number;
        total: number;
    };
    filters: {
        page: number;
    };
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

const ROW_TONE_STYLES: Record<string, string> = {
    normal: 'hover:bg-yellow-50/30',
    warning: 'bg-amber-50/35 hover:bg-amber-50/60',
    critical: 'bg-rose-50/45 hover:bg-rose-50/70',
};

const WARNING_PANEL_STYLES: Record<string, string> = {
    normal: 'border-amber-200 bg-amber-50/80 text-amber-900',
    warning: 'border-amber-300 bg-amber-50 text-amber-950',
    critical: 'border-rose-300 bg-rose-50 text-rose-950',
};

const WARNING_LABEL_STYLES: Record<string, string> = {
    normal: 'bg-amber-100 text-amber-800',
    warning: 'bg-amber-200 text-amber-900',
    critical: 'bg-rose-100 text-rose-800',
};

const TOOLTIP_STYLE = {
    backgroundColor: '#FFFBEB',
    border: '1px solid #FEF3C7',
    borderRadius: '12px',
    fontSize: '12px',
    fontWeight: 'bold',
    color: '#78350F',
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

function getRowToneStyle(state: string) {
    return ROW_TONE_STYLES[state] ?? 'hover:bg-yellow-50/30';
}

function getWarningPanelStyle(state: string) {
    return (
        WARNING_PANEL_STYLES[state] ??
        'border-amber-200 bg-amber-50/80 text-amber-900'
    );
}

function getWarningLabelStyle(state: string) {
    return WARNING_LABEL_STYLES[state] ?? 'bg-amber-100 text-amber-800';
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

function PredictionTrendChart({
    data,
}: {
    data: Props['predictionTrends'];
}) {
    return (
        <Card className="h-full">
            <div className="mb-4 flex items-start justify-between gap-3">
                <div>
                    <p className="text-[10px] font-black tracking-widest text-amber-900/50 uppercase">
                        HRI Trend
                    </p>
                    <p className="mt-1 text-sm text-amber-700">
                        Recent readiness movement across the latest live
                        readings.
                    </p>
                </div>
            </div>
            <ResponsiveContainer width="100%" height={220}>
                <LineChart data={data}>
                    <CartesianGrid
                        strokeDasharray="3 3"
                        vertical={false}
                        stroke="#FEF3C7"
                    />
                    <XAxis
                        dataKey="label"
                        axisLine={false}
                        tickLine={false}
                        tick={{
                            fill: '#78350F',
                            fontSize: 10,
                            fontWeight: 600,
                        }}
                        minTickGap={24}
                        dy={8}
                    />
                    <YAxis
                        domain={[0, 100]}
                        axisLine={false}
                        tickLine={false}
                        tickFormatter={(value) => `${value}%`}
                        tick={{
                            fill: '#78350F',
                            fontSize: 10,
                            fontWeight: 600,
                        }}
                    />
                    <Tooltip contentStyle={TOOLTIP_STYLE} />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                    <Line
                        type="monotone"
                        dataKey="hri_pct"
                        name="HRI"
                        stroke="#F59E0B"
                        strokeWidth={3}
                        dot={{ r: 3, fill: '#F59E0B' }}
                        activeDot={{ r: 5 }}
                    />
                    <Line
                        type="monotone"
                        dataKey="confidence_pct"
                        name="Raw confidence"
                        stroke="#92400E"
                        strokeWidth={2}
                        strokeDasharray="5 4"
                        dot={false}
                    />
                </LineChart>
            </ResponsiveContainer>
        </Card>
    );
}

function SensorTrendChart({
    data,
}: {
    data: Props['predictionTrends'];
}) {
    return (
        <Card className="h-full">
            <div className="mb-4 flex items-start justify-between gap-3">
                <div>
                    <p className="text-[10px] font-black tracking-widest text-amber-900/50 uppercase">
                        Conditions Trend
                    </p>
                    <p className="mt-1 text-sm text-amber-700">
                        Temperature and humidity context behind recent model
                        changes.
                    </p>
                </div>
            </div>
            <ResponsiveContainer width="100%" height={220}>
                <LineChart data={data}>
                    <CartesianGrid
                        strokeDasharray="3 3"
                        vertical={false}
                        stroke="#FEF3C7"
                    />
                    <XAxis
                        dataKey="label"
                        axisLine={false}
                        tickLine={false}
                        tick={{
                            fill: '#78350F',
                            fontSize: 10,
                            fontWeight: 600,
                        }}
                        minTickGap={24}
                        dy={8}
                    />
                    <YAxis
                        axisLine={false}
                        tickLine={false}
                        tick={{
                            fill: '#78350F',
                            fontSize: 10,
                            fontWeight: 600,
                        }}
                    />
                    <Tooltip contentStyle={TOOLTIP_STYLE} />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                    <Line
                        type="monotone"
                        dataKey="temp"
                        name="Temperature"
                        stroke="#EA580C"
                        strokeWidth={2.5}
                        dot={{ r: 3, fill: '#EA580C' }}
                        activeDot={{ r: 5 }}
                    />
                    <Line
                        type="monotone"
                        dataKey="humidity"
                        name="Humidity"
                        stroke="#2563EB"
                        strokeWidth={2.5}
                        dot={{ r: 3, fill: '#2563EB' }}
                        activeDot={{ r: 5 }}
                    />
                </LineChart>
            </ResponsiveContainer>
        </Card>
    );
}

export default function Predictions({
    hive,
    latestPrediction,
    predictionTrends,
    historyPredictions,
    filters,
}: Props) {
    const latest = latestPrediction;
    const [showHistory, setShowHistory] = useState(filters.page > 1);
    const [activeHistoryIndex, setActiveHistoryIndex] = useState<number | null>(
        null,
    );
    const activeHistoryPrediction =
        activeHistoryIndex !== null
            ? (historyPredictions.data[activeHistoryIndex] ?? null)
            : null;
    const hasPrevHistory =
        activeHistoryIndex !== null && activeHistoryIndex > 0;
    const hasNextHistory =
        activeHistoryIndex !== null &&
        activeHistoryIndex < historyPredictions.data.length - 1;

    useEffect(() => {
        const id = setInterval(() => {
            router.reload({
                only: [
                    'latestPrediction',
                    'predictionTrends',
                    'historyPredictions',
                ],
            });
        }, 10000);

        return () => clearInterval(id);
    }, []);

    useEffect(() => {
        if (activeHistoryIndex === null) {
            return;
        }

        const handler = (e: KeyboardEvent) => {
            if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
                e.preventDefault();
                setActiveHistoryIndex((current) =>
                    current !== null && current > 0 ? current - 1 : current,
                );
            }

            if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
                e.preventDefault();
                setActiveHistoryIndex((current) =>
                    current !== null &&
                    current < historyPredictions.data.length - 1
                        ? current + 1
                        : current,
                );
            }
        };

        window.addEventListener('keydown', handler);

        return () => window.removeEventListener('keydown', handler);
    }, [activeHistoryIndex, historyPredictions.data.length]);

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

                        <div className="grid gap-6 xl:grid-cols-2">
                            <PredictionTrendChart data={predictionTrends} />
                            <SensorTrendChart data={predictionTrends} />
                        </div>

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
                                        Previous prediction entries in a cleaner
                                        compact view. Select a row to inspect
                                        details.
                                    </p>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-700">
                                        {historyPredictions.total} older
                                    </span>
                                    <button
                                        type="button"
                                        onClick={() =>
                                            setShowHistory(
                                                (current) => !current,
                                            )
                                        }
                                        className="inline-flex items-center gap-2 rounded-full border border-amber-200 bg-white px-4 py-2 text-sm font-semibold text-amber-900 transition-colors hover:bg-amber-50"
                                    >
                                        {showHistory ? (
                                            <ChevronLeft className="h-4 w-4 rotate-[-90deg]" />
                                        ) : (
                                            <ChevronRight className="h-4 w-4" />
                                        )}
                                        {showHistory
                                            ? 'Hide history'
                                            : 'Show history'}
                                    </button>
                                </div>
                            </div>

                            <motion.div
                                initial={false}
                                animate={{
                                    height: showHistory ? 'auto' : 0,
                                    opacity: showHistory ? 1 : 0,
                                }}
                                transition={{ duration: 0.2, ease: 'easeOut' }}
                                className={`space-y-3 overflow-hidden ${showHistory ? '' : 'pointer-events-none'}`}
                            >
                                <Card className="overflow-hidden border-yellow-100 p-0 shadow-sm">
                                    <ScrollArea direction="horizontal">
                                        <table className="w-full text-sm">
                                            <thead>
                                                <tr className="border-b border-yellow-100 bg-yellow-50/40">
                                                    <th className="px-6 py-3 text-left text-xs font-bold tracking-widest text-amber-900/45 uppercase">
                                                        Time
                                                    </th>
                                                    <th className="px-6 py-3 text-left text-xs font-bold tracking-widest text-amber-900/45 uppercase">
                                                        Readiness
                                                    </th>
                                                    <th className="px-6 py-3 text-left text-xs font-bold tracking-widest text-amber-900/45 uppercase">
                                                        HRI
                                                    </th>
                                                    <th className="px-6 py-3 text-left text-xs font-bold tracking-widest text-amber-900/45 uppercase">
                                                        Raw Confidence
                                                    </th>
                                                    <th className="px-6 py-3 text-left text-xs font-bold tracking-widest text-amber-900/45 uppercase">
                                                        Trust
                                                    </th>
                                                    <th className="hidden px-6 py-3 text-left text-xs font-bold tracking-widest text-amber-900/45 uppercase md:table-cell">
                                                        Device
                                                    </th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-yellow-50">
                                                {historyPredictions.data
                                                    .length === 0 ? (
                                                    <tr>
                                                        <td
                                                            colSpan={6}
                                                            className="px-6 py-10 text-center text-sm text-amber-900/40"
                                                        >
                                                            No older predictions
                                                            yet.
                                                        </td>
                                                    </tr>
                                                ) : (
                                                    historyPredictions.data.map(
                                                        (prediction, index) => (
                                                            <tr
                                                                key={
                                                                    prediction.id
                                                                }
                                                                className={`cursor-pointer align-middle transition-colors ${getRowToneStyle(prediction.warning_state)}`}
                                                                onClick={() =>
                                                                    setActiveHistoryIndex(
                                                                        index,
                                                                    )
                                                                }
                                                            >
                                                                <td className="px-6 py-4 font-semibold whitespace-nowrap text-amber-900 tabular-nums">
                                                                    {formatPredictionTime(
                                                                        prediction,
                                                                    )}
                                                                </td>
                                                                <td className="px-6 py-4">
                                                                    <span
                                                                        className="inline-flex rounded-full px-3 py-1 text-xs font-bold whitespace-nowrap text-white"
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
                                                                </td>
                                                                <td className="px-6 py-4 font-semibold whitespace-nowrap text-amber-800">
                                                                    {Math.round(
                                                                        prediction.hri_value *
                                                                            100,
                                                                    )}
                                                                    %
                                                                </td>
                                                                <td className="px-6 py-4 font-semibold whitespace-nowrap text-amber-800">
                                                                    {formatRawConfidence(
                                                                        prediction.confidence_score,
                                                                    )}
                                                                </td>
                                                                <td className="px-6 py-4">
                                                                    <span
                                                                        className={`inline-flex rounded-full px-2.5 py-1 text-xs font-bold whitespace-nowrap ${getTrustStyle(prediction.warning_state)}`}
                                                                    >
                                                                        {getTrustLabel(
                                                                            prediction,
                                                                        )}
                                                                    </span>
                                                                </td>
                                                                <td className="hidden px-6 py-4 font-mono whitespace-nowrap text-amber-900/60 md:table-cell">
                                                                    {prediction.device_identifier ??
                                                                        'Unknown device'}
                                                                </td>
                                                            </tr>
                                                        ),
                                                    )
                                                )}
                                            </tbody>
                                        </table>
                                    </ScrollArea>
                                </Card>

                                {historyPredictions.last_page > 1 && (
                                    <div className="flex items-center justify-center gap-1 pt-1">
                                        {historyPredictions.links.map(
                                            (link, index) =>
                                                link.url ? (
                                                    <Link
                                                        key={index}
                                                        href={link.url}
                                                        preserveState
                                                        preserveScroll
                                                        className={`rounded-lg px-3 py-1.5 text-sm transition-colors ${
                                                            link.active
                                                                ? 'bg-amber-500 font-semibold text-white'
                                                                : 'text-amber-900/70 hover:bg-yellow-100'
                                                        }`}
                                                        dangerouslySetInnerHTML={{
                                                            __html: link.label,
                                                        }}
                                                    />
                                                ) : (
                                                    <span
                                                        key={index}
                                                        className="px-3 py-1.5 text-sm text-amber-900/30"
                                                        dangerouslySetInnerHTML={{
                                                            __html: link.label,
                                                        }}
                                                    />
                                                ),
                                        )}
                                    </div>
                                )}
                            </motion.div>
                        </Card>
                    </>
                ) : (
                    <EmptyPredictionState />
                )}
            </div>

            {activeHistoryPrediction && activeHistoryIndex !== null && (
                <Modal
                    isOpen
                    onClose={() => setActiveHistoryIndex(null)}
                    title="Prediction Details"
                    maxWidth="2xl"
                >
                    <div className="space-y-5">
                        <div className="-mt-1 mb-1 flex items-center justify-end gap-1">
                            <button
                                onClick={() =>
                                    setActiveHistoryIndex((current) =>
                                        current !== null && current > 0
                                            ? current - 1
                                            : current,
                                    )
                                }
                                disabled={!hasPrevHistory}
                                className="rounded-xl p-1.5 transition-colors hover:bg-yellow-100 disabled:cursor-not-allowed disabled:opacity-20"
                            >
                                <ChevronLeft className="h-4 w-4 text-amber-900" />
                            </button>
                            <span className="min-w-[3rem] text-center text-xs font-bold text-amber-900/40 tabular-nums">
                                {activeHistoryIndex + 1} /{' '}
                                {historyPredictions.data.length}
                            </span>
                            <button
                                onClick={() =>
                                    setActiveHistoryIndex((current) =>
                                        current !== null &&
                                        current <
                                            historyPredictions.data.length - 1
                                            ? current + 1
                                            : current,
                                    )
                                }
                                disabled={!hasNextHistory}
                                className="rounded-xl p-1.5 transition-colors hover:bg-yellow-100 disabled:cursor-not-allowed disabled:opacity-20"
                            >
                                <ChevronRight className="h-4 w-4 text-amber-900" />
                            </button>
                        </div>

                        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                            <div>
                                <p className="mb-1 text-xs font-bold tracking-widest text-amber-900/40 uppercase">
                                    Readiness
                                </p>
                                <span
                                    className="inline-flex rounded-full px-3 py-1 text-xs font-bold text-white"
                                    style={{
                                        backgroundColor: getReadinessColor(
                                            activeHistoryPrediction.readiness_level,
                                        ),
                                    }}
                                >
                                    {getReadinessLabel(
                                        activeHistoryPrediction.readiness_level,
                                    )}
                                </span>
                            </div>
                            <div>
                                <p className="mb-1 text-xs font-bold tracking-widest text-amber-900/40 uppercase">
                                    HRI
                                </p>
                                <p className="font-semibold text-amber-950">
                                    {Math.round(
                                        activeHistoryPrediction.hri_value * 100,
                                    )}
                                    %
                                </p>
                            </div>
                            <div>
                                <p className="mb-1 text-xs font-bold tracking-widest text-amber-900/40 uppercase">
                                    Raw Confidence
                                </p>
                                <p className="font-semibold text-amber-950">
                                    {formatRawConfidence(
                                        activeHistoryPrediction.confidence_score,
                                    )}
                                </p>
                            </div>
                            <div>
                                <p className="mb-1 text-xs font-bold tracking-widest text-amber-900/40 uppercase">
                                    Trust
                                </p>
                                <span
                                    className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-bold ${getTrustStyle(activeHistoryPrediction.warning_state)}`}
                                >
                                    {getTrustLabel(activeHistoryPrediction)}
                                </span>
                            </div>
                            <div>
                                <p className="mb-1 text-xs font-bold tracking-widest text-amber-900/40 uppercase">
                                    Captured
                                </p>
                                <p className="font-medium text-amber-950">
                                    {formatCapturedTime(
                                        activeHistoryPrediction,
                                    )}
                                </p>
                            </div>
                            <div>
                                <p className="mb-1 text-xs font-bold tracking-widest text-amber-900/40 uppercase">
                                    Prediction Time
                                </p>
                                <p className="font-medium text-amber-950">
                                    {formatPredictionTime(
                                        activeHistoryPrediction,
                                    )}
                                </p>
                            </div>
                            <div className="sm:col-span-2 lg:col-span-3">
                                <p className="mb-1 text-xs font-bold tracking-widest text-amber-900/40 uppercase">
                                    Device
                                </p>
                                <p className="font-medium text-amber-950">
                                    {activeHistoryPrediction.device_identifier ??
                                        'Unknown device'}
                                </p>
                            </div>
                        </div>

                        {activeHistoryPrediction.prediction_warning && (
                            <div
                                className={`rounded-2xl border px-4 py-3 ${getWarningPanelStyle(activeHistoryPrediction.warning_state)}`}
                            >
                                <span
                                    className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-bold tracking-widest uppercase ${getWarningLabelStyle(activeHistoryPrediction.warning_state)}`}
                                >
                                    Prediction Warning
                                </span>
                                <p className="mt-3 text-sm font-medium">
                                    {activeHistoryPrediction.prediction_warning}
                                </p>
                            </div>
                        )}

                        <div>
                            <p className="mb-3 text-xs font-bold tracking-widest text-amber-900/40 uppercase">
                                Sensor Snapshot
                            </p>
                            <SensorSnapshot
                                prediction={activeHistoryPrediction}
                            />
                        </div>

                        <p className="text-center text-[10px] tracking-widest text-amber-900/25 uppercase">
                            Use arrow keys to navigate
                        </p>
                    </div>
                </Modal>
            )}
        </AuthenticatedLayout>
    );
}
