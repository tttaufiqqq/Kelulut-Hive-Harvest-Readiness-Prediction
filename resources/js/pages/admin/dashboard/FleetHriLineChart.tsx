import { useEffect, useState } from 'react';
import { CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { ChartCard } from '@/components/core/readiness-chart-cards';
import { SelectField } from '@/components/core/select-field';
import { DAY_OPTIONS, TOOLTIP_STYLE, type FleetTrendItem } from './constants';

export function FleetHriLineChart({ data }: { data: FleetTrendItem[] }) {
    const [mounted, setMounted] = useState(false);
    const [selectedDays, setSelectedDays] = useState('90');

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setMounted(true);
    }, []);

    const days = parseInt(selectedDays, 10);
    const filtered = data.slice(-days);

    return (
        <ChartCard
            eyebrow="Fleet Trend"
            title="System-wide readiness over time"
            actions={<div className="w-full sm:w-[160px]"><SelectField value={selectedDays} onChange={setSelectedDays} options={DAY_OPTIONS} /></div>}
        >
            <div className="rounded-[1.75rem] border border-amber-100/70 bg-amber-50/35 p-3 sm:p-4">
                {filtered.length === 0 || !mounted ? (
                    <div className="flex h-[260px] items-center justify-center text-sm text-amber-900/60">No fleet trend data yet.</div>
                ) : (
                    <ResponsiveContainer width="100%" height={320}>
                        <LineChart data={filtered} margin={{ top: 8, right: 24, left: 8, bottom: 18 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#FEF3C7" />
                            <XAxis
                                dataKey="summary_date"
                                axisLine={false}
                                tickLine={false}
                                tick={{ fill: '#78350F', fontSize: 11, fontWeight: 600 }}
                                dy={8}
                                tickMargin={8}
                                interval={Math.floor(filtered.length / 8)}
                                tickFormatter={(d: string, index: number) => {
                                    const date = new Date(d);
                                    const prev = filtered[index - Math.floor(filtered.length / 8)];
                                    const isNewYear = !prev || new Date(prev.summary_date).getFullYear() !== date.getFullYear();
                                    return isNewYear
                                        ? date.toLocaleDateString('en-GB', { month: 'short', year: 'numeric' })
                                        : date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
                                }}
                            />
                            <YAxis yAxisId="hri" orientation="left" unit="%" domain={[0, 100]} axisLine={false} tickLine={false} tick={{ fill: '#78350F', fontSize: 11, fontWeight: 600 }} width={40} tickMargin={8} />
                            <YAxis yAxisId="harvests" orientation="right" unit=" harvests" allowDecimals={false} axisLine={false} tickLine={false} tick={{ fill: '#78350F', fontSize: 11, fontWeight: 600 }} width={72} tickMargin={8} />
                            <Tooltip contentStyle={TOOLTIP_STYLE} />
                            <Legend wrapperStyle={{ fontSize: 12, paddingTop: 16, lineHeight: '20px' }} />
                            <Line yAxisId="hri" type="monotone" dataKey="avg_hri_pct" name="Avg HRI %" stroke="#F59E0B" strokeWidth={2.5} dot={false} activeDot={{ r: 4 }} connectNulls={true} />
                            <Line yAxisId="harvests" type="monotone" dataKey="total_harvests" name="Total Harvests" stroke="#10b981" strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
                        </LineChart>
                    </ResponsiveContainer>
                )}
            </div>
        </ChartCard>
    );
}
