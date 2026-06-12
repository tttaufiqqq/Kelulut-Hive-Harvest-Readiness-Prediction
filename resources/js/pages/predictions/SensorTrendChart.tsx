import { useEffect, useState } from 'react';
import { CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { ChartCard } from '@/components/core/readiness-chart-cards';
import type { PredictionTrendItem } from './types';
import { TOOLTIP_STYLE } from './utils';

interface SensorTrendChartProps {
    data: PredictionTrendItem[];
}

export function SensorTrendChart({ data }: SensorTrendChartProps) {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setMounted(true);
    }, []);

    return (
        <ChartCard
            eyebrow="Conditions Trend"
            title="Environmental context"
            description="Review temperature and humidity shifts alongside readiness changes."
        >
            <div className="rounded-[1.75rem] border border-amber-100/70 bg-amber-50/35 p-3 sm:p-4">
                {mounted ? (
                    data.length > 0 ? (
                        <ResponsiveContainer width="100%" height={250}>
                            <LineChart data={data} margin={{ top: 8, right: 8, left: 8, bottom: 18 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#FEF3C7" />
                                <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fill: '#78350F', fontSize: 11, fontWeight: 600 }} dy={8} tickMargin={8} />
                                <YAxis axisLine={false} tickLine={false} width={36} tick={{ fill: '#78350F', fontSize: 11, fontWeight: 600 }} tickMargin={8} />
                                <Tooltip contentStyle={TOOLTIP_STYLE} />
                                <Legend wrapperStyle={{ fontSize: 12, paddingTop: 16, lineHeight: '20px' }} />
                                <Line type="monotone" dataKey="temp" name="Temp (°C)" stroke="#ef4444" strokeWidth={2} dot={false} />
                                <Line type="monotone" dataKey="humidity" name="Humidity (%)" stroke="#3b82f6" strokeWidth={2} dot={false} />
                            </LineChart>
                        </ResponsiveContainer>
                    ) : (
                        <p className="py-10 text-center text-sm text-amber-700/60">No environmental trend data for the selected date.</p>
                    )
                ) : null}
            </div>
        </ChartCard>
    );
}
