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

const READINESS_BAR_STYLES: Record<string, string> = {
    not_ready: 'bg-rose-400',
    approaching: 'bg-amber-400',
    nearly_ready: 'bg-yellow-400',
    ready: 'bg-emerald-400',
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
            <div className="w-full">
                {mounted && (
                    <ResponsiveContainer width="100%" height={220}>
                        <AreaChart data={data}>
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
                                    fontSize: 10,
                                    fontWeight: 600,
                                }}
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

    return (
        <ChartCard
            eyebrow="Sensor Readings"
            title="Daily sensor curves"
            description="Filter the selected date into environment or gas sensor groups."
            actions={
                <div className="flex w-full items-center gap-2 sm:w-auto sm:flex-nowrap sm:justify-end">
                    <DatePicker
                        className="w-[124px] shrink-0"
                        value={selectedDate}
                        onChange={onDateChange}
                        defaultValue={todayYMD}
                    />
                    <div className="min-w-0 flex-1 sm:w-[190px] sm:flex-none">
                        <SelectField
                            value={group}
                            onChange={setGroup}
                            options={SENSOR_GROUP_OPTIONS}
                        />
                    </div>
                </div>
            }
        >
            <div className="w-full">
                {mounted && (
                    <ResponsiveContainer width="100%" height={250}>
                        <LineChart data={data}>
                            <CartesianGrid
                                strokeDasharray="3 3"
                                vertical={false}
                                stroke="#FEF3C7"
                            />
                            <XAxis
                                dataKey="time"
                                axisLine={false}
                                tickLine={false}
                                tick={{
                                    fill: '#78350F',
                                    fontSize: 10,
                                    fontWeight: 600,
                                }}
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
                            {showEnvironment && (
                                <Line
                                    type="monotone"
                                    dataKey="temp"
                                    name="Temp (°C)"
                                    stroke="#ef4444"
                                    strokeWidth={2}
                                    dot={false}
                                />
                            )}
                            {showEnvironment && (
                                <Line
                                    type="monotone"
                                    dataKey="humidity"
                                    name="Humidity (%)"
                                    stroke="#3b82f6"
                                    strokeWidth={2}
                                    dot={false}
                                />
                            )}
                            {showGas && (
                                <Line
                                    type="monotone"
                                    dataKey="mq2"
                                    name="MQ2 ADC"
                                    stroke="#8b5cf6"
                                    strokeWidth={2}
                                    dot={false}
                                />
                            )}
                            {showGas && (
                                <Line
                                    type="monotone"
                                    dataKey="mq3"
                                    name="MQ3 ADC"
                                    stroke="#f97316"
                                    strokeWidth={2}
                                    dot={false}
                                />
                            )}
                            {showGas && (
                                <Line
                                    type="monotone"
                                    dataKey="mq5"
                                    name="MQ5 ADC"
                                    stroke="#10b981"
                                    strokeWidth={2}
                                    dot={false}
                                />
                            )}
                            {showGas && (
                                <Line
                                    type="monotone"
                                    dataKey="mq135"
                                    name="MQ135 ADC"
                                    stroke="#f59e0b"
                                    strokeWidth={2}
                                    dot={false}
                                />
                            )}
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
                        <BarChart data={data}>
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
                                    fontSize: 10,
                                    fontWeight: 600,
                                }}
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
            <div className="mx-auto max-w-6xl space-y-8 p-6 md:p-10">
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
