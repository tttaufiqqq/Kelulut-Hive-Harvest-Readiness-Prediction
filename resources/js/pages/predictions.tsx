import { Head, Link, router } from '@inertiajs/react';
import { echo } from '@laravel/echo-react';
import {
    ArrowLeft,
    ChevronLeft,
    ChevronRight,
    CircleAlert,
} from 'lucide-react';
import { motion } from 'motion/react';
import { useEffect, useRef, useState } from 'react';
import {
    Area,
    AreaChart,
    CartesianGrid,
    Legend,
    Line,
    LineChart,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from 'recharts';
import { Button } from '@/components/core/button';
import { Card } from '@/components/core/card';
import { DataTable } from '@/components/core/content';
import { DatePicker } from '@/components/core/date-picker';
import { Modal } from '@/components/core/modal';
import { Breadcrumbs } from '@/components/core/navigation';
import {
    ChartCard,
    ConfidenceBar,
    ReadinessBadge,
    SnapshotGrid,
} from '@/components/core/readiness-chart-cards';
import { ScrollArea } from '@/components/core/scroll-area';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
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
        chart_date: string;
        default_chart_date: string;
    };
}

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

const TRUST_ALERT_STYLES: Record<string, { container: string; icon: string }> =
    {
        normal: {
            container: 'border-amber-200 bg-amber-50/80 text-amber-900',
            icon: 'text-amber-700',
        },
        warning: {
            container: 'border-amber-300 bg-amber-50 text-amber-950',
            icon: 'text-amber-700',
        },
        critical: {
            container: 'border-rose-300 bg-rose-50 text-rose-950',
            icon: 'text-rose-700',
        },
    };

const READINESS_BAR_STYLES: Record<string, string> = {
    not_ready: 'bg-rose-400',
    approaching: 'bg-amber-400',
    nearly_ready: 'bg-yellow-400',
    ready: 'bg-emerald-400',
};

const TOOLTIP_STYLE = {
    backgroundColor: '#FFFBEB',
    border: '1px solid #FEF3C7',
    borderRadius: '12px',
    fontSize: '12px',
    fontWeight: 'bold',
    color: '#78350F',
};

function formatAnimatedReading(value: number, maxFractionDigits = 1): string {
    return value.toFixed(maxFractionDigits).replace(/\.0$/, '');
}

function useAnimatedNumber(value: number, durationMs = 700) {
    const [displayValue, setDisplayValue] = useState(value);
    const previousValueRef = useRef(value);
    const animationFrameRef = useRef<number | null>(null);

    useEffect(() => {
        if (animationFrameRef.current !== null) {
            cancelAnimationFrame(animationFrameRef.current);
            animationFrameRef.current = null;
        }

        const startValue = previousValueRef.current;

        if (startValue === value) {
            setDisplayValue(value);

            return;
        }

        previousValueRef.current = value;

        const startedAt = performance.now();
        const tick = (now: number) => {
            const progress = Math.min((now - startedAt) / durationMs, 1);
            const easedProgress = 1 - Math.pow(1 - progress, 3);
            const nextValue = startValue + (value - startValue) * easedProgress;

            setDisplayValue(nextValue);

            if (progress < 1) {
                animationFrameRef.current = requestAnimationFrame(tick);
            } else {
                animationFrameRef.current = null;
                setDisplayValue(value);
            }
        };

        animationFrameRef.current = requestAnimationFrame(tick);

        return () => {
            if (animationFrameRef.current !== null) {
                cancelAnimationFrame(animationFrameRef.current);
                animationFrameRef.current = null;
            }
        };
    }, [durationMs, value]);

    return displayValue;
}

function AnimatedNumber({
    value,
    suffix = '',
    maxFractionDigits = 0,
    className = '',
}: {
    value: number;
    suffix?: string;
    maxFractionDigits?: number;
    className?: string;
}) {
    const displayValue = useAnimatedNumber(value);

    return (
        <span className={`tabular-nums ${className}`}>
            {formatAnimatedReading(displayValue, maxFractionDigits)}
            {suffix}
        </span>
    );
}

function formatRawConfidence(score: number) {
    if (score >= 0.9995) {
        return 'Approx. 99.9%+';
    }

    return `${(score * 100).toFixed(1)}%`;
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

function getTrustAlertStyle(state: string) {
    return (
        TRUST_ALERT_STYLES[state] ?? {
            container: 'border-amber-200 bg-amber-50/80 text-amber-900',
            icon: 'text-amber-700',
        }
    );
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
    return (
        <SnapshotGrid
            items={[
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
                    value: prediction.sensor_values.mq2_value,
                },
                {
                    label: 'MQ3',
                    value: prediction.sensor_values.mq3_value,
                },
                {
                    label: 'MQ5',
                    value: prediction.sensor_values.mq5_value,
                },
                {
                    label: 'MQ135',
                    value: prediction.sensor_values.mq135_value,
                },
            ]}
        />
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

    const alertStyle = getTrustAlertStyle(prediction.warning_state);

    return (
        <Alert className={alertStyle.container}>
            <CircleAlert className={alertStyle.icon} />
            <AlertTitle className="line-clamp-none">
                <div className="flex flex-wrap items-center gap-2">
                    <span
                        className={`rounded-full px-3 py-1 text-xs font-bold ${getTrustStyle(prediction.warning_state)}`}
                    >
                        {getTrustLabel(prediction)}
                    </span>
                    <span className="text-xs font-semibold opacity-75">
                        Raw model confidence{' '}
                        {formatRawConfidence(prediction.confidence_score)}
                    </span>
                </div>
            </AlertTitle>
            <AlertDescription className="text-sm opacity-85">
                <p>
                    {prediction.prediction_warning ??
                        'This result was flagged by the safety layer, so interpret the raw model score carefully.'}
                </p>
                {prediction.guardrail_action && (
                    <p className="font-medium">
                        Recommended action: {prediction.guardrail_action}
                    </p>
                )}
            </AlertDescription>
        </Alert>
    );
}

function PredictionWarningAlert({
    prediction,
}: {
    prediction: PredictionEntry;
}) {
    if (!prediction.prediction_warning && !prediction.out_of_distribution) {
        return null;
    }

    const alertStyle = getTrustAlertStyle(prediction.warning_state);

    return (
        <Alert className={alertStyle.container}>
            <CircleAlert className={alertStyle.icon} />
            <AlertTitle className="line-clamp-none">
                Prediction Warning
            </AlertTitle>
            <AlertDescription className="text-sm opacity-85">
                <p>
                    {prediction.prediction_warning ??
                        'This prediction was flagged by the safety layer, so review the reading carefully before acting on it.'}
                </p>
                {prediction.guardrail_action && (
                    <p className="font-medium">
                        Recommended action: {prediction.guardrail_action}
                    </p>
                )}
            </AlertDescription>
        </Alert>
    );
}

function PredictionTrendChart({
    data,
}: {
    data: Props['predictionTrends'];
}) {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setMounted(true);
    }, []);

    return (
        <ChartCard
            eyebrow="HRI Trend"
            title="Recent readiness movement"
            description="Monitor how HRI and raw confidence are changing across the latest live readings."
        >
            <div className="rounded-[1.75rem] border border-amber-100/70 bg-amber-50/35 p-3 sm:p-4">
                {mounted ? (
                    data.length > 0 ? (
                        <ResponsiveContainer width="100%" height={220}>
                            <AreaChart
                                data={data}
                                margin={{
                                    top: 8,
                                    right: 8,
                                    left: 8,
                                    bottom: 18,
                                }}
                            >
                                <defs>
                                    <linearGradient
                                        id="predictionsHriGradient"
                                        x1="0"
                                        y1="0"
                                        x2="0"
                                        y2="1"
                                    >
                                        <stop
                                            offset="5%"
                                            stopColor="#F59E0B"
                                            stopOpacity={0.3}
                                        />
                                        <stop
                                            offset="95%"
                                            stopColor="#F59E0B"
                                            stopOpacity={0}
                                        />
                                    </linearGradient>
                                </defs>
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
                                        fontSize: 11,
                                        fontWeight: 600,
                                    }}
                                    dy={8}
                                    tickMargin={8}
                                />
                                <YAxis
                                    domain={[0, 100]}
                                    axisLine={false}
                                    tickLine={false}
                                    width={36}
                                    tickFormatter={(value) => `${value}%`}
                                    tick={{
                                        fill: '#78350F',
                                        fontSize: 11,
                                        fontWeight: 600,
                                    }}
                                    tickMargin={8}
                                />
                                <Tooltip contentStyle={TOOLTIP_STYLE} />
                                <Legend
                                    wrapperStyle={{
                                        fontSize: 12,
                                        paddingTop: 16,
                                        lineHeight: '20px',
                                    }}
                                />
                                <Area
                                    type="monotone"
                                    dataKey="hri_pct"
                                    name="HRI"
                                    stroke="#F59E0B"
                                    strokeWidth={3}
                                    fill="url(#predictionsHriGradient)"
                                />
                                <Line
                                    type="monotone"
                                    dataKey="confidence_pct"
                                    name="Raw confidence"
                                    stroke="#92400E"
                                    strokeWidth={1.5}
                                    strokeDasharray="4 2"
                                    dot={false}
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    ) : (
                        <p className="py-10 text-center text-sm text-amber-700/60">
                            No prediction trend data for the selected date.
                        </p>
                    )
                ) : null}
            </div>
        </ChartCard>
    );
}

function SensorTrendChart({
    data,
}: {
    data: Props['predictionTrends'];
}) {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setMounted(true);
    }, []);

    return (
        <ChartCard
            eyebrow="Conditions Trend"
            title="Environmental context"
            description="Review temperature and humidity shifts alongside readiness changes."
        >
            <div className="rounded-[1.75rem] border border-amber-100/70 bg-amber-50/35 p-3 sm:p-4">
                {mounted ? (
                    data.length > 0 ? (
                        <ResponsiveContainer width="100%" height={250}>
                            <LineChart
                                data={data}
                                margin={{
                                    top: 8,
                                    right: 8,
                                    left: 8,
                                    bottom: 18,
                                }}
                            >
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
                                        fontSize: 11,
                                        fontWeight: 600,
                                    }}
                                    dy={8}
                                    tickMargin={8}
                                />
                                <YAxis
                                    axisLine={false}
                                    tickLine={false}
                                    width={36}
                                    tick={{
                                        fill: '#78350F',
                                        fontSize: 11,
                                        fontWeight: 600,
                                    }}
                                    tickMargin={8}
                                />
                                <Tooltip contentStyle={TOOLTIP_STYLE} />
                                <Legend
                                    wrapperStyle={{
                                        fontSize: 12,
                                        paddingTop: 16,
                                        lineHeight: '20px',
                                    }}
                                />
                                <Line
                                    type="monotone"
                                    dataKey="temp"
                                    name="Temp (°C)"
                                    stroke="#ef4444"
                                    strokeWidth={2}
                                    dot={false}
                                />
                                <Line
                                    type="monotone"
                                    dataKey="humidity"
                                    name="Humidity (%)"
                                    stroke="#3b82f6"
                                    strokeWidth={2}
                                    dot={false}
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    ) : (
                        <p className="py-10 text-center text-sm text-amber-700/60">
                            No environmental trend data for the selected date.
                        </p>
                    )
                ) : null}
            </div>
        </ChartCard>
    );
}

function ChartsFilterBar({
    selectedDate,
    defaultDate,
    onDateChange,
}: {
    selectedDate: string;
    defaultDate: string;
    onDateChange: (date: string | null) => void;
}) {
    return (
        <div className="flex flex-col gap-3 rounded-3xl border border-yellow-100 bg-white px-4 py-4 shadow-sm sm:flex-row sm:items-center sm:justify-between sm:px-5">
            <div>
                <p className="text-[10px] font-black tracking-widest text-amber-900/45 uppercase">
                    Chart Filter
                </p>
                <p className="mt-1 text-sm text-amber-700">
                    Choose one date to update both trend charts together.
                </p>
            </div>
            <div className="w-full sm:w-auto">
                <DatePicker
                    className="w-full sm:w-[160px]"
                    value={selectedDate}
                    onChange={onDateChange}
                    defaultValue={defaultDate}
                />
            </div>
        </div>
    );
}

function MobilePredictionHistoryList({
    predictions,
    onSelect,
}: {
    predictions: PredictionEntry[];
    onSelect: (predictionId: number) => void;
}) {
    return (
        <Card className="overflow-hidden border-yellow-100 p-0 shadow-sm">
            <ScrollArea direction="horizontal" className="w-full">
                <DataTable
                    className="overflow-visible"
                    tableClassName="min-w-[760px] text-sm"
                    bodyClassName="divide-y divide-yellow-50"
                    rowClassName={(prediction) =>
                        getRowToneStyle(prediction.warning_state)
                    }
                    data={predictions}
                    onRowClick={(_, index) =>
                        onSelect(predictions[index]?.id ?? 0)
                    }
                    emptyColSpan={6}
                    emptyState={
                        <div className="px-6 py-10 text-center text-sm text-amber-900/40">
                            No older predictions yet.
                        </div>
                    }
                    columns={[
                        {
                            key: 'time',
                            header: 'Time',
                            cellClassName:
                                'min-w-[11rem] px-4 py-3.5 font-semibold whitespace-nowrap text-amber-900 tabular-nums sm:px-6 sm:py-4',
                            render: (prediction) =>
                                formatPredictionTime(prediction),
                        },
                        {
                            key: 'readiness',
                            header: 'Readiness',
                            cellClassName: 'px-4 py-3.5 sm:px-6 sm:py-4',
                            render: (prediction) => (
                                <ReadinessBadge
                                    level={prediction.readiness_level}
                                    size="sm"
                                />
                            ),
                        },
                        {
                            key: 'hri',
                            header: 'HRI',
                            cellClassName:
                                'px-4 py-3.5 font-semibold whitespace-nowrap text-amber-800 sm:px-6 sm:py-4',
                            render: (prediction) =>
                                `${Math.round(prediction.hri_value * 100)}%`,
                        },
                        {
                            key: 'confidence',
                            header: 'Raw Confidence',
                            cellClassName:
                                'px-4 py-3.5 font-semibold whitespace-nowrap text-amber-800 sm:px-6 sm:py-4',
                            render: (prediction) =>
                                formatRawConfidence(
                                    prediction.confidence_score,
                                ),
                        },
                        {
                            key: 'trust',
                            header: 'Trust',
                            headerClassName: 'hidden sm:table-cell',
                            cellClassName:
                                'hidden px-4 py-3.5 sm:table-cell sm:px-6 sm:py-4',
                            render: (prediction) => (
                                <span
                                    className={`inline-flex rounded-full px-2.5 py-1 text-xs font-bold whitespace-nowrap ${getTrustStyle(prediction.warning_state)}`}
                                >
                                    {getTrustLabel(prediction)}
                                </span>
                            ),
                        },
                        {
                            key: 'device',
                            header: 'Device',
                            headerClassName: 'hidden sm:table-cell',
                            cellClassName:
                                'hidden px-6 py-4 font-mono whitespace-nowrap text-amber-900/60 sm:table-cell',
                            render: (prediction) =>
                                prediction.device_identifier ??
                                'Unknown device',
                        },
                    ]}
                />
            </ScrollArea>
        </Card>
    );
}

function AnimatedReadinessBadge({ level }: { level: string }) {
    const badge = (
        <ReadinessBadge
            level={level}
            appearance="solid"
            className="text-base"
        />
    );

    if (level !== 'ready') {
        return badge;
    }

    return (
        <motion.div
            className="inline-flex rounded-full"
            animate={{
                filter: [
                    'drop-shadow(0 0 0 rgba(22,163,74,0.0))',
                    'drop-shadow(0 0 12px rgba(22,163,74,0.38)) drop-shadow(0 0 20px rgba(110,231,183,0.26))',
                    'drop-shadow(0 0 0 rgba(22,163,74,0.0))',
                ],
            }}
            transition={{
                duration: 2,
                repeat: Infinity,
                ease: 'easeInOut',
            }}
        >
            {badge}
        </motion.div>
    );
}

function LiveBadge({ className = '' }: { className?: string }) {
    return (
        <span
            className={`w-fit items-center gap-2 rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-bold tracking-[0.18em] text-emerald-700 uppercase ${className}`}
        >
            <motion.span
                className="h-2 w-2 shrink-0 rounded-full bg-emerald-500"
                animate={{ opacity: [1, 0.3, 1] }}
                transition={{
                    duration: 1.2,
                    repeat: Infinity,
                    ease: 'easeInOut',
                }}
            />
            Live
        </span>
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
    const liveReloadInFlight = useRef(false);
    const predictionChannelName = `hive.${hive.id}.predictions`;
    const [showHistory, setShowHistory] = useState(filters.page > 1);
    const [activeHistoryId, setActiveHistoryId] = useState<number | null>(null);
    const activeHistoryIndex =
        activeHistoryId === null
            ? null
            : historyPredictions.data.findIndex(
                  (prediction) => prediction.id === activeHistoryId,
              );
    const activeHistoryPrediction =
        activeHistoryIndex !== null && activeHistoryIndex >= 0
            ? (historyPredictions.data[activeHistoryIndex] ?? null)
            : null;
    const hasPrevHistory =
        activeHistoryIndex !== null && activeHistoryIndex > 0;
    const hasNextHistory =
        activeHistoryIndex !== null &&
        activeHistoryIndex < historyPredictions.data.length - 1;

    useEffect(() => {
        const resetLiveReload = () => {
            liveReloadInFlight.current = false;
        };

        const removeStartListener = router.on('start', () => {
            liveReloadInFlight.current = true;
        });
        const removeFinishListener = router.on('finish', resetLiveReload);

        return () => {
            removeStartListener();
            removeFinishListener();
        };
    }, []);

    useEffect(() => {
        const realtime = echo();
        const channel = realtime.private(predictionChannelName);
        const eventName = '.prediction.created';
        const resetLiveReload = () => {
            liveReloadInFlight.current = false;
        };
        const reloadPredictionProps = () => {
            if (document.hidden || liveReloadInFlight.current) {
                return;
            }

            liveReloadInFlight.current = true;

            router.reload({
                only: [
                    'latestPrediction',
                    'predictionTrends',
                    'historyPredictions',
                ],
                onCancel: resetLiveReload,
                onError: resetLiveReload,
                onFinish: resetLiveReload,
                onSuccess: resetLiveReload,
            });
        };

        channel.listen(eventName, reloadPredictionProps);

        return () => {
            channel.stopListening(eventName, reloadPredictionProps);
            realtime.leave(predictionChannelName);
        };
    }, [predictionChannelName]);

    useEffect(() => {
        if (activeHistoryIndex === null || activeHistoryIndex < 0) {
            return;
        }

        const handler = (event: KeyboardEvent) => {
            if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
                event.preventDefault();
                setActiveHistoryId(
                    historyPredictions.data[activeHistoryIndex - 1]?.id ??
                        activeHistoryId,
                );
            }

            if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
                event.preventDefault();
                setActiveHistoryId(
                    historyPredictions.data[activeHistoryIndex + 1]?.id ??
                        activeHistoryId,
                );
            }
        };

        window.addEventListener('keydown', handler);

        return () => window.removeEventListener('keydown', handler);
    }, [activeHistoryId, activeHistoryIndex, historyPredictions.data]);

    function handleChartDateChange(date: string | null) {
        const resolved = date ?? filters.default_chart_date;
        router.get(
            route('predictions.live', { hive: hive.id }),
            {
                chart_date: resolved,
                page: filters.page,
            },
            {
                preserveState: true,
                preserveScroll: true,
                only: ['predictionTrends', 'filters'],
            },
        );
    }

    return (
        <AuthenticatedLayout>
            <Head title={`Live Predictions — ${hive.name}`} />

            <div className="mx-auto w-full max-w-7xl space-y-8 p-4 sm:p-6 md:p-10 lg:px-10 lg:py-8">
                <div className="flex flex-col gap-3">
                    <Breadcrumbs
                        items={[
                            { label: 'Home', href: '/' },
                            { label: 'My Hives', href: '/dashboard' },
                            { label: hive.name, href: '/dashboard' },
                            { label: 'Live Predictions' },
                        ]}
                    />
                    <div className="flex items-start gap-3">
                        <Link
                            href="/dashboard"
                            className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber-100 text-amber-900 transition-colors hover:bg-amber-200"
                        >
                            <ArrowLeft className="h-4 w-4" />
                        </Link>
                        <div className="min-w-0 flex-1">
                            <h1 className="text-2xl leading-tight font-black text-amber-900">
                                Live Predictions
                            </h1>
                            <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:gap-3">
                                <div className="min-w-0 flex-1 text-sm leading-relaxed text-amber-700">
                                    <div className="flex items-center justify-between gap-3 sm:block">
                                        <p className="truncate font-semibold text-amber-800">
                                            {hive.name}
                                        </p>
                                        <LiveBadge className="inline-flex shrink-0 sm:hidden" />
                                    </div>
                                    <p className="text-amber-700/75">
                                        ML Harvest Readiness
                                    </p>
                                </div>
                                <LiveBadge className="hidden sm:inline-flex" />
                            </div>
                        </div>
                    </div>
                </div>

                {latest ? (
                    <>
                        <ChartCard
                            eyebrow="Latest Prediction"
                            title="Current model output"
                            description="Live harvest readiness result from the most recent processed sensor reading."
                            className="p-6 sm:p-8"
                        >
                            <div className="space-y-6">
                                <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
                                    <div className="space-y-4">
                                        <AnimatedReadinessBadge
                                            level={latest.readiness_level}
                                        />
                                        <div className="flex flex-wrap items-end gap-3">
                                            <p className="text-5xl font-black tracking-tight text-amber-900">
                                                <AnimatedNumber
                                                    value={
                                                        latest.hri_value * 100
                                                    }
                                                    suffix="%"
                                                    className="text-5xl font-black tracking-tight text-amber-900"
                                                />
                                            </p>
                                            <p className="pb-1 text-sm text-amber-900/55">
                                                HRI value
                                            </p>
                                        </div>
                                    </div>

                                    <div className="grid gap-5 text-sm sm:grid-cols-2 lg:min-w-[360px]">
                                        <div>
                                            <p className="text-[10px] font-bold tracking-wider text-amber-900/40 uppercase">
                                                Trust
                                            </p>
                                            <span
                                                className={`mt-2 inline-flex rounded-full px-3 py-1 text-sm font-bold ${getTrustStyle(latest.warning_state)}`}
                                            >
                                                {getTrustLabel(latest)}
                                            </span>
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-bold tracking-wider text-amber-900/40 uppercase">
                                                Captured
                                            </p>
                                            <p className="mt-2 font-semibold text-amber-900">
                                                {formatCapturedTime(latest)}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-bold tracking-wider text-amber-900/40 uppercase">
                                                Prediction Time
                                            </p>
                                            <p className="mt-2 font-semibold text-amber-900">
                                                {formatPredictionTime(latest)}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-bold tracking-wider text-amber-900/40 uppercase">
                                                Device
                                            </p>
                                            <p className="mt-2 font-semibold text-amber-900">
                                                {latest.device_identifier ??
                                                    'Unknown device'}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <ConfidenceBar
                                    value={Math.min(
                                        latest.confidence_score * 100,
                                        99.9,
                                    )}
                                    label="Raw model confidence"
                                    formatter={() => (
                                        <AnimatedNumber
                                            value={
                                                latest.confidence_score * 100
                                            }
                                            suffix="%"
                                            maxFractionDigits={1}
                                        />
                                    )}
                                    barClassName={
                                        READINESS_BAR_STYLES[
                                            latest.readiness_level
                                        ] ?? 'bg-amber-400'
                                    }
                                />

                                <PredictionTrustNotice prediction={latest} />
                            </div>
                        </ChartCard>

                        <div className="space-y-6">
                            <ChartsFilterBar
                                selectedDate={filters.chart_date}
                                defaultDate={filters.default_chart_date}
                                onDateChange={handleChartDateChange}
                            />

                            <div className="grid gap-6 xl:grid-cols-2">
                                <PredictionTrendChart
                                    data={predictionTrends}
                                />
                                <SensorTrendChart data={predictionTrends} />
                            </div>
                        </div>

                        <ChartCard
                            eyebrow="Current Sensor Snapshot"
                            title="Inputs behind the latest prediction"
                            description="The most recent environmental and gas readings used by the model."
                            actions={
                                <p className="text-sm font-semibold text-amber-900/70">
                                    {formatPredictionTime(latest)}
                                </p>
                            }
                        >
                            <SensorSnapshot prediction={latest} />
                        </ChartCard>

                        <ChartCard
                            eyebrow="Recent Predictions"
                            title="History browser"
                            description="Select a row to inspect older prediction details."
                            className="p-5"
                        >
                            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                <span className="w-fit rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-700">
                                    {historyPredictions.total} older
                                </span>
                                <Button
                                    type="button"
                                    variant="secondary"
                                    size="sm"
                                    onClick={() =>
                                        setShowHistory((current) => !current)
                                    }
                                    className="w-full justify-center gap-2 text-sm font-semibold sm:w-auto"
                                >
                                    {showHistory ? (
                                        <ChevronLeft className="h-4 w-4 rotate-[-90deg]" />
                                    ) : (
                                        <ChevronRight className="h-4 w-4" />
                                    )}
                                    {showHistory
                                        ? 'Hide history'
                                        : 'Show history'}
                                </Button>
                            </div>

                            <motion.div
                                initial={false}
                                animate={{
                                    height: showHistory ? 'auto' : 0,
                                    opacity: showHistory ? 1 : 0,
                                }}
                                transition={{ duration: 0.2, ease: 'easeOut' }}
                                className={
                                    showHistory
                                        ? 'mt-4 space-y-3'
                                        : 'pointer-events-none mt-4 space-y-3 overflow-hidden'
                                }
                            >
                                <MobilePredictionHistoryList
                                    predictions={historyPredictions.data}
                                    onSelect={setActiveHistoryId}
                                />

                                {historyPredictions.last_page > 1 && (
                                    <>
                                        <div className="flex items-center justify-between gap-3 pt-1 md:hidden">
                                            {historyPredictions.links[0]?.url ? (
                                                <Link
                                                    href={
                                                        historyPredictions
                                                            .links[0].url
                                                    }
                                                    preserveState
                                                    preserveScroll
                                                    className="rounded-full bg-yellow-100 px-4 py-2 text-sm font-semibold text-amber-900 transition-colors hover:bg-yellow-200"
                                                >
                                                    Previous
                                                </Link>
                                            ) : (
                                                <span className="rounded-full bg-stone-100 px-4 py-2 text-sm font-semibold text-stone-400">
                                                    Previous
                                                </span>
                                            )}

                                            <span className="text-center text-sm font-semibold text-amber-900/70">
                                                Page {historyPredictions.current_page}{' '}
                                                of {historyPredictions.last_page}
                                            </span>

                                            {historyPredictions.links.at(-1)
                                                ?.url ? (
                                                <Link
                                                    href={
                                                        historyPredictions.links.at(
                                                            -1,
                                                        )!.url!
                                                    }
                                                    preserveState
                                                    preserveScroll
                                                    className="rounded-full bg-yellow-100 px-4 py-2 text-sm font-semibold text-amber-900 transition-colors hover:bg-yellow-200"
                                                >
                                                    Next
                                                </Link>
                                            ) : (
                                                <span className="rounded-full bg-stone-100 px-4 py-2 text-sm font-semibold text-stone-400">
                                                    Next
                                                </span>
                                            )}
                                        </div>

                                        <div className="hidden flex-wrap items-center justify-center gap-1 pt-1 md:flex">
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
                                    </>
                                )}
                            </motion.div>
                        </ChartCard>
                    </>
                ) : (
                    <EmptyPredictionState />
                )}
            </div>

            {activeHistoryPrediction && activeHistoryIndex !== null && (
                <Modal
                    isOpen
                    onClose={() => setActiveHistoryId(null)}
                    title="Prediction Details"
                    maxWidth="2xl"
                >
                    <>
                        <div className="space-y-4 sm:hidden">
                            <div className="-mt-1 mb-1 flex items-center justify-end gap-1">
                                <Button
                                    type="button"
                                    variant="ghost"
                                    onClick={() =>
                                        setActiveHistoryId(
                                            historyPredictions.data[
                                                activeHistoryIndex - 1
                                            ]?.id ?? activeHistoryId,
                                        )
                                    }
                                    disabled={!hasPrevHistory}
                                    className="h-auto rounded-xl p-1.5 text-amber-900 hover:bg-yellow-100 disabled:cursor-not-allowed disabled:opacity-20"
                                >
                                    <ChevronLeft className="h-4 w-4 text-amber-900" />
                                </Button>
                                <span className="min-w-[3rem] text-center text-xs font-bold text-amber-900/40 tabular-nums">
                                    {activeHistoryIndex + 1} /{' '}
                                    {historyPredictions.data.length}
                                </span>
                                <Button
                                    type="button"
                                    variant="ghost"
                                    onClick={() =>
                                        setActiveHistoryId(
                                            historyPredictions.data[
                                                activeHistoryIndex + 1
                                            ]?.id ?? activeHistoryId,
                                        )
                                    }
                                    disabled={!hasNextHistory}
                                    className="h-auto rounded-xl p-1.5 text-amber-900 hover:bg-yellow-100 disabled:cursor-not-allowed disabled:opacity-20"
                                >
                                    <ChevronRight className="h-4 w-4 text-amber-900" />
                                </Button>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="min-w-0">
                                    <p className="mb-1 text-xs font-bold tracking-widest text-amber-900/40 uppercase">
                                        Readiness
                                    </p>
                                    <ReadinessBadge
                                        level={
                                            activeHistoryPrediction.readiness_level
                                        }
                                        size="sm"
                                        className="min-w-[7.5rem] justify-center"
                                    />
                                </div>
                                <div className="min-w-0">
                                    <p className="mb-1 text-xs font-bold tracking-widest text-amber-900/40 uppercase">
                                        Trust
                                    </p>
                                    <span
                                        className={`inline-flex min-w-[7.5rem] justify-center rounded-full px-3 py-1 text-xs font-bold ${getTrustStyle(activeHistoryPrediction.warning_state)}`}
                                    >
                                        {getTrustLabel(
                                            activeHistoryPrediction,
                                        )}
                                    </span>
                                </div>
                                <div className="min-w-0">
                                    <p className="mb-1 text-xs font-bold tracking-widest text-amber-900/40 uppercase">
                                        HRI
                                    </p>
                                    <p className="font-medium text-amber-950">
                                        <AnimatedNumber
                                            value={
                                                activeHistoryPrediction.hri_value *
                                                100
                                            }
                                            suffix="%"
                                        />
                                    </p>
                                </div>
                                <div className="min-w-0">
                                    <p className="mb-1 text-xs font-bold tracking-widest text-amber-900/40 uppercase">
                                        Raw Confidence
                                    </p>
                                    <p className="font-medium text-amber-950">
                                        <AnimatedNumber
                                            value={
                                                activeHistoryPrediction.confidence_score *
                                                100
                                            }
                                            suffix="%"
                                            maxFractionDigits={1}
                                        />
                                    </p>
                                </div>
                                <div className="min-w-0">
                                    <p className="mb-1 text-xs font-bold tracking-widest text-amber-900/40 uppercase">
                                        Captured
                                    </p>
                                    <p className="break-words font-medium text-amber-950">
                                        {formatCapturedTime(
                                            activeHistoryPrediction,
                                        )}
                                    </p>
                                </div>
                                <div className="min-w-0">
                                    <p className="mb-1 text-xs font-bold tracking-widest text-amber-900/40 uppercase">
                                        Prediction Time
                                    </p>
                                    <p className="break-words font-medium text-amber-950">
                                        {formatPredictionTime(
                                            activeHistoryPrediction,
                                        )}
                                    </p>
                                </div>
                                <div className="col-span-2 min-w-0">
                                    <p className="mb-1 text-xs font-bold tracking-widest text-amber-900/40 uppercase">
                                        Device
                                    </p>
                                    <p className="break-words font-medium text-amber-950">
                                        {activeHistoryPrediction.device_identifier ??
                                            'Unknown device'}
                                    </p>
                                </div>
                            </div>

                            <PredictionWarningAlert
                                prediction={activeHistoryPrediction}
                            />

                            <div>
                                <p className="mb-2 text-xs font-bold tracking-widest text-amber-900/40 uppercase">
                                    Sensor Snapshot
                                </p>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <p className="mb-1 text-xs font-bold tracking-widest text-amber-900/40 uppercase">
                                            Temp
                                        </p>
                                        <p className="font-medium text-amber-950">
                                            {
                                                activeHistoryPrediction
                                                    .sensor_values.temp
                                            }
                                            °C
                                        </p>
                                    </div>
                                    <div>
                                        <p className="mb-1 text-xs font-bold tracking-widest text-amber-900/40 uppercase">
                                            Humidity
                                        </p>
                                        <p className="font-medium text-amber-950">
                                            {
                                                activeHistoryPrediction
                                                    .sensor_values.humidity
                                            }
                                            %
                                        </p>
                                    </div>
                                    <div>
                                        <p className="mb-1 text-xs font-bold tracking-widest text-amber-900/40 uppercase">
                                            MQ2
                                        </p>
                                        <p className="font-medium text-amber-950">
                                            {
                                                activeHistoryPrediction
                                                    .sensor_values.mq2_value
                                            }
                                        </p>
                                    </div>
                                    <div>
                                        <p className="mb-1 text-xs font-bold tracking-widest text-amber-900/40 uppercase">
                                            MQ3
                                        </p>
                                        <p className="font-medium text-amber-950">
                                            {
                                                activeHistoryPrediction
                                                    .sensor_values.mq3_value
                                            }
                                        </p>
                                    </div>
                                    <div>
                                        <p className="mb-1 text-xs font-bold tracking-widest text-amber-900/40 uppercase">
                                            MQ5
                                        </p>
                                        <p className="font-medium text-amber-950">
                                            {
                                                activeHistoryPrediction
                                                    .sensor_values.mq5_value
                                            }
                                        </p>
                                    </div>
                                    <div>
                                        <p className="mb-1 text-xs font-bold tracking-widest text-amber-900/40 uppercase">
                                            MQ135
                                        </p>
                                        <p className="font-medium text-amber-950">
                                            {
                                                activeHistoryPrediction
                                                    .sensor_values.mq135_value
                                            }
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <p className="text-center text-[10px] tracking-widest text-amber-900/25 uppercase">
                                Use arrow keys to navigate
                            </p>

                            <div className="pt-2">
                                <Button
                                    type="button"
                                    variant="ghost"
                                    onClick={() => setActiveHistoryId(null)}
                                    className="w-full"
                                >
                                    Close
                                </Button>
                            </div>
                        </div>

                        <div className="hidden space-y-5 sm:block">
                            <div className="-mt-2 mb-0.5 flex items-center justify-end gap-1">
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={() =>
                                        setActiveHistoryId(
                                            historyPredictions.data[
                                                activeHistoryIndex - 1
                                            ]?.id ?? activeHistoryId,
                                        )
                                    }
                                    disabled={!hasPrevHistory}
                                    className="h-9 w-9 rounded-xl p-0 text-amber-900 transition-none active:scale-100 hover:bg-yellow-100 hover:text-amber-900"
                                >
                                    <ChevronLeft className="h-4 w-4" />
                                </Button>
                                <span className="min-w-[3rem] text-center text-xs font-bold text-amber-900/40 tabular-nums">
                                    {activeHistoryIndex + 1} /{' '}
                                    {historyPredictions.data.length}
                                </span>
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={() =>
                                        setActiveHistoryId(
                                            historyPredictions.data[
                                                activeHistoryIndex + 1
                                            ]?.id ?? activeHistoryId,
                                        )
                                    }
                                    disabled={!hasNextHistory}
                                    className="h-9 w-9 rounded-xl p-0 text-amber-900 transition-none active:scale-100 hover:bg-yellow-100 hover:text-amber-900"
                                >
                                    <ChevronRight className="h-4 w-4" />
                                </Button>
                            </div>

                            <div className="grid grid-cols-2 gap-x-4 gap-y-3 sm:gap-4 lg:grid-cols-3">
                                <div>
                                    <p className="mb-1 text-[11px] font-bold tracking-widest text-amber-900/40 uppercase">
                                        Readiness
                                    </p>
                                    <ReadinessBadge
                                        level={
                                            activeHistoryPrediction.readiness_level
                                        }
                                        size="sm"
                                    />
                                </div>
                                <div>
                                    <p className="mb-1 text-[11px] font-bold tracking-widest text-amber-900/40 uppercase">
                                        HRI
                                    </p>
                                    <p className="font-semibold text-amber-950">
                                        <AnimatedNumber
                                            value={
                                                activeHistoryPrediction.hri_value *
                                                100
                                            }
                                            suffix="%"
                                        />
                                    </p>
                                </div>
                                <div>
                                    <p className="mb-1 text-[11px] font-bold tracking-widest text-amber-900/40 uppercase">
                                        Raw Confidence
                                    </p>
                                    <p className="font-semibold text-amber-950">
                                        <AnimatedNumber
                                            value={
                                                activeHistoryPrediction.confidence_score *
                                                100
                                            }
                                            suffix="%"
                                            maxFractionDigits={1}
                                        />
                                    </p>
                                </div>
                                <div>
                                    <p className="mb-1 text-[11px] font-bold tracking-widest text-amber-900/40 uppercase">
                                        Trust
                                    </p>
                                    <span
                                        className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-bold ${getTrustStyle(activeHistoryPrediction.warning_state)}`}
                                    >
                                        {getTrustLabel(
                                            activeHistoryPrediction,
                                        )}
                                    </span>
                                </div>
                                <div className="col-span-2 sm:col-span-1">
                                    <p className="mb-1 text-[11px] font-bold tracking-widest text-amber-900/40 uppercase">
                                        Captured
                                    </p>
                                    <p className="font-medium text-amber-950">
                                        {formatCapturedTime(
                                            activeHistoryPrediction,
                                        )}
                                    </p>
                                </div>
                                <div className="col-span-2 sm:col-span-1">
                                    <p className="mb-1 text-[11px] font-bold tracking-widest text-amber-900/40 uppercase">
                                        Prediction Time
                                    </p>
                                    <p className="font-medium text-amber-950">
                                        {formatPredictionTime(
                                            activeHistoryPrediction,
                                        )}
                                    </p>
                                </div>
                                <div className="col-span-2 lg:col-span-3">
                                    <p className="mb-1 text-[11px] font-bold tracking-widest text-amber-900/40 uppercase">
                                        Device
                                    </p>
                                    <p className="font-medium text-amber-950">
                                        {activeHistoryPrediction.device_identifier ??
                                            'Unknown device'}
                                    </p>
                                </div>
                            </div>

                            <PredictionWarningAlert
                                prediction={activeHistoryPrediction}
                            />

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
                    </>
                </Modal>
            )}
        </AuthenticatedLayout>
    );
}
