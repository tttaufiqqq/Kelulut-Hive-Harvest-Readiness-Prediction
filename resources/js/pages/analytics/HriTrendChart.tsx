import { useEffect, useState } from 'react';
import {
    Area,
    AreaChart,
    CartesianGrid,
    Legend,
    Line,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from 'recharts';
import { ChartCard } from '@/components/core/readiness-chart-cards';

export interface HriTrend {
    date: string;
    hri_score: number;
    avg_7d: number;
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
    data: HriTrend[];
}

export function HriTrendChart({ data }: Props) {
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
                {mounted && data.length === 0 && (
                    <p className="py-12 text-center text-sm text-amber-700/60">No trend data available for this period.</p>
                )}
                {mounted && data.length > 0 && (
                    <ResponsiveContainer width="100%" height={220}>
                        <AreaChart data={data} margin={{ top: 8, right: 8, left: 8, bottom: 18 }}>
                            <defs>
                                <linearGradient id="analyticsHriGradient" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#F59E0B" stopOpacity={0.3} />
                                    <stop offset="95%" stopColor="#F59E0B" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#FEF3C7" />
                            <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: '#78350F', fontSize: 11, fontWeight: 600 }} dy={8} tickMargin={8} />
                            <YAxis domain={[0, 100]} axisLine={false} tickLine={false} width={36} tickFormatter={(v) => `${v}%`} tick={{ fill: '#78350F', fontSize: 11, fontWeight: 600 }} tickMargin={8} />
                            <Tooltip contentStyle={TOOLTIP_STYLE} />
                            <Legend wrapperStyle={{ fontSize: 12, paddingTop: 16, lineHeight: '20px' }} />
                            <Area type="monotone" dataKey="hri_score" name="HRI Score" stroke="#F59E0B" strokeWidth={3} fill="url(#analyticsHriGradient)" />
                            <Line type="monotone" dataKey="avg_7d" name="7d Avg" stroke="#92400E" strokeWidth={1.5} strokeDasharray="4 2" dot={false} />
                        </AreaChart>
                    </ResponsiveContainer>
                )}
            </div>
        </ChartCard>
    );
}
