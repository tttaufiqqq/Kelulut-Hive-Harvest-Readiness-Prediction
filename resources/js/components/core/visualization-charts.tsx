import { useEffect, useState } from 'react';
import {
    Cell,
    PieChart,
    Pie,
    Tooltip,
    PolarGrid,
    PolarAngleAxis,
    Radar,
    RadarChart,
    ResponsiveContainer,
} from 'recharts';
import { ChartCard, READINESS_LABELS, READINESS_SOLID_COLORS } from '@/components/core/readiness-chart-cards';

const TOOLTIP_STYLE = {
    backgroundColor: '#FFFBEB',
    border: '1px solid #FEF3C7',
    borderRadius: '12px',
    fontSize: '12px',
    fontWeight: 'bold',
    color: '#78350F',
};

const LEVEL_ORDER = ['ready', 'nearly_ready', 'approaching', 'not_ready'];

// ── ReadinessDonutChart ────────────────────────────────────────────────

export interface ReadinessDonutChartProps {
    data: { level: string; count: number }[];
    title?: string;
    description?: string;
}

export function ReadinessDonutChart({ data, title, description }: ReadinessDonutChartProps) {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setMounted(true);
    }, []);

    const isNoData = data.length === 0 || (data.length === 1 && data[0].level === 'no_data');
    const chartData = isNoData ? [{ level: 'no_data', count: 1 }] : data;
    const total = isNoData ? 0 : data.reduce((sum, d) => sum + d.count, 0);
    const sortedData = [...chartData].sort(
        (a, b) => LEVEL_ORDER.indexOf(a.level) - LEVEL_ORDER.indexOf(b.level),
    );

    return (
        <ChartCard eyebrow="Readiness" title={title} description={description}>
            <div className="rounded-[1.75rem] border border-amber-100/70 bg-amber-50/35 p-4">
                {!mounted ? (
                    <div className="flex h-[300px] items-center justify-center text-sm text-amber-900/40">
                        No readiness data yet.
                    </div>
                ) : (
                    <>
                        <div className="relative">
                            <ResponsiveContainer width="100%" height={280}>
                                <PieChart>
                                    <Pie
                                        data={sortedData}
                                        dataKey="count"
                                        innerRadius={70}
                                        outerRadius={108}
                                        paddingAngle={isNoData ? 0 : 3}
                                        cx="50%"
                                        cy="50%"
                                    >
                                        {sortedData.map((entry) => (
                                            <Cell
                                                key={entry.level}
                                                fill={READINESS_SOLID_COLORS[entry.level] ?? '#78716c'}
                                            />
                                        ))}
                                    </Pie>
                                    {!isNoData && (
                                        <Tooltip
                                            contentStyle={TOOLTIP_STYLE}
                                            formatter={(value, _name, props) => {
                                                const level = props.payload?.level as string | undefined;
                                                const label = level
                                                    ? (READINESS_LABELS[level] ?? level)
                                                    : '';
                                                return [
                                                    `${value} hive${Number(value) !== 1 ? 's' : ''}`,
                                                    label,
                                                ];
                                            }}
                                        />
                                    )}
                                </PieChart>
                            </ResponsiveContainer>
                            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                                <span className="text-3xl font-black text-amber-950">{total}</span>
                                <span className="text-[10px] font-bold tracking-widest text-amber-900/40 uppercase">
                                    hives
                                </span>
                            </div>
                        </div>

                        {/* Legend */}
                        <div className="mt-3 space-y-2 px-1">
                            {isNoData ? (
                                <div className="flex items-center gap-2.5">
                                    <div className="h-3 w-3 flex-shrink-0 rounded-full bg-stone-300" />
                                    <span className="flex-1 text-xs font-semibold text-amber-900/40">
                                        No Data
                                    </span>
                                    <span className="text-xs font-black text-amber-950">0</span>
                                </div>
                            ) : (
                                sortedData.map((entry) => (
                                    <div key={entry.level} className="flex items-center gap-2.5">
                                        <div
                                            className="h-3 w-3 flex-shrink-0 rounded-full"
                                            style={{
                                                backgroundColor:
                                                    READINESS_SOLID_COLORS[entry.level] ?? '#78716c',
                                            }}
                                        />
                                        <span className="flex-1 text-xs font-semibold text-amber-900/70">
                                            {READINESS_LABELS[entry.level] ?? entry.level}
                                        </span>
                                        <span className="text-xs font-black text-amber-950">
                                            {entry.count}
                                        </span>
                                    </div>
                                ))
                            )}
                        </div>
                    </>
                )}
            </div>
        </ChartCard>
    );
}

// ── SensorRadarChart ───────────────────────────────────────────────────

export interface SensorProfile {
    avg_temperature: number;
    avg_humidity: number;
    avg_mq2: number;
    avg_mq3: number;
    avg_mq5: number;
    avg_mq135: number;
}

export interface SensorRadarChartProps {
    profile: SensorProfile;
    hiveName: string;
    height?: number;
}

function normalizeSensorProfile(profile: SensorProfile) {
    return {
        Temp: Math.min(100, Math.max(0, ((profile.avg_temperature - 28) / 15) * 100)),
        Humidity: Math.min(100, Math.max(0, profile.avg_humidity)),
        MQ2: Math.min(100, Math.max(0, (profile.avg_mq2 / 400) * 100)),
        MQ3: Math.min(100, Math.max(0, (profile.avg_mq3 / 400) * 100)),
        MQ5: Math.min(100, Math.max(0, (profile.avg_mq5 / 400) * 100)),
        MQ135: Math.min(100, Math.max(0, (profile.avg_mq135 / 400) * 100)),
    };
}

const RADAR_AXES = ['Temp', 'Humidity', 'MQ2', 'MQ3', 'MQ5', 'MQ135'] as const;

const RAW_LABELS: Record<string, { value: (p: SensorProfile) => number; unit: string }> = {
    Temp:     { value: (p) => p.avg_temperature, unit: '°C' },
    Humidity: { value: (p) => p.avg_humidity,    unit: '%' },
    MQ2:      { value: (p) => p.avg_mq2,         unit: '' },
    MQ3:      { value: (p) => p.avg_mq3,         unit: '' },
    MQ5:      { value: (p) => p.avg_mq5,         unit: '' },
    MQ135:    { value: (p) => p.avg_mq135,       unit: '' },
};

export function SensorRadarChart({ profile, hiveName, height = 200 }: SensorRadarChartProps) {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setMounted(true);
    }, []);

    const normalized = normalizeSensorProfile(profile);
    const radarData = RADAR_AXES.map((axis) => ({
        axis,
        value: normalized[axis],
    }));

    return (
        <div className="rounded-[1.75rem] border border-amber-100/70 bg-amber-50/35 p-4">
            {hiveName && (
                <p className="mb-2 text-sm font-bold text-amber-900">{hiveName}</p>
            )}

            {mounted ? (
                <ResponsiveContainer width="100%" height={height}>
                    <RadarChart data={radarData} cx="50%" cy="50%" outerRadius="70%">
                        <PolarGrid stroke="#FEF3C7" />
                        <PolarAngleAxis
                            dataKey="axis"
                            tick={{ fill: '#78350F', fontSize: 11, fontWeight: 600 }}
                        />
                        <Radar
                            dataKey="value"
                            stroke="#F59E0B"
                            fill="#F59E0B"
                            fillOpacity={0.2}
                        />
                        <Tooltip
                            contentStyle={TOOLTIP_STYLE}
                            formatter={(value, _name, props) => {
                                const axis = props.payload?.axis as string | undefined;
                                if (!axis) return [value, ''];
                                const raw = RAW_LABELS[axis];
                                if (!raw) return [value, axis];
                                return [`${raw.value(profile).toFixed(1)}${raw.unit}`, axis];
                            }}
                        />
                    </RadarChart>
                </ResponsiveContainer>
            ) : (
                <div style={{ height }} />
            )}

            {/* Raw values footer */}
            <div className="mt-3 grid grid-cols-3 gap-x-3 gap-y-1">
                {RADAR_AXES.map((axis) => {
                    const raw = RAW_LABELS[axis];
                    return (
                        <span key={axis} className="text-[11px] font-semibold text-amber-900/60">
                            <span className="text-amber-900/40">{axis} </span>
                            {raw.value(profile).toFixed(1)}{raw.unit}
                        </span>
                    );
                })}
            </div>
        </div>
    );
}
