import { useEffect, useState } from 'react';
import {
    CartesianGrid,
    Legend,
    Line,
    LineChart,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from 'recharts';
import type { NameType, ValueType } from 'recharts/types/component/DefaultTooltipContent';
import type { TooltipProps } from 'recharts/types/component/Tooltip';
import { ChartDateFilter } from '@/components/core/chart-date-filter/ChartDateFilter';
import type { ChartDateFilterValue } from '@/components/core/chart-date-filter/types';
import { SelectField } from '@/components/core/form/select-field';
import { ChartCard } from '@/components/core/readiness-chart-cards';

export interface SensorReading {
    time: string;
    temp: number;
    humidity: number;
    mq2: number;
    mq3: number;
    mq5: number;
    mq135: number;
}

const TOOLTIP_STYLE = {
    backgroundColor: '#FFFBEB',
    border: '1px solid #FEF3C7',
    borderRadius: '12px',
    fontSize: '12px',
    fontWeight: 'bold',
    color: '#78350F',
};

const SENSOR_GROUP_OPTIONS = [
    { value: 'all', label: 'All Sensors' },
    { value: 'environment', label: 'Environmental (Temp + Humidity)' },
    { value: 'gas', label: 'Gas Sensors (MQ2 – MQ135)' },
];

const SENSOR_SERIES = {
    environment: [
        { dataKey: 'temp', name: 'Temp', stroke: '#ef4444', yAxisId: 'env' },
        { dataKey: 'humidity', name: 'Humidity', stroke: '#3b82f6', yAxisId: 'env' },
    ],
    gas: [
        { dataKey: 'mq2', name: 'MQ2', stroke: '#8b5cf6', yAxisId: 'gas' },
        { dataKey: 'mq3', name: 'MQ3', stroke: '#f97316', yAxisId: 'gas' },
        { dataKey: 'mq5', name: 'MQ5', stroke: '#10b981', yAxisId: 'gas' },
        { dataKey: 'mq135', name: 'MQ135', stroke: '#f59e0b', yAxisId: 'gas' },
    ],
} as const;

const sensorTooltipFormatter: NonNullable<TooltipProps<ValueType, NameType>['formatter']> = (value, name) => {
    const numericValue = typeof value === 'number' ? value : 0;
    const resolvedName = typeof name === 'string' || typeof name === 'number' ? String(name) : '';

    if (resolvedName === 'Temp') {
return [`${numericValue}°C`, resolvedName];
}

    if (resolvedName === 'Humidity') {
return [`${numericValue}%`, resolvedName];
}

    return [numericValue, `${resolvedName} ADC`];
};

interface Props {
    data: SensorReading[];
    value: ChartDateFilterValue;
    onChange: (value: ChartDateFilterValue) => void;
}

export function SensorChart({ data, value, onChange }: Props) {
    const todayYMD = new Date().toISOString().slice(0, 10);
    const [mounted, setMounted] = useState(false);
    const [group, setGroup] = useState('all');

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setMounted(true);
    }, []);

    const showEnvironment = group === 'all' || group === 'environment';
    const showGas = group === 'all' || group === 'gas';
    const visibleSeries = [
        ...(showEnvironment ? SENSOR_SERIES.environment : []),
        ...(showGas ? SENSOR_SERIES.gas : []),
    ];

    return (
        <ChartCard
            eyebrow="Sensor Readings"
            title="Daily sensor curves"
            description="Filter the selected date into environment or gas sensor groups."
            actions={
                <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:flex-wrap sm:items-center sm:justify-end">
                    <ChartDateFilter value={value} defaultDate={todayYMD} onChange={onChange} />
                    <div className="min-w-0 sm:w-[210px] sm:flex-none">
                        <SelectField value={group} onChange={setGroup} options={SENSOR_GROUP_OPTIONS} />
                    </div>
                </div>
            }
        >
            <div className="rounded-[1.75rem] border border-amber-100/70 bg-amber-50/35 p-3 sm:p-4">
                {mounted && data.length === 0 && (
                    <p className="py-12 text-center text-sm text-amber-700/60">No sensor readings for the selected date.</p>
                )}
                {mounted && data.length > 0 && (
                    <ResponsiveContainer width="100%" height={290}>
                        <LineChart data={data} margin={{ top: 8, right: showGas ? 8 : 0, left: 8, bottom: 18 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#FDE68A" strokeOpacity={0.55} />
                            <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{ fill: '#78350F', fontSize: 11, fontWeight: 600 }} dy={8} />
                            {showEnvironment && (
                                <YAxis yAxisId="env" domain={[0, 100]} axisLine={false} tickLine={false} width={36} tick={{ fill: '#78350F', fontSize: 11, fontWeight: 600 }} tickFormatter={(v) => `${v}`} tickMargin={8} />
                            )}
                            {showGas && (
                                <YAxis yAxisId="gas" orientation="right" axisLine={false} tickLine={false} width={44} domain={[(dataMin: number) => Math.max(0, dataMin - 40), (dataMax: number) => dataMax + 40]} tick={{ fill: '#92400E', fontSize: 11, fontWeight: 600 }} tickMargin={8} />
                            )}
                            <Tooltip contentStyle={TOOLTIP_STYLE} formatter={sensorTooltipFormatter} />
                            <Legend iconType="circle" wrapperStyle={{ fontSize: 12, paddingTop: 16, lineHeight: '20px' }} />
                            {visibleSeries.map((series) => (
                                <Line key={series.dataKey} type="monotone" dataKey={series.dataKey} name={series.name} stroke={series.stroke} strokeWidth={2.5} yAxisId={series.yAxisId} dot={false} activeDot={{ r: 4, stroke: series.stroke, strokeWidth: 2, fill: '#fff' }} />
                            ))}
                        </LineChart>
                    </ResponsiveContainer>
                )}
            </div>
        </ChartCard>
    );
}
