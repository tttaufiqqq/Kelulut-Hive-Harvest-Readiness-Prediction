import { Head } from '@inertiajs/react';
import { useEffect, useState } from 'react';
import {
    Area,
    AreaChart,
    CartesianGrid,
    Legend,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from 'recharts';
import { BeekeeperTabs } from '@/components/core/beekeeper-tabs';
import { Card } from '@/components/core/card';
import { DatePickerField } from '@/components/core/date-picker';
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
    summary_date: string;
    date: string;
    avg_hri_pct: number;
}

interface Props {
    hriGauges: HriGauge[];
    readinessTrends: ReadinessTrend[];
}

const ALL_HIVES = 'all';

const TOOLTIP_STYLE = {
    backgroundColor: '#FFFBEB',
    border: '1px solid #FEF3C7',
    borderRadius: '12px',
    fontSize: '12px',
    fontWeight: 'bold',
    color: '#78350F',
};

const READINESS_BAR_STYLES: Record<string, string> = {
    not_ready: 'bg-rose-400',
    approaching: 'bg-amber-400',
    nearly_ready: 'bg-yellow-400',
    ready: 'bg-emerald-400',
};

function toMonthValue(summaryDate: string) {
    return summaryDate.slice(0, 7);
}

function HriGaugeCard({ gauge }: { gauge: HriGauge }) {
    return (
        <Card className="flex h-full flex-col gap-5 border border-amber-100/80 bg-white/95">
            <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                    <p className="text-lg font-bold text-amber-900">
                        {gauge.hive_name}
                    </p>
                    <p className="mt-1 text-sm text-amber-900/50">
                        {gauge.site_name ?? 'No site assigned'}
                    </p>
                </div>
                <ReadinessBadge level={gauge.readiness_level} size="sm" />
            </div>

            <div className="space-y-1">
                <p className="text-xs font-bold tracking-widest text-amber-900/40 uppercase">
                    Current HRI
                </p>
                <p className="text-5xl font-black tracking-tight text-amber-900">
                    {gauge.hri_value !== null
                        ? gauge.hri_value.toFixed(2)
                        : '—'}
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
    const availableMonthValues = [
        ...new Set(trends.map((trend) => toMonthValue(trend.summary_date))),
    ].sort();
    const latestMonthValue =
        availableMonthValues[availableMonthValues.length - 1] ?? null;
    const hiveOptions = [
        { value: ALL_HIVES, label: 'All Hives' },
        ...hiveNames.map((name) => ({
            value: name,
            label: name,
        })),
    ];
    const [selectedHive, setSelectedHive] = useState(ALL_HIVES);
    const [selectedMonth, setSelectedMonth] = useState<string | null>(
        latestMonthValue,
    );
    const activeMonth =
        selectedMonth && availableMonthValues.includes(selectedMonth)
            ? selectedMonth
            : latestMonthValue;
    const activeHive =
        selectedHive === ALL_HIVES || hiveNames.includes(selectedHive)
            ? selectedHive
            : ALL_HIVES;
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setMounted(true);
    }, []);

    const filtered = trends.filter(
        (trend) =>
            (activeHive === ALL_HIVES || trend.hive_name === activeHive) &&
            (!activeMonth || toMonthValue(trend.summary_date) === activeMonth),
    );

    if (trends.length === 0) {
        return (
            <ChartCard
                eyebrow="Readiness Trend"
                title="Recent readiness movement"
                description="Trend data will appear once recent readiness history is available."
            >
                <p className="py-6 text-center text-sm text-amber-900/40">
                    No HRI history in the last 30 days.
                </p>
            </ChartCard>
        );
    }

    return (
        <ChartCard
            eyebrow="Readiness Trend"
            title="Recent readiness movement"
            description="Monitor how HRI is changing across the selected reporting window."
            actions={
                <div className="grid w-full grid-cols-1 gap-2 sm:flex sm:w-auto sm:flex-nowrap sm:justify-end">
                    <div className="w-full sm:w-[220px]">
                        <DatePickerField
                            value={activeMonth}
                            onChange={setSelectedMonth}
                            mode="month"
                            maxDate="today"
                            placeholder="Month"
                        />
                    </div>
                    <div className="w-full sm:w-[220px]">
                        <SelectField
                            value={activeHive}
                            onChange={setSelectedHive}
                            options={hiveOptions}
                        />
                    </div>
                </div>
            }
        >
            <div className="rounded-[1.75rem] border border-amber-100/70 bg-amber-50/35 p-3 sm:p-4">
                {mounted && filtered.length > 0 ? (
                    <ResponsiveContainer width="100%" height={220}>
                        <AreaChart
                            data={filtered}
                            margin={{ top: 8, right: 8, left: 8, bottom: 18 }}
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
                            <Tooltip
                                contentStyle={TOOLTIP_STYLE}
                                formatter={(value) => {
                                    const displayValue =
                                        typeof value === 'number'
                                            ? value
                                            : Number(value ?? 0);

                                    return [`${displayValue}%`, 'HRI'];
                                }}
                            />
                            <Legend
                                iconType="circle"
                                wrapperStyle={{
                                    fontSize: 12,
                                    paddingTop: 16,
                                    lineHeight: '20px',
                                }}
                            />
                            <Area
                                type="monotone"
                                dataKey="avg_hri_pct"
                                name="HRI"
                                stroke="#F59E0B"
                                strokeWidth={3}
                                fill="url(#reportingHriGradient)"
                                activeDot={{
                                    r: 4,
                                    stroke: '#F59E0B',
                                    strokeWidth: 2,
                                    fill: '#fff',
                                }}
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                ) : mounted ? (
                    <div className="flex h-[220px] items-center justify-center px-4 text-center text-sm text-amber-900/40">
                        No HRI history for the selected hive and month.
                    </div>
                ) : null}
            </div>
        </ChartCard>
    );
}

export default function Reporting({ hriGauges, readinessTrends }: Props) {
    return (
        <AuthenticatedLayout>
            <Head title="Reporting" />

            <div className="mx-auto max-w-7xl space-y-6 p-6 md:p-10 lg:px-10 lg:py-8">
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
                    <h1 className="text-lg font-bold text-amber-900">
                        Reporting
                    </h1>
                    <p className="mt-1 text-sm text-amber-900/50">
                        Harvest readiness overview for your hives.
                    </p>
                </div>

                <div>
                    <h2 className="mb-4 text-xs font-bold tracking-widest text-amber-900/40 uppercase">
                        HRI Gauge
                    </h2>
                    <HriGaugeGrid gauges={hriGauges} />
                </div>

                <ReadinessTrendChart trends={readinessTrends} />
            </div>
        </AuthenticatedLayout>
    );
}
