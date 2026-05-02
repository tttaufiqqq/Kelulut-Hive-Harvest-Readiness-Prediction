import { Head } from '@inertiajs/react';
import {
    ResponsiveContainer,
    AreaChart, Area,
    BarChart, Bar,
    RadarChart, Radar, PolarGrid, PolarAngleAxis,
    LineChart, Line,
    XAxis, YAxis, CartesianGrid, Tooltip, Legend,
} from 'recharts';
import { Card } from '@/components/core/card';
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

function HriScoreCard({ hive }: { hive: HiveSummary }) {
    const color = CATEGORY_COLORS[hive.latest_category] ?? '#d97706';

    return (
        <Card className="flex flex-col items-center justify-center py-8 gap-2">
            <p className="text-[10px] font-black uppercase tracking-widest text-amber-900/50">HRI Score</p>
            <p className="text-7xl font-black tracking-tighter" style={{ color }}>
                {hive.latest_hri_score}
            </p>
            <span
                className="px-4 py-1 rounded-full text-sm font-bold text-white"
                style={{ backgroundColor: color }}
            >
                {hive.latest_category}
            </span>
            <div className="grid grid-cols-2 gap-6 mt-4 text-center">
                <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-amber-900/40">7-day avg</p>
                    <p className="text-xl font-bold text-amber-900">{hive.avg_hri_7d}</p>
                </div>
                <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-amber-900/40">30-day avg</p>
                    <p className="text-xl font-bold text-amber-900">{hive.avg_hri_30d}</p>
                </div>
            </div>
        </Card>
    );
}

function HriTrendChart({ data }: { data: HriTrend[] }) {
    return (
        <Card>
            <p className="font-bold text-amber-900 mb-4">HRI Score — 30 Day Trend</p>
            <div className="h-[220px]">
                <ResponsiveContainer width="100%" height="100%">
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
                            tick={{ fill: '#78350F', fontSize: 10, fontWeight: 600 }} />
                        <Tooltip contentStyle={TOOLTIP_STYLE} />
                        <Legend wrapperStyle={{ fontSize: 11 }} />
                        <Area type="monotone" dataKey="hri_score" name="HRI Score"
                            stroke="#F59E0B" strokeWidth={3} fill="url(#hriGrad)" />
                        <Line type="monotone" dataKey="avg_7d" name="7d Avg"
                            stroke="#92400E" strokeWidth={1.5} strokeDasharray="4 2" dot={false} />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        </Card>
    );
}

function SensorChart({ data }: { data: SensorReading[] }) {
    return (
        <Card>
            <p className="font-bold text-amber-900 mb-4">Sensor Readings — Today</p>
            <div className="h-[220px]">
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={data}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#FEF3C7" />
                        <XAxis dataKey="time" axisLine={false} tickLine={false}
                            tick={{ fill: '#78350F', fontSize: 10, fontWeight: 600 }} dy={8} />
                        <YAxis axisLine={false} tickLine={false}
                            tick={{ fill: '#78350F', fontSize: 10, fontWeight: 600 }} />
                        <Tooltip contentStyle={TOOLTIP_STYLE} />
                        <Legend wrapperStyle={{ fontSize: 11 }} />
                        <Line type="monotone" dataKey="temp"     name="Temp (°C)"    stroke="#ef4444" strokeWidth={2} dot={false} />
                        <Line type="monotone" dataKey="humidity" name="Humidity (%)"  stroke="#3b82f6" strokeWidth={2} dot={false} />
                        <Line type="monotone" dataKey="co2"      name="CO₂ (ADC)"    stroke="#8b5cf6" strokeWidth={2} dot={false} />
                        <Line type="monotone" dataKey="etoh"     name="EtOH (ADC)"   stroke="#f97316" strokeWidth={2} dot={false} />
                    </LineChart>
                </ResponsiveContainer>
            </div>
        </Card>
    );
}

function ScoreRadar({ data }: { data: ScoreComponents[] }) {
    return (
        <Card>
            <p className="font-bold text-amber-900 mb-4">HRI Component Scores</p>
            <div className="h-[220px]">
                <ResponsiveContainer width="100%" height="100%">
                    <RadarChart data={data}>
                        <PolarGrid stroke="#FEF3C7" />
                        <PolarAngleAxis dataKey="sensor"
                            tick={{ fill: '#78350F', fontSize: 11, fontWeight: 600 }} />
                        <Radar name="Score" dataKey="score" stroke="#F59E0B"
                            fill="#FACC15" fillOpacity={0.4} strokeWidth={2} />
                        <Tooltip contentStyle={TOOLTIP_STYLE} />
                    </RadarChart>
                </ResponsiveContainer>
            </div>
        </Card>
    );
}

function HarvestBar({ data }: { data: Props['harvestHistory'] }) {
    return (
        <Card>
            <p className="font-bold text-amber-900 mb-4">Harvest History — Volume (ml)</p>
            <div className="h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#FEF3C7" />
                        <XAxis dataKey="date" axisLine={false} tickLine={false}
                            tick={{ fill: '#78350F', fontSize: 10, fontWeight: 600 }} dy={8} />
                        <YAxis axisLine={false} tickLine={false}
                            tick={{ fill: '#78350F', fontSize: 10, fontWeight: 600 }} />
                        <Tooltip contentStyle={TOOLTIP_STYLE} />
                        <Bar dataKey="qty_ml" name="Volume (ml)" fill="#F59E0B" radius={[6, 6, 0, 0]} />
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </Card>
    );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function Analytics({ hive, hriTrend, sensorReadings, scoreComponents, harvestHistory }: Props) {
    return (
        <AuthenticatedLayout>
            <Head title={`Analytics — ${hive.name}`} />
            <div className="p-6 md:p-10 max-w-6xl mx-auto space-y-8">

                <div>
                    <h1 className="text-2xl font-black text-amber-900">Analytics</h1>
                    <p className="text-amber-700 text-sm mt-1">{hive.name} — Harvest Readiness Intelligence</p>
                </div>

                {/* Top row: score card + HRI trend */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-1">
                        <HriScoreCard hive={hive} />
                    </div>
                    <div className="lg:col-span-2">
                        <HriTrendChart data={hriTrend} />
                    </div>
                </div>

                {/* Middle row: sensor readings + radar */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <SensorChart data={sensorReadings} />
                    <ScoreRadar data={scoreComponents} />
                </div>

                {/* Bottom row: harvest history */}
                <HarvestBar data={harvestHistory} />

            </div>
        </AuthenticatedLayout>
    );
}
