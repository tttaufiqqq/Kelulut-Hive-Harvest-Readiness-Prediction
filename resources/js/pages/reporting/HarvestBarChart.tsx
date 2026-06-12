import { useEffect, useState } from 'react';
import {
    Bar,
    BarChart,
    CartesianGrid,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from 'recharts';
import { SelectField } from '@/components/core/form/select-field';
import { ChartCard } from '@/components/core/readiness-chart-cards';
import { fmtMonth } from '@/lib/format';

export interface HarvestSummaryItem {
    hive_id: number;
    hive_name: string;
    harvest_month: string;
    total_weight: number;
    harvest_count: number;
}

const TOOLTIP_STYLE = {
    backgroundColor: '#FFFBEB',
    border: '1px solid #FEF3C7',
    borderRadius: '12px',
    fontSize: '12px',
    fontWeight: 'bold',
    color: '#78350F',
};

interface Props {
    data: HarvestSummaryItem[];
}

export function HarvestBarChart({ data }: Props) {
    const [mounted, setMounted] = useState(false);
    const availableMonths = [...new Set(data.map((d) => d.harvest_month))].sort();
    const latestMonth = availableMonths[availableMonths.length - 1] ?? 'all_time';
    const [selected, setSelected] = useState<string>(latestMonth);

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setMounted(true);
    }, []);

    const monthOptions = [
        { value: 'all_time', label: 'All Time' },
        ...availableMonths.map((m) => ({ value: m, label: fmtMonth(m) })),
    ];

    const filtered =
        selected === 'all_time'
            ? Object.values(
                  data.reduce<Record<number, HarvestSummaryItem>>((acc, d) => {
                      if (!acc[d.hive_id]) {
                          acc[d.hive_id] = { ...d };
                      } else {
                          acc[d.hive_id].total_weight += d.total_weight;
                          acc[d.hive_id].harvest_count += d.harvest_count;
                      }

                      return acc;
                  }, {}),
              ).sort((a, b) => b.total_weight - a.total_weight)
            : data.filter((d) => d.harvest_month === selected);

    return (
        <ChartCard
            eyebrow="Harvest Summary"
            title="Total honey harvested per hive"
            description={
                selected === 'all_time'
                    ? 'Cumulative harvest weight across all recorded months.'
                    : 'Cumulative harvest weight recorded for the selected month.'
            }
        >
            <div className="mb-3 flex flex-wrap gap-2">
                <div className="w-full sm:w-[200px]">
                    <SelectField value={selected} onChange={setSelected} options={monthOptions} />
                </div>
            </div>
            <div className="rounded-[1.75rem] border border-amber-100/70 bg-amber-50/35 p-3 sm:p-4">
                {filtered.length === 0 || !mounted ? (
                    <div className="flex h-[280px] items-center justify-center text-sm text-amber-900/40">
                        {data.length === 0 ? 'No harvest records yet.' : 'No harvests for the selected month.'}
                    </div>
                ) : (
                    <ResponsiveContainer width="100%" height={Math.max(280, filtered.length * 48)}>
                        <BarChart
                            layout="vertical"
                            data={filtered}
                            margin={{ top: 8, right: 24, left: 8, bottom: 8 }}
                        >
                            <CartesianGrid strokeDasharray="3 3" stroke="#FEF3C7" horizontal={false} />
                            <XAxis
                                type="number"
                                unit=" kg"
                                axisLine={false}
                                tickLine={false}
                                tick={{ fill: '#78350F', fontSize: 11, fontWeight: 600 }}
                                tickMargin={8}
                            />
                            <YAxis
                                dataKey="hive_name"
                                type="category"
                                width={110}
                                axisLine={false}
                                tickLine={false}
                                tick={{ fill: '#78350F', fontSize: 11, fontWeight: 600 }}
                                tickMargin={8}
                            />
                            <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(v) => [v + ' kg', 'Total Harvest']} />
                            <Bar dataKey="total_weight" fill="#F59E0B" radius={[0, 6, 6, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                )}
            </div>
        </ChartCard>
    );
}
