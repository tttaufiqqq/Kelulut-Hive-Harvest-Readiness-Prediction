import { Head } from '@inertiajs/react';
import { useEffect, useState } from 'react';
import {
    Area,
    AreaChart,
    CartesianGrid,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from 'recharts';
import { BeekeeperTabs } from '@/components/core/beekeeper-tabs';
import { Card } from '@/components/core/card';
import { Breadcrumbs } from '@/components/core/navigation';
import {
    ChartCard,
    ConfidenceBar,
    ReadinessBadge,
} from '@/components/core/readiness-chart-cards';
import { SelectField } from '@/components/core/select-field';
import { AuthenticatedLayout } from '@/layouts/authenticated-layout';

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

const READINESS_BAR_STYLES: Record<string, string> = {
    not_ready: 'bg-rose-400',
    approaching: 'bg-amber-400',
    nearly_ready: 'bg-yellow-400',
    ready: 'bg-emerald-400',
};

function HriGaugeCard({ gauge }: { gauge: HriGauge }) {
    return (
        <Card className="flex h-full flex-col gap-5 border border-amber-100/80 bg-white/95">
            <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                    <p className="font-bold text-amber-950">{gauge.hive_name}</p>
                    <p className="mt-0.5 text-xs text-amber-900/50">
                        {gauge.site_name ?? 'No site assigned'}
                    </p>
                </div>
                <ReadinessBadge level={gauge.readiness_level} size="sm" />
            </div>

            <div className="space-y-1">
                <p className="text-xs font-bold tracking-widest text-amber-900/40 uppercase">
                    Current HRI
                </p>
                <p className="text-4xl font-black tracking-tight text-amber-950">
                    {gauge.hri_value !== null ? gauge.hri_value.toFixed(2) : '—'}
                </p>
            </div>

            <ConfidenceBar
                value={gauge.confidence_pct}
                label="Confidence"
                emptyLabel="—"
                barClassName={
                    READINESS_BAR_STYLES[gauge.readiness_level ?? ''] ??
                    'bg-amber-400'
                }
            />
        </Card>
    );
}

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
            {gauges.map((gauge) => (
                <HriGaugeCard key={gauge.hive_id} gauge={gauge} />
            ))}
        </div>
    );
}

function ReadinessTrendChart({ trends }: { trends: ReadinessTrend[] }) {
    const hiveNames = [...new Set(trends.map((trend) => trend.hive_name))];
    const hiveOptions = hiveNames.map((name) => ({
        value: name,
        label: name,
    }));
    const [selectedHive, setSelectedHive] = useState(hiveNames[0] ?? '');
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setMounted(true);
    }, []);

    const filtered = trends.filter((trend) => trend.hive_name === selectedHive);

    if (trends.length === 0) {
        return (
            <ChartCard
                eyebrow="Readiness Trend"
                title="30-day HRI movement"
                description="Trend data will appear once recent readiness history is available."
            >
                <p className="py-6 text-center text-sm text-amber-900/40">
                    No HRI history in the last 30 days.
                </p>
            </ChartCard>
        );
    }

    return (
        <Card className="h-full">
            <div className="mb-4">
                <p className="text-[11px] font-black tracking-[0.22em] text-amber-900/45 uppercase">
                    Readiness Trend
                </p>
                <div className="mt-1 flex flex-col gap-3 md:grid md:grid-cols-[minmax(0,1fr)_220px] md:items-start md:gap-x-4 md:gap-y-0">
                    <p className="order-1 text-lg leading-tight font-black text-amber-950 sm:text-base">
                        30-day HRI movement
                    </p>
                    <p className="order-2 max-w-xl text-sm leading-7 text-amber-700 md:order-3 md:-mt-1 md:leading-6">
                        Review how each hive&apos;s average readiness has shifted
                        over time.
                    </p>
                    {hiveNames.length > 1 ? (
                        <div className="order-3 w-full md:order-2 md:w-[220px] md:flex-shrink-0">
                            <SelectField
                                value={selectedHive}
                                onChange={setSelectedHive}
                                options={hiveOptions}
                            />
                        </div>
                    ) : null}
                </div>
            </div>

            {mounted && (
                <ResponsiveContainer width="100%" height={220}>
                    <AreaChart
                        data={filtered}
                        margin={{ left: 0, right: 16, top: 4, bottom: 4 }}
                    >
                        <defs>
                            <linearGradient
                                id="reportingHriGradient"
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
                            stroke="#fef3c7"
                        />
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
                            fill="url(#reportingHriGradient)"
                            dot={false}
                        />
                    </AreaChart>
                </ResponsiveContainer>
            )}
        </Card>
    );
}

export default function Reporting({ hriGauges, readinessTrends }: Props) {
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

                <div>
                    <h2 className="mb-3 text-sm font-black tracking-widest text-amber-900/60 uppercase">
                        HRI Gauge
                    </h2>
                    <HriGaugeGrid gauges={hriGauges} />
                </div>

                <ReadinessTrendChart trends={readinessTrends} />
            </div>
        </AuthenticatedLayout>
    );
}
