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
import { DatePickerField } from '@/components/core/date-picker';
import { ChartCard } from '@/components/core/readiness-chart-cards';
import { SelectField } from '@/components/core/form/select-field';
import { fmtDayMonth } from '@/lib/format';

export interface ReadinessTrend {
    hive_id: number;
    hive_name: string;
    summary_date: string;
    date: string;
    avg_hri_pct: number;
}

const TOOLTIP_STYLE = {
    backgroundColor: '#FFFBEB',
    border: '1px solid #FEF3C7',
    borderRadius: '12px',
    fontSize: '12px',
    fontWeight: 'bold',
    color: '#78350F',
};

const ALL_HIVES = 'all';

function toMonthValue(summaryDate: string) {
    return summaryDate.slice(0, 7);
}

interface Props {
    trends: ReadinessTrend[];
}

export function ReadinessTrendChart({ trends }: Props) {
    const hiveNames = [...new Set(trends.map((t) => t.hive_name))];
    const availableMonthValues = [...new Set(trends.map((t) => toMonthValue(t.summary_date)))].sort();
    const latestMonthValue = availableMonthValues[availableMonthValues.length - 1] ?? null;
    const hiveOptions = [
        { value: ALL_HIVES, label: 'All Hives' },
        ...hiveNames.map((name) => ({ value: name, label: name })),
    ];

    const [selectedHive, setSelectedHive] = useState(ALL_HIVES);
    const [selectedMonth, setSelectedMonth] = useState<string | null>(latestMonthValue);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setMounted(true);
    }, []);

    const activeMonth = selectedMonth ?? latestMonthValue;
    const activeHive = selectedHive === ALL_HIVES || hiveNames.includes(selectedHive) ? selectedHive : ALL_HIVES;
    const filtered = trends.filter(
        (t) =>
            (activeHive === ALL_HIVES || t.hive_name === activeHive) &&
            (!activeMonth || toMonthValue(t.summary_date) === activeMonth),
    );

    if (trends.length === 0) {
        return (
            <ChartCard
                eyebrow="Readiness Trend"
                title="Recent readiness movement"
                description="Trend data will appear once recent readiness history is available."
            >
                <p className="py-6 text-center text-sm text-amber-900/40">No HRI history in the last 30 days.</p>
            </ChartCard>
        );
    }

    return (
        <ChartCard
            eyebrow="Readiness Trend"
            title="Recent readiness movement"
            description="Monitor how HRI is changing across the selected reporting window."
        >
            <div className="mb-3 flex flex-wrap gap-2">
                <div className="w-full sm:w-[200px]">
                    <DatePickerField
                        value={selectedMonth}
                        onChange={setSelectedMonth}
                        mode="month"
                        maxDate="today"
                        placeholder="Month"
                        clearable
                        defaultValue={latestMonthValue ?? undefined}
                    />
                </div>
                <div className="w-full sm:w-[200px]">
                    <SelectField value={activeHive} onChange={setSelectedHive} options={hiveOptions} />
                </div>
            </div>
            <div className="rounded-[1.75rem] border border-amber-100/70 bg-amber-50/35 p-3 sm:p-4">
                {mounted && filtered.length > 0 ? (
                    <ResponsiveContainer width="100%" height={280}>
                        <AreaChart data={filtered} margin={{ top: 8, right: 8, left: 8, bottom: 18 }}>
                            <defs>
                                <linearGradient id="reportingHriGradient" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#F59E0B" stopOpacity={0.3} />
                                    <stop offset="95%" stopColor="#F59E0B" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#FEF3C7" />
                            <XAxis
                                dataKey="date"
                                axisLine={false}
                                tickLine={false}
                                tick={{ fill: '#78350F', fontSize: 11, fontWeight: 600 }}
                                dy={8}
                                tickMargin={8}
                                tickFormatter={(d: string) => fmtDayMonth(d)}
                            />
                            <YAxis
                                domain={[0, 100]}
                                axisLine={false}
                                tickLine={false}
                                width={36}
                                tickFormatter={(v) => `${v}%`}
                                tick={{ fill: '#78350F', fontSize: 11, fontWeight: 600 }}
                                tickMargin={8}
                            />
                            <Tooltip
                                contentStyle={TOOLTIP_STYLE}
                                formatter={(value) => {
                                    const v = typeof value === 'number' ? value : Number(value ?? 0);
                                    return [`${v}%`, 'HRI'];
                                }}
                            />
                            <Legend iconType="circle" wrapperStyle={{ fontSize: 12, paddingTop: 16, lineHeight: '20px' }} />
                            <Area
                                type="monotone"
                                dataKey="avg_hri_pct"
                                name="HRI"
                                stroke="#F59E0B"
                                strokeWidth={3}
                                fill="url(#reportingHriGradient)"
                                activeDot={{ r: 4, stroke: '#F59E0B', strokeWidth: 2, fill: '#fff' }}
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                ) : mounted ? (
                    <div className="flex h-[280px] items-center justify-center px-4 text-center text-sm text-amber-900/40">
                        No HRI history for the selected hive and month.
                    </div>
                ) : null}
            </div>
        </ChartCard>
    );
}
