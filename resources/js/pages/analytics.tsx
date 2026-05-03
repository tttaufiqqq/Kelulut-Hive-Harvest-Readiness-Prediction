import { Head, Link } from '@inertiajs/react';
import { useState, useEffect } from 'react';
import { ArrowLeft } from 'lucide-react';
import {
    ResponsiveContainer,
    AreaChart, Area,
    BarChart, Bar,
    LineChart, Line,
    XAxis, YAxis, CartesianGrid, Tooltip, Legend,
} from 'recharts';
import { Card } from '@/components/core/card';
import { Breadcrumbs } from '@/components/core/navigation';
import { SelectField } from '@/components/core/select-field';
import { AuthenticatedLayout } from '@/layouts/authenticated-layout';

// ─── Types ───────────────────────────────────────────────────────────────────

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

// ─── Readiness maps ───────────────────────────────────────────────────────────

const READINESS_LABELS: Record<string, string> = {
    not_ready:    'Not Ready',
    approaching:  'Approaching',
    nearly_ready: 'Nearly Ready',
    ready:        'Ready to Harvest',
};

const READINESS_COLORS: Record<string, string> = {
    not_ready:    '#dc2626',
    approaching:  '#d97706',
    nearly_ready: '#ca8a04',
    ready:        '#16a34a',
};

const TOOLTIP_STYLE = {
    backgroundColor: '#FFFBEB',
    border: '1px solid #FEF3C7',
    borderRadius: '12px',
    fontSize: '12px',
    fontWeight: 'bold',
    color: '#78350F',
};

// ─── Sub-components ───────────────────────────────────────────────────────────

function HriScoreCard({ hive }: { hive: HiveData }) {
    const level = hive.latest_readiness_level ?? 'not_ready';
    const color = READINESS_COLORS[level] ?? '#d97706';
    const label = READINESS_LABELS[level] ?? level;

    return (
        <Card className="h-full flex flex-col items-center justify-center py-8 gap-2">
            <p className="text-[10px] font-black uppercase tracking-widest text-amber-900/50">HRI Score</p>
            <p className="text-7xl font-black tracking-tighter" style={{ color }}>
                {hive.avg_hri_pct}%
            </p>
            <span
                className="px-4 py-1 rounded-full text-sm font-bold text-white"
                style={{ backgroundColor: color }}
            >
                {label}
            </span>
            <div className="mt-4 text-center">
                <p className="text-[10px] font-bold uppercase tracking-wider text-amber-900/40">7-day avg</p>
                <p className="text-xl font-bold text-amber-900">{hive.avg_hri_7d_pct}%</p>
            </div>
        </Card>
    );
}

function HriTrendChart({ data }: { data: HriTrend[] }) {
    const [mounted, setMounted] = useState(false);
    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setMounted(true);
    }, []);

    return (
        <Card className="h-full flex flex-col">
            <p className="font-bold text-amber-900 mb-4">HRI Score — 30 Day Trend</p>
            <div className="flex-1 min-h-[220px]">
                {mounted && <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={data}>
                        <defs>
                            <linearGradient id="hriGrad" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%"  stopColor="#F59E0B" stopOpacity={0.3} />
                                <stop offset="95%" stopColor="#F59E0B" stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#FEF3C7" />
                        <XAxis dataKey="date" axisLine={false} tickLine={false}
                            tick={{ fill: '#78350F', fontSize: 10, fontWeight: 600 }} dy={8} />
                        <YAxis domain={[0, 100]} axisLine={false} tickLine={false}
                            tickFormatter={(v) => `${v}%`}
                            tick={{ fill: '#78350F', fontSize: 10, fontWeight: 600 }} />
                        <Tooltip contentStyle={TOOLTIP_STYLE} />
                        <Legend wrapperStyle={{ fontSize: 11 }} />
                        <Area type="monotone" dataKey="hri_score" name="HRI Score"
                            stroke="#F59E0B" strokeWidth={3} fill="url(#hriGrad)" />
                        <Line type="monotone" dataKey="avg_7d" name="7d Avg"
                            stroke="#92400E" strokeWidth={1.5} strokeDasharray="4 2" dot={false} />
                    </AreaChart>
                </ResponsiveContainer>}
            </div>
        </Card>
    );
}

const SENSOR_GROUP_OPTIONS = [
    { value: 'all',         label: 'All Sensors' },
    { value: 'environment', label: 'Environmental (Temp + Humidity)' },
    { value: 'gas',         label: 'Gas Sensors (MQ2 – MQ135)' },
];

function SensorChart({ data }: { data: SensorReading[] }) {
    const [mounted, setMounted] = useState(false);
    const [group, setGroup] = useState('all');

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setMounted(true);
    }, []);

    const showEnv = group === 'all' || group === 'environment';
    const showGas = group === 'all' || group === 'gas';

    return (
        <Card className="flex flex-col">
            <div className="flex items-center justify-between mb-4">
                <p className="font-bold text-amber-900">Sensor Readings — Today</p>
                <div className="w-64">
                    <SelectField
                        value={group}
                        onChange={setGroup}
                        options={SENSOR_GROUP_OPTIONS}
                    />
                </div>
            </div>
            <div className="flex-1 min-h-[250px]">
                {mounted && <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={data}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#FEF3C7" />
                        <XAxis dataKey="time" axisLine={false} tickLine={false}
                            tick={{ fill: '#78350F', fontSize: 10, fontWeight: 600 }} dy={8} />
                        <YAxis axisLine={false} tickLine={false}
                            tick={{ fill: '#78350F', fontSize: 10, fontWeight: 600 }} />
                        <Tooltip contentStyle={TOOLTIP_STYLE} />
                        <Legend wrapperStyle={{ fontSize: 11 }} />
                        {showEnv && <Line type="monotone" dataKey="temp"     name="Temp (°C)"    stroke="#ef4444" strokeWidth={2} dot={false} />}
                        {showEnv && <Line type="monotone" dataKey="humidity" name="Humidity (%)" stroke="#3b82f6" strokeWidth={2} dot={false} />}
                        {showGas && <Line type="monotone" dataKey="mq2"      name="MQ2 ADC"      stroke="#8b5cf6" strokeWidth={2} dot={false} />}
                        {showGas && <Line type="monotone" dataKey="mq3"      name="MQ3 ADC"      stroke="#f97316" strokeWidth={2} dot={false} />}
                        {showGas && <Line type="monotone" dataKey="mq5"      name="MQ5 ADC"      stroke="#10b981" strokeWidth={2} dot={false} />}
                        {showGas && <Line type="monotone" dataKey="mq135"    name="MQ135 ADC"    stroke="#f59e0b" strokeWidth={2} dot={false} />}
                    </LineChart>
                </ResponsiveContainer>}
            </div>
        </Card>
    );
}

function LatestPredictionCard({ prediction }: { prediction: LatestPrediction | null }) {
    if (!prediction) {
        return (
            <Card className="flex flex-col items-center justify-center py-8 gap-2">
                <p className="font-bold text-amber-900 mb-2">Latest Prediction</p>
                <p className="text-amber-700/60 text-sm">No predictions yet</p>
            </Card>
        );
    }

    const color = READINESS_COLORS[prediction.readiness_level] ?? '#d97706';
    const label = READINESS_LABELS[prediction.readiness_level] ?? prediction.readiness_level;
    const confidencePct = Math.round(prediction.confidence_score * 100);

    return (
        <Card className="flex flex-col gap-4 py-6">
            <p className="font-bold text-amber-900">Latest Prediction</p>
            <span
                className="self-start px-4 py-1 rounded-full text-sm font-bold text-white"
                style={{ backgroundColor: color }}
            >
                {label}
            </span>
            <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-amber-900/40 mb-1">
                    Confidence — {confidencePct}%
                </p>
                <div className="w-full h-3 bg-amber-100 rounded-full overflow-hidden">
                    <div
                        className="h-full rounded-full"
                        style={{ width: `${confidencePct}%`, backgroundColor: color }}
                    />
                </div>
            </div>
            <div className="grid grid-cols-2 gap-4 text-center">
                <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-amber-900/40">HRI Value</p>
                    <p className="text-xl font-bold text-amber-900">{Math.round(prediction.hri_value * 100)}%</p>
                </div>
                <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-amber-900/40">Timestamp</p>
                    <p className="text-sm font-semibold text-amber-900">{prediction.prediction_timestamp}</p>
                </div>
            </div>
        </Card>
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
            <Card className="flex items-center justify-center py-10">
                <p className="text-amber-700/60 text-sm">No harvest records yet</p>
            </Card>
        );
    }

    return (
        <Card>
            <p className="font-bold text-amber-900 mb-4">Harvest History — Weight (kg)</p>
            <div className="h-[200px]">
                {mounted && <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#FEF3C7" />
                        <XAxis dataKey="date" axisLine={false} tickLine={false}
                            tick={{ fill: '#78350F', fontSize: 10, fontWeight: 600 }} dy={8} />
                        <YAxis axisLine={false} tickLine={false}
                            tick={{ fill: '#78350F', fontSize: 10, fontWeight: 600 }} />
                        <Tooltip contentStyle={TOOLTIP_STYLE} />
                        <Bar dataKey="weight" name="Weight (kg)" fill="#F59E0B" radius={[6, 6, 0, 0]} />
                    </BarChart>
                </ResponsiveContainer>}
            </div>
        </Card>
    );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function Analytics({ hive, hriTrend, sensorReadings, latestPrediction, harvestHistory }: Props) {
    return (
        <AuthenticatedLayout>
            <Head title={`Analytics — ${hive.name}`} />
            <div className="p-6 md:p-10 max-w-6xl mx-auto space-y-8">

                <div className="flex flex-col gap-2">
                    <Breadcrumbs items={[
                        { label: 'Home', href: '/' },
                        { label: 'My Hives', href: '/dashboard' },
                        { label: hive.name, href: '/dashboard' },
                        { label: 'Analytics' },
                    ]} />
                    <div className="flex items-center gap-3">
                        <Link
                            href="/dashboard"
                            className="flex items-center justify-center w-9 h-9 rounded-full bg-amber-100 hover:bg-amber-200 text-amber-900 transition-colors"
                        >
                            <ArrowLeft className="w-4 h-4" />
                        </Link>
                        <div>
                            <h1 className="text-2xl font-black text-amber-900">Analytics</h1>
                            <p className="text-amber-700 text-sm mt-1">{hive.name} — Harvest Readiness Intelligence</p>
                        </div>
                    </div>
                </div>

                {/* Top row: score card + HRI trend */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
                    <div className="lg:col-span-1 h-full">
                        <HriScoreCard hive={hive} />
                    </div>
                    <div className="lg:col-span-2 h-full">
                        <HriTrendChart data={hriTrend} />
                    </div>
                </div>

                {/* Sensor readings — full width */}
                <SensorChart data={sensorReadings} />

                {/* Prediction + harvest */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <LatestPredictionCard prediction={latestPrediction} />
                    <HarvestBar data={harvestHistory} />
                </div>

            </div>
        </AuthenticatedLayout>
    );
}
