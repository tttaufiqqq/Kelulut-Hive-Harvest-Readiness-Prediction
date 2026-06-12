import { useEffect, useState } from 'react';
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import type { NameType, ValueType } from 'recharts/types/component/DefaultTooltipContent';
import type { TooltipProps } from 'recharts/types/component/Tooltip';
import type { HistoryPoint } from './types';

const AXIS_TICK = { fill: '#78350F', fontSize: 11, fontWeight: 600 };
const TOOLTIP_STYLE = { backgroundColor: '#FFFBEB', border: '1px solid #FEF3C7', borderRadius: '12px', fontSize: '12px', fontWeight: 'bold', color: '#78350F' };

const sensorTooltipFormatter: NonNullable<TooltipProps<ValueType, NameType>['formatter']> = (value, name) => {
    const numericValue = typeof value === 'number' ? value : 0;
    const resolvedName = typeof name === 'string' || typeof name === 'number' ? String(name) : '';
    if (resolvedName === 'Temperature') return [`${numericValue.toFixed(1).replace(/\.0$/, '')}°C`, resolvedName];
    if (resolvedName === 'Humidity') return [`${numericValue.toFixed(1).replace(/\.0$/, '')}%`, resolvedName];
    return [numericValue, resolvedName];
};

export interface SensorTrendChartProps {
    data: HistoryPoint[];
    dataKey: keyof HistoryPoint;
    label: string;
}

export function SensorTrendChart({ data, dataKey, label }: SensorTrendChartProps) {
    const [mounted, setMounted] = useState(false);
    useEffect(() => { setMounted(true); }, []); // eslint-disable-line react-hooks/set-state-in-effect

    const values = data.map((point) => point[dataKey]).filter((value): value is number => typeof value === 'number');
    const minValue = values.length > 0 ? Math.min(...values) : 0;
    const maxValue = values.length > 0 ? Math.max(...values) : 0;
    const paddedMax = maxValue === 0 ? 100 : Math.ceil(maxValue * 1.15);
    const isHumidity = dataKey === 'humidity';

    return (
        <div className="mt-4 rounded-[1.75rem] border border-amber-100/70 bg-amber-50/35 p-3 sm:p-4">
            {mounted && (
                <ResponsiveContainer width="100%" height={170}>
                    <LineChart data={data} margin={{ top: 8, right: 8, left: 8, bottom: 18 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#FDE68A" strokeOpacity={0.55} />
                        <XAxis dataKey="time" axisLine={false} tickLine={false} tick={AXIS_TICK} dy={8} interval="preserveStartEnd" tickMargin={8} />
                        <YAxis axisLine={false} tickLine={false} tick={AXIS_TICK} width={36} tickMargin={8} domain={isHumidity ? [0, 100] : [Math.max(0, Math.floor(minValue * 0.9)), paddedMax]} />
                        <Tooltip contentStyle={TOOLTIP_STYLE} formatter={sensorTooltipFormatter} labelStyle={{ color: '#78350F' }} />
                        <Line type="monotone" dataKey={dataKey} name={label} stroke="#F59E0B" strokeWidth={2.5} dot={false} activeDot={{ r: 4, stroke: '#F59E0B', strokeWidth: 2, fill: '#fff' }} />
                    </LineChart>
                </ResponsiveContainer>
            )}
        </div>
    );
}
