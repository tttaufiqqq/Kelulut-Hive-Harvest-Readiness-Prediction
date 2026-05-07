import { Head, Link, router } from '@inertiajs/react';
import { ArrowLeft } from 'lucide-react';
import { useEffect, useState } from 'react';
import {
    Area,
    AreaChart,
    Bar,
    BarChart,
    CartesianGrid,
    Legend,
    Line,
    LineChart,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from 'recharts';
import type { NameType, ValueType } from 'recharts/types/component/DefaultTooltipContent';
import type { TooltipProps } from 'recharts/types/component/Tooltip';
import { DatePicker } from '@/components/core/date-picker';
import { Breadcrumbs } from '@/components/core/navigation';
import {
    ChartCard,
    ConfidenceBar,
    getReadinessColor,
    ReadinessBadge,
    ReadinessScoreCard,
} from '@/components/core/readiness-chart-cards';
import { SelectField } from '@/components/core/select-field';
import { AuthenticatedLayout } from '@/layouts/authenticated-layout';

interface HiveData {
    id: number;
    name: string;
    latest_readiness_level: string | null;
    avg_hri_pct: number;
    avg_hri_7d_pct: number;
    total_harvests: number;
    last_harvest_date: string | null;
}

interface HriTrend {
    date: string;
    hri_score: number;
    avg_7d: number;
}

interface SensorReading {
    time: string;
    temp: number;
    humidity: number;
    mq2: number;
    mq3: number;
    mq5: number;
    mq135: number;
}

interface LatestPrediction {
    readiness_level: string;
    hri_value: number;
    confidence_score: number;
    prediction_timestamp: string;
}

interface HarvestRecord {
    date: string;
    weight: number;
    color: string | null;
    flavor: string | null;
}

interface Props {
    hive: HiveData;
    hriTrend: HriTrend[];
    sensorReadings: SensorReading[];
    latestPrediction: LatestPrediction | null;
    harvestHistory: HarvestRecord[];
}

const TOOLTIP_STYLE = {
    backgroundColor: '#FFFBEB',
    border: '1px solid #FEF3C7',
    borderRadius: '12px',
    fontSize: '12px',
    fontWeight: 'bold',
    color: '#78350F',
};

const SENSOR_GROUP_OPTIONS = [
    { value: 'all', label: 'All Sensors' },
    { value: 'environment', label: 'Environmental (Temp + Humidity)' },
    { value: 'gas', label: 'Gas Sensors (MQ2 – MQ135)' },
];

const SENSOR_SERIES = {
    environment: [
        { dataKey: 'temp', name: 'Temp', stroke: '#ef4444', yAxisId: 'env' },
        {
            dataKey: 'humidity',
            name: 'Humidity',
            stroke: '#3b82f6',
            yAxisId: 'env',
        },
    ],
    gas: [
        { dataKey: 'mq2', name: 'MQ2', stroke: '#8b5cf6', yAxisId: 'gas' },
        { dataKey: 'mq3', name: 'MQ3', stroke: '#f97316', yAxisId: 'gas' },
        { dataKey: 'mq5', name: 'MQ5', stroke: '#10b981', yAxisId: 'gas' },
        {
            dataKey: 'mq135',
            name: 'MQ135',
            stroke: '#f59e0b',
            yAxisId: 'gas',
        },
    ],
} as const;

const READINESS_BAR_STYLES: Record<string, string> = {
    not_ready: 'bg-rose-400',
    approaching: 'bg-amber-400',
    nearly_ready: 'bg-yellow-400',
    ready: 'bg-emerald-400',
};

const sensorTooltipFormatter: NonNullable<TooltipProps<ValueType, NameType>['formatter']> = (
    value,
    name,
) => {
    const numericValue = typeof value === 'number' ? value : 0;
    const resolvedName =
        typeof name === 'string' || typeof name === 'number'
            ? String(name)
            : '';

    if (resolvedName === 'Temp') {
        return [`${numericValue}°C`, resolvedName];
    }

    if (resolvedName === 'Humidity') {
        return [`${numericValue}%`, resolvedName];
    }

    return [numericValue, `${resolvedName} ADC`];
};

function HriScoreCard({ hive }: { hive: HiveData }) {
    return (
        <ReadinessScoreCard
            value={
                <span
                    style={{
                        color: getReadinessColor(hive.latest_readiness_level),
                    }}
                >
                    {hive.avg_hri_pct}%
                </span>
            }
            level={hive.latest_readiness_level}
            secondaryLabel="7-day avg"
            secondaryValue={`${hive.avg_hri_7d_pct}%`}
            description="Current harvest readiness score based on the latest analytics window."
        />
    );
}

function HriTrendChart({ data }: { data: HriTrend[] }) {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setMounted(true);
    }, []);

    return (
        <ChartCard
            eyebrow="HRI Trend"
            title="Harvest readiness over 30 days"
            description="Compare the daily score with the rolling 7-day average."
        >
            <div className="rounded-[1.75rem] border border-amber-100/70 bg-amber-50/35 p-3 sm:p-4">
                {mounted && (
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
                                    id="analyticsHriGradient"
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
                                dataKey="date"
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
                                dataKey="hri_score"
                                name="HRI Score"
                                stroke="#F59E0B"
                                strokeWidth={3}
                                fill="url(#analyticsHriGradient)"
                            />
                            <Line
                                type="monotone"
                                dataKey="avg_7d"
                                name="7d Avg"
                                stroke="#92400E"
                                strokeWidth={1.5}
                                strokeDasharray="4 2"
                                dot={false}
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                )}
            </div>
        </ChartCard>
    );
}

function SensorChart({
    data,
    selectedDate,
    onDateChange,
}: {
    data: SensorReading[];
    selectedDate: string;
    onDateChange: (date: string | null) => void;
}) {
    const todayYMD = new Date().toISOString().slice(0, 10);
    const [mounted, setMounted] = useState(false);
    const [group, setGroup] = useState('all');

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setMounted(true);
    }, []);

    const showEnvironment = group === 'all' || group === 'environment';
    const showGas = group === 'all' || group === 'gas';
    const visibleSeries = [
        ...(showEnvironment ? SENSOR_SERIES.environment : []),
        ...(showGas ? SENSOR_SERIES.gas : []),
    ];

    return (
        <ChartCard
            eyebrow="Sensor Readings"
            title="Daily sensor curves"
            description="Filter the selected date into environment or gas sensor groups."
            actions={
                <div className="grid w-full grid-cols-2 gap-2 sm:flex sm:w-auto sm:flex-nowrap sm:justify-end">
                    <DatePicker
                        className="w-full shrink-0 sm:w-[152px]"
                        value={selectedDate}
                        onChange={onDateChange}
                        defaultValue={todayYMD}
                    />
                    <div className="min-w-0 sm:w-[210px] sm:flex-none">
                        <SelectField
                            value={group}
                            onChange={setGroup}
                            options={SENSOR_GROUP_OPTIONS}
                        />
                    </div>
                </div>
            }
        >
            <div className="rounded-[1.75rem] border border-amber-100/70 bg-amber-50/35 p-3 sm:p-4">
                {mounted && (
                    <ResponsiveContainer width="100%" height={290}>
                        <LineChart
                            data={data}
                            margin={{
                                top: 8,
                                right: showGas ? 8 : 0,
                                left: 8,
                                bottom: 18,
                            }}
                        >
                            <CartesianGrid
                                strokeDasharray="3 3"
                                vertical={false}
                                stroke="#FDE68A"
                                strokeOpacity={0.55}
                            />
                            <XAxis
                                dataKey="time"
                                axisLine={false}
                                tickLine={false}
                                tick={{
                                    fill: '#78350F',
                                    fontSize: 11,
                                    fontWeight: 600,
                                }}
                                dy={8}
                            />
                            {showEnvironment && (
                                <YAxis
                                    yAxisId="env"
                                    domain={[0, 100]}
                                    axisLine={false}
                                    tickLine={false}
                                    width={36}
                                    tick={{
                                        fill: '#78350F',
                                        fontSize: 11,
                                        fontWeight: 600,
                                    }}
                                    tickFormatter={(value) => `${value}`}
                                    tickMargin={8}
                                />
                            )}
                            {showGas && (
                                <YAxis
                                    yAxisId="gas"
                                    orientation="right"
                                    axisLine={false}
                                    tickLine={false}
                                    width={44}
                                    domain={[
                                        (dataMin: number) =>
                                            Math.max(0, dataMin - 40),
                                        (dataMax: number) => dataMax + 40,
                                    ]}
                                    tick={{
                                        fill: '#92400E',
                                        fontSize: 11,
                                        fontWeight: 600,
                                    }}
                                    tickMargin={8}
                                />
                            )}
                            <Tooltip
                                contentStyle={TOOLTIP_STYLE}
                                formatter={sensorTooltipFormatter}
                            />
                            <Legend
                                iconType="circle"
                                wrapperStyle={{
                                    fontSize: 12,
                                    paddingTop: 16,
                                    lineHeight: '20px',
                                }}
                            />
                            {visibleSeries.map((series) => (
                                <Line
                                    key={series.dataKey}
                                    type="monotone"
                                    dataKey={series.dataKey}
                                    name={series.name}
                                    stroke={series.stroke}
                                    strokeWidth={2.5}
                                    yAxisId={series.yAxisId}
                                    dot={false}
                                    activeDot={{
                                        r: 4,
                                        stroke: series.stroke,
                                        strokeWidth: 2,
                                        fill: '#fff',
                                    }}
                                />
                            ))}
                        </LineChart>
                    </ResponsiveContainer>
                )}
            </div>
        </ChartCard>
    );
}

function LatestPredictionCard({
    prediction,
}: {
    prediction: LatestPrediction | null;
}) {
    if (!prediction) {
        return (
            <ChartCard
                eyebrow="Latest Prediction"
                title="Awaiting first prediction"
                description="Predictions will appear here once enough sensor data has been processed."
            >
                <p className="py-8 text-center text-sm text-amber-700/60">
                    No predictions yet.
                </p>
            </ChartCard>
        );
    }

    const confidencePct = Math.round(prediction.confidence_score * 100);

    return (
        <ChartCard
            eyebrow="Latest Prediction"
            title="Most recent harvest readiness result"
            description="The newest model output paired with its confidence score."
        >
            <div className="space-y-5">
                <ReadinessBadge
                    level={prediction.readiness_level}
                    appearance="solid"
                    className="self-start"
                />

                <ConfidenceBar
                    value={Math.min(prediction.confidence_score * 100, 99.9)}
                    label="Model confidence"
                    formatter={() => `${confidencePct}%`}
                    barClassName={
                        READINESS_BAR_STYLES[prediction.readiness_level] ??
                        'bg-amber-400'
                    }
                />

                <div className="grid grid-cols-2 gap-4 text-center">
                    <div>
                        <p className="text-[10px] font-bold tracking-wider text-amber-900/40 uppercase">
                            HRI Value
                        </p>
                        <p className="text-xl font-bold text-amber-900">
                            {Math.round(prediction.hri_value * 100)}%
                        </p>
                    </div>
                    <div>
                        <p className="text-[10px] font-bold tracking-wider text-amber-900/40 uppercase">
                            Timestamp
                        </p>
                        <p className="text-sm font-semibold text-amber-900">
                            {prediction.prediction_timestamp}
                        </p>
                    </div>
                </div>
            </div>
        </ChartCard>
    );
}

function HarvestBar({ data }: { data: HarvestRecord[] }) {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setMounted(true);
    }, []);

    if (data.length === 0) {
        return (
            <ChartCard
                eyebrow="Harvest History"
                title="Weight records"
                description="Recent harvest outcomes will appear here once a harvest has been logged."
            >
                <p className="py-10 text-center text-sm text-amber-700/60">
                    No harvest records yet.
                </p>
            </ChartCard>
        );
    }

    return (
        <ChartCard
            eyebrow="Harvest History"
            title="Weight trend"
            description="Recorded harvest weights across previous visits."
        >
            <div className="w-full">
                {mounted && (
                    <ResponsiveContainer width="100%" height={200}>
                        <BarChart
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
                                dataKey="date"
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
                            <Bar
                                dataKey="weight"
                                name="Weight (kg)"
                                fill="#F59E0B"
                                radius={[6, 6, 0, 0]}
                            />
                        </BarChart>
                    </ResponsiveContainer>
                )}
            </div>
        </ChartCard>
    );
}

export default function Analytics({
    hive,
    hriTrend,
    sensorReadings,
    latestPrediction,
    harvestHistory,
}: Props) {
    const todayString = () => new Date().toISOString().slice(0, 10);
    const [sensorDate, setSensorDate] = useState(todayString);

    function handleSensorDateChange(date: string | null) {
        const resolved = date ?? todayString();
        setSensorDate(resolved);
        router.get(
            route('analytics.show', { hive: hive.id }),
            { sensor_date: resolved },
            {
                preserveState: true,
                preserveScroll: true,
                only: ['sensorReadings'],
            },
        );
    }

    return (
        <AuthenticatedLayout>
            <Head title={`Analytics — ${hive.name}`} />
            <div className="mx-auto max-w-7xl space-y-8 p-6 md:p-10 lg:px-10 lg:py-8">
                <div className="flex flex-col gap-2">
                    <Breadcrumbs
                        items={[
                            { label: 'Home', href: '/' },
                            { label: 'My Hives', href: '/dashboard' },
                            { label: hive.name, href: '/dashboard' },
                            { label: 'Analytics' },
                        ]}
                    />
                    <div className="flex items-center gap-3">
                        <Link
                            href="/dashboard"
                            className="flex h-9 w-9 items-center justify-center rounded-full bg-amber-100 text-amber-900 transition-colors hover:bg-amber-200"
                        >
                            <ArrowLeft className="h-4 w-4" />
                        </Link>
                        <div>
                            <h1 className="text-2xl font-black text-amber-900">
                                Analytics
                            </h1>
                            <p className="mt-1 text-sm text-amber-700">
                                {hive.name} — Harvest Readiness Intelligence
                            </p>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 items-stretch gap-6 lg:grid-cols-3">
                    <div className="h-full lg:col-span-1">
                        <HriScoreCard hive={hive} />
                    </div>
                    <div className="h-full lg:col-span-2">
                        <HriTrendChart data={hriTrend} />
                    </div>
                </div>

                <SensorChart
                    data={sensorReadings}
                    selectedDate={sensorDate}
                    onDateChange={handleSensorDateChange}
                />

                <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                    <LatestPredictionCard prediction={latestPrediction} />
                    <HarvestBar data={harvestHistory} />
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
