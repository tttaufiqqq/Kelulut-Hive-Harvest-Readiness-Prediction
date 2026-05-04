import { Head } from '@inertiajs/react';
import { useState, useEffect } from 'react';
import {
    ResponsiveContainer,
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
} from 'recharts';
import { BeekeeperTabs } from '@/components/core/beekeeper-tabs';
import { Card } from '@/components/core/card';
import { Breadcrumbs } from '@/components/core/navigation';
import { SelectField } from '@/components/core/select-field';
import { AuthenticatedLayout } from '@/layouts/authenticated-layout';

// ── Types ─────────────────────────────────────────────────────────────
interface HriGauge {
    hive_id: number;
    hive_name: string;
    site_name: string | null;
    readiness_level: string | null;
    hri_value: number | null;
    confidence_pct: number | null;
}

interface ReadinessTrend {
    hive_id: number;
    hive_name: string;
    date: string;
    avg_hri_pct: number;
}

interface Props {
    hriGauges: HriGauge[];
    readinessTrends: ReadinessTrend[];
}

// ── Readiness level display maps ───────────────────────────────────────
const READINESS_LABEL: Record<string, string> = {
    not_ready: 'Not Ready',
    approaching: 'Approaching',
    nearly_ready: 'Nearly Ready',
    ready: 'Ready to Harvest',
};

const BADGE_CLASS: Record<string, string> = {
    not_ready: 'bg-red-100 text-red-800',
    approaching: 'bg-yellow-100 text-yellow-800',
    nearly_ready: 'bg-amber-100 text-amber-800',
    ready: 'bg-green-100 text-green-800',
};

// ── HriGaugeCard ──────────────────────────────────────────────────────
function HriGaugeCard({ gauge }: { gauge: HriGauge }) {
    const badge = gauge.readiness_level
        ? (BADGE_CLASS[gauge.readiness_level] ?? 'bg-gray-100 text-gray-500')
        : 'bg-gray-100 text-gray-500';
    const label = gauge.readiness_level
        ? (READINESS_LABEL[gauge.readiness_level] ?? gauge.readiness_level)
        : 'No Data';
    const pct = gauge.confidence_pct ?? 0;

    return (
        <Card>
            <div className="mb-3 flex items-start justify-between">
                <div>
                    <p className="font-bold text-amber-950">
                        {gauge.hive_name}
                    </p>
                    {gauge.site_name && (
                        <p className="mt-0.5 text-xs text-amber-900/50">
                            {gauge.site_name}
                        </p>
                    )}
                </div>
                <span
                    className={`rounded-lg px-2 py-1 text-xs font-bold ${badge}`}
                >
                    {label}
                </span>
            </div>

            <div className="mt-4">
                <div className="mb-1.5 flex justify-between">
                    <p className="text-xs font-bold tracking-widest text-amber-900/40 uppercase">
                        Confidence
                    </p>
                    <span className="text-xs font-bold text-amber-900">
                        {gauge.confidence_pct !== null ? `${pct}%` : '—'}
                    </span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-yellow-100">
                    <div
                        className="h-full rounded-full bg-amber-400 transition-all duration-300"
                        style={{ width: `${pct}%` }}
                    />
                </div>
            </div>

            {gauge.hri_value !== null && (
                <p className="mt-3 text-xs text-amber-900/50">
                    HRI:{' '}
                    <span className="font-bold text-amber-900">
                        {gauge.hri_value.toFixed(2)}
                    </span>
                </p>
            )}
        </Card>
    );
}

// ── HriGaugeGrid ──────────────────────────────────────────────────────
function HriGaugeGrid({ gauges }: { gauges: HriGauge[] }) {
    if (gauges.length === 0) {
        return (
            <Card>
                <p className="py-6 text-center text-sm text-amber-900/40">
                    No hives registered yet.
                </p>
            </Card>
        );
    }

    return (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {gauges.map((g) => (
                <HriGaugeCard key={g.hive_id} gauge={g} />
            ))}
        </div>
    );
}

// ── ReadinessTrendChart ────────────────────────────────────────────────
function ReadinessTrendChart({ trends }: { trends: ReadinessTrend[] }) {
    const hiveNames = [...new Set(trends.map((t) => t.hive_name))];
    const hiveOptions = hiveNames.map((n) => ({ value: n, label: n }));
    const [selectedHive, setSelectedHive] = useState(hiveNames[0] ?? '');

    const filtered = trends.filter((t) => t.hive_name === selectedHive);

    if (trends.length === 0) {
        return (
            <Card>
                <p className="py-6 text-center text-sm text-amber-900/40">
                    No HRI history in the last 30 days.
                </p>
            </Card>
        );
    }

    return (
        <Card>
            <div className="mb-4 flex items-center justify-between">
                <h3 className="text-sm font-black tracking-widest text-amber-900/60 uppercase">
                    Readiness Trend (30 days)
                </h3>
                {hiveNames.length > 1 && (
                    <SelectField
                        value={selectedHive}
                        onChange={setSelectedHive}
                        options={hiveOptions}
                    />
                )}
            </div>
            <ResponsiveContainer width="100%" height={200}>
                <AreaChart
                    data={filtered}
                    margin={{ left: 0, right: 16, top: 4, bottom: 4 }}
                >
                    <defs>
                        <linearGradient
                            id="hriGrad"
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
                    <CartesianGrid strokeDasharray="3 3" stroke="#fef3c7" />
                    <XAxis
                        dataKey="date"
                        tick={{ fontSize: 10, fill: '#92400e' }}
                        axisLine={false}
                        tickLine={false}
                    />
                    <YAxis
                        unit="%"
                        domain={[0, 100]}
                        tick={{ fontSize: 10, fill: '#92400e' }}
                        axisLine={false}
                        tickLine={false}
                    />
                    <Tooltip
                        contentStyle={{
                            borderRadius: 12,
                            border: '1px solid #fef3c7',
                            fontSize: 12,
                        }}
                        formatter={(value) => {
                            const displayValue =
                                typeof value === 'number'
                                    ? value
                                    : Number(value ?? 0);

                            return [`${displayValue}%`, 'Avg HRI'];
                        }}
                    />
                    <Area
                        type="monotone"
                        dataKey="avg_hri_pct"
                        stroke="#F59E0B"
                        strokeWidth={2}
                        fill="url(#hriGrad)"
                        dot={false}
                    />
                </AreaChart>
            </ResponsiveContainer>
        </Card>
    );
}

// ── Reporting ─────────────────────────────────────────────────────────
export default function Reporting({ hriGauges, readinessTrends }: Props) {
    const [mounted, setMounted] = useState(false);
    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setMounted(true);
    }, []);

    return (
        <AuthenticatedLayout>
            <Head title="Reporting — BuzzyHive 2.0" />

            <div className="mx-auto max-w-6xl space-y-6 px-6 py-8">
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <Breadcrumbs
                        items={[
                            { label: 'Home', href: '/' },
                            { label: 'Reporting' },
                        ]}
                    />
                    <BeekeeperTabs active="reporting" />
                </div>
                <div>
                    <h1 className="text-2xl font-black text-amber-950">
                        Reporting
                    </h1>
                    <p className="mt-1 text-sm text-amber-900/50">
                        Harvest readiness overview for your hives.
                    </p>
                </div>

                {/* P6.1 HRI Gauge Grid */}
                <div>
                    <h2 className="mb-3 text-sm font-black tracking-widest text-amber-900/60 uppercase">
                        HRI Gauge
                    </h2>
                    <HriGaugeGrid gauges={hriGauges} />
                </div>

                {/* P6.2 Readiness Trends */}
                {mounted && (
                    <div>
                        <ReadinessTrendChart trends={readinessTrends} />
                    </div>
                )}
            </div>
        </AuthenticatedLayout>
    );
}
