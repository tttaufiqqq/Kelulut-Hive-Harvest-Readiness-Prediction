import { Head, router } from '@inertiajs/react';
import { echo } from '@laravel/echo-react';
import {
    Thermometer,
    Droplets,
    Flame,
    ChevronDown,
    Check,
    AlertCircle,
} from 'lucide-react';
import { motion } from 'motion/react';
import { useState, useRef, useEffect } from 'react';
import {
    ResponsiveContainer,
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
} from 'recharts';
import type { NameType, ValueType } from 'recharts/types/component/DefaultTooltipContent';
import type { TooltipProps } from 'recharts/types/component/Tooltip';
import { Card } from '@/components/core/card';
import { DatePicker } from '@/components/core/date-picker';
import { AdminLayout } from '@/layouts/admin-layout';

// ── Types ───────────────────────────────────────────────────────────────
type Hive = { id: number; name: string };

type LatestReading = {
    temperature: number;
    humidity: number;
    mq2: number;
    mq3: number;
    mq5: number;
    mq135: number;
    recorded_at: string;
} | null;

type HistoryPoint = {
    time: string;
    temperature: number;
    humidity: number;
    mq2: number;
    mq3: number;
    mq5: number;
    mq135: number;
};

type Props = {
    hives: Hive[];
    selected: number;
    window: '1h' | '6h' | '24h';
    date: string | null;
    latest: LatestReading;
    history: HistoryPoint[];
    last_seen: string | null;
};

function toFiniteNumber(value: unknown): number | null {
    if (typeof value === 'number') {
        return Number.isFinite(value) ? value : null;
    }

    if (typeof value === 'string' && value.trim() !== '') {
        const parsed = Number(value);

        return Number.isFinite(parsed) ? parsed : null;
    }

    return null;
}

function formatAnimatedReading(value: unknown, maxFractionDigits = 1): string {
    const numericValue = toFiniteNumber(value);

    if (numericValue === null) {
        return '—';
    }

    return numericValue.toFixed(maxFractionDigits).replace(/\.0$/, '');
}

function useAnimatedNumber(value: number, durationMs = 900) {
    const [displayValue, setDisplayValue] = useState(0);
    const animationFrameRef = useRef<number | null>(null);
    const displayedValueRef = useRef(0);

    useEffect(() => {
        if (animationFrameRef.current !== null) {
            cancelAnimationFrame(animationFrameRef.current);
            animationFrameRef.current = null;
        }

        const startValue = displayedValueRef.current;
        const targetValue = value;

        if (startValue === targetValue) {
            return;
        }

        const startedAt = performance.now();
        const tick = (now: number) => {
            const progress = Math.min((now - startedAt) / durationMs, 1);
            const easedProgress =
                progress < 0.5
                    ? 4 * progress * progress * progress
                    : 1 - Math.pow(-2 * progress + 2, 3) / 2;
            const nextValue =
                startValue + (targetValue - startValue) * easedProgress;

            displayedValueRef.current = nextValue;
            setDisplayValue(nextValue);

            if (progress < 1) {
                animationFrameRef.current = requestAnimationFrame(tick);
            } else {
                displayedValueRef.current = targetValue;
                animationFrameRef.current = null;
                setDisplayValue(targetValue);
            }
        };

        animationFrameRef.current = requestAnimationFrame(tick);

        return () => {
            if (animationFrameRef.current !== null) {
                cancelAnimationFrame(animationFrameRef.current);
                animationFrameRef.current = null;
            }
        };
    }, [durationMs, value]);

    return displayValue;
}

function AnimatedMetricValue({
    value,
    suffix = '',
    maxFractionDigits = 0,
    className = '',
}: {
    value: number | null;
    suffix?: string;
    maxFractionDigits?: number;
    className?: string;
}) {
    const [displayValue, setDisplayValue] = useState<number | null>(value);
    const previousValueRef = useRef<number | null>(value);
    const animationFrameRef = useRef<number | null>(null);

    useEffect(() => {
        if (animationFrameRef.current !== null) {
            cancelAnimationFrame(animationFrameRef.current);
            animationFrameRef.current = null;
        }

        if (value === null) {
            previousValueRef.current = null;
            animationFrameRef.current = requestAnimationFrame(() => {
                setDisplayValue(null);
                animationFrameRef.current = null;
            });

            return;
        }

        if (previousValueRef.current === null) {
            previousValueRef.current = value;
            animationFrameRef.current = requestAnimationFrame(() => {
                setDisplayValue(value);
                animationFrameRef.current = null;
            });

            return;
        }

        const startValue = previousValueRef.current;

        if (startValue === value) {
            animationFrameRef.current = requestAnimationFrame(() => {
                setDisplayValue(value);
                animationFrameRef.current = null;
            });

            return;
        }

        previousValueRef.current = value;

        const durationMs = 700;
        const startedAt = performance.now();
        const tick = (now: number) => {
            const progress = Math.min((now - startedAt) / durationMs, 1);
            const easedProgress = 1 - Math.pow(1 - progress, 3);
            const nextValue =
                startValue + (value - startValue) * easedProgress;

            setDisplayValue(nextValue);

            if (progress < 1) {
                animationFrameRef.current = requestAnimationFrame(tick);
            } else {
                animationFrameRef.current = null;
                setDisplayValue(value);
            }
        };

        animationFrameRef.current = requestAnimationFrame(tick);

        return () => {
            if (animationFrameRef.current !== null) {
                cancelAnimationFrame(animationFrameRef.current);
                animationFrameRef.current = null;
            }
        };
    }, [value]);

    if (displayValue === null) {
        return <span className={className}>—</span>;
    }

    return (
        <span className={`tabular-nums ${className}`}>
            {formatAnimatedReading(displayValue, maxFractionDigits)}
            {suffix}
        </span>
    );
}

// ── ArcGauge ────────────────────────────────────────────────────────────
// Needle drawn pointing right (+x), rotated by -(1-ratio)*180° around pivot.
// displayValue starts at 0 on mount so the transition plays from zero on load.
function ArcGauge({
    value,
    max,
    color,
    noData = false,
}: {
    value: number;
    max: number;
    color: string;
    noData?: boolean;
}) {
    const displayValue = useAnimatedNumber(value, 950);
    const cx = 60;
    const cy = 58;
    const radius = 46;
    const arcLength = Math.PI * radius;
    const ratio = Math.min(displayValue / max, 1);
    const fill = ratio * arcLength;
    const rotateDeg = -(1 - ratio) * 180;

    const d = `M ${cx - radius} ${cy} A ${radius} ${radius} 0 0 1 ${cx + radius} ${cy}`;

    return (
        <svg viewBox="0 0 120 65" className="mx-auto w-full max-w-[180px]">
            {/* Background arc */}
            <path
                d={d}
                fill="none"
                stroke={noData ? '#D1D5DB' : '#FEF3C7'}
                strokeWidth="7"
                strokeLinecap="round"
            />
            {/* Filled arc — animates on value change */}
            <path
                d={d}
                fill="none"
                stroke={color}
                strokeWidth="7"
                strokeLinecap="round"
                style={{
                    strokeDasharray: noData
                        ? `0 ${arcLength}`
                        : `${fill} ${arcLength}`,
                    transition: 'stroke 0.3s ease',
                }}
            />
            {/* Needle — rotates around pivot, drawn pointing right at rest */}
            <g
                style={{
                    transformOrigin: `${cx}px ${cy}px`,
                    transform: `rotate(${rotateDeg}deg)`,
                    opacity: noData ? 0 : 1,
                    transition: 'opacity 0.2s ease',
                }}
            >
                <line
                    x1={cx - 7}
                    y1={cy}
                    x2={cx + 38}
                    y2={cy}
                    stroke="#78350F"
                    strokeWidth="2"
                    strokeLinecap="round"
                />
            </g>
            {/* Pivot dot */}
            <circle
                cx={cx}
                cy={cy}
                r="4"
                fill={noData ? '#D1D5DB' : '#78350F'}
            />
            <circle
                cx={cx}
                cy={cy}
                r="2"
                fill={noData ? '#D1D5DB' : '#FEF3C7'}
            />
            {/* No-data label */}
            {noData && (
                <text
                    x={cx}
                    y={cy - 8}
                    textAnchor="middle"
                    fill="#9CA3AF"
                    fontSize="14"
                    fontWeight="bold"
                >
                    --
                </text>
            )}
        </svg>
    );
}

// ── ProgressBar ──────────────────────────────────────────────────────────
function ProgressBar({
    value,
    color,
    noData = false,
}: {
    value: number;
    color: string;
    noData?: boolean;
}) {
    const displayValue = useAnimatedNumber(value, 950);

    return (
        <>
            <div
                className="my-4 h-3 w-full overflow-hidden rounded-full"
                style={{ backgroundColor: noData ? '#D1D5DB' : '#FEF3C7' }}
            >
                <div
                    className="h-full rounded-full"
                    style={{
                        width: noData
                            ? '0%'
                            : `${Math.min(displayValue, 100)}%`,
                        backgroundColor: color,
                        transition: 'background-color 0.3s ease',
                    }}
                />
            </div>
            {noData && (
                <p className="-mt-2 mb-1 text-center text-xs text-gray-400">
                    --
                </p>
            )}
        </>
    );
}

// ── Color helpers ────────────────────────────────────────────────────────
function tempColor(t: number): string {
    if (t > 37) {
        return '#EF4444';
    }

    if (t > 32) {
        return '#F59E0B';
    }

    return '#10B981';
}

function humidColor(h: number): string {
    if (h > 85) {
        return '#EF4444';
    }

    if (h > 70) {
        return '#F59E0B';
    }

    return '#10B981';
}

// Gas sensor display max — clean air ~10-100, warning zone 300-500+.
const MQ_GAUGE_MAX = 500;

function mqColor(v: number): string {
    if (v > 300) {
        return '#EF4444';
    }

    if (v > 150) {
        return '#F59E0B';
    }

    return '#10B981';
}

function statusLabel(color: string): {
    text: string;
    textColor: string;
    dotColor: string;
} {
    if (color === '#EF4444') {
        return {
            text: 'Warning',
            textColor: 'text-red-600',
            dotColor: 'bg-red-400',
        };
    }

    if (color === '#F59E0B') {
        return {
            text: 'Monitor',
            textColor: 'text-amber-600',
            dotColor: 'bg-amber-400',
        };
    }

    return {
        text: 'Healthy',
        textColor: 'text-emerald-600',
        dotColor: 'bg-emerald-400',
    };
}

function StatusBadge({ color }: { color: string }) {
    const { text, textColor, dotColor } = statusLabel(color);

    return (
        <div className="mt-1 mb-2 flex justify-center">
            <span
                className={`flex items-center gap-1.5 text-xs font-bold ${textColor}`}
            >
                <span className={`h-2 w-2 rounded-full ${dotColor}`} />
                {text}
            </span>
        </div>
    );
}

// ── Shared LineChart style ────────────────────────────────────────────────
const AXIS_TICK = { fill: '#78350F', fontSize: 11, fontWeight: 600 };
const TOOLTIP_STYLE = {
    backgroundColor: '#FFFBEB',
    border: '1px solid #FEF3C7',
    borderRadius: '12px',
    fontSize: '12px',
    fontWeight: 'bold',
    color: '#78350F',
};

const SENSOR_DESCRIPTIONS = {
    temperature: 'Internal hive temperature',
    humidity: 'Relative humidity',
    mq2: 'Smoke / LPG',
    mq3: 'Alcohol / Benzene',
    mq5: 'LPG / Natural Gas',
    mq135: 'Air Quality / CO₂',
} as const;

const sensorTooltipFormatter: NonNullable<
    TooltipProps<ValueType, NameType>['formatter']
> = (value, name) => {
    const numericValue = typeof value === 'number' ? value : 0;
    const resolvedName =
        typeof name === 'string' || typeof name === 'number'
            ? String(name)
            : '';

    if (resolvedName === 'Temperature') {
        return [`${numericValue.toFixed(1).replace(/\.0$/, '')}°C`, resolvedName];
    }

    if (resolvedName === 'Humidity') {
        return [`${numericValue.toFixed(1).replace(/\.0$/, '')}%`, resolvedName];
    }

    return [numericValue, resolvedName];
};

function SensorTrendChart({
    data,
    dataKey,
    label,
}: {
    data: HistoryPoint[];
    dataKey: keyof HistoryPoint;
    label: string;
}) {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setMounted(true);
    }, []);

    const values = data
        .map((point) => point[dataKey])
        .filter((value): value is number => typeof value === 'number');
    const minValue = values.length > 0 ? Math.min(...values) : 0;
    const maxValue = values.length > 0 ? Math.max(...values) : 0;
    const paddedMax = maxValue === 0 ? 100 : Math.ceil(maxValue * 1.15);
    const isHumidity = dataKey === 'humidity';

    return (
        <div className="mt-4 rounded-[1.75rem] border border-amber-100/70 bg-amber-50/35 p-3 sm:p-4">
            {mounted && (
                <ResponsiveContainer width="100%" height={170}>
                    <LineChart
                        data={data}
                        margin={{
                            top: 8,
                            right: 8,
                            left: 8,
                            bottom: 18,
                        }}
                    >
                        <CartesianGrid
                            strokeDasharray="3 3"
                            vertical={false}
                            stroke="#FDE68A"
                            strokeOpacity={0.55}
                        />
                        <XAxis
                            dataKey="time"
                            axisLine={false}
                            tickLine={false}
                            tick={AXIS_TICK}
                            dy={8}
                            interval="preserveStartEnd"
                            tickMargin={8}
                        />
                        <YAxis
                            axisLine={false}
                            tickLine={false}
                            tick={AXIS_TICK}
                            width={36}
                            tickMargin={8}
                            domain={
                                isHumidity
                                    ? [0, 100]
                                    : [
                                          Math.max(0, Math.floor(minValue * 0.9)),
                                          paddedMax,
                                      ]
                            }
                        />
                        <Tooltip
                            contentStyle={TOOLTIP_STYLE}
                            formatter={sensorTooltipFormatter}
                            labelStyle={{ color: '#78350F' }}
                        />
                        <Line
                            type="monotone"
                            dataKey={dataKey}
                            name={label}
                            stroke="#F59E0B"
                            strokeWidth={2.5}
                            dot={false}
                            activeDot={{
                                r: 4,
                                stroke: '#F59E0B',
                                strokeWidth: 2,
                                fill: '#fff',
                            }}
                        />
                    </LineChart>
                </ResponsiveContainer>
            )}
        </div>
    );
}

// ── SensorHeader ─────────────────────────────────────────────────────────
function SensorHeader({
    icon,
    label,
    value,
    iconBg,
    iconColor,
}: {
    icon: React.ReactNode;
    label: string;
    value?: React.ReactNode;
    iconBg: string;
    iconColor: string;
}) {
    return (
        <div className="mb-1 flex items-center justify-between">
            <div className="flex items-center gap-2">
                <motion.div
                    initial={{ scale: 0.6, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: 'spring', stiffness: 350, damping: 20 }}
                    className={`${iconBg} rounded-xl p-2`}
                    style={{ color: iconColor }}
                >
                    {icon}
                </motion.div>
                <span className="text-[11px] font-black tracking-widest text-amber-900/60 uppercase sm:text-xs">
                    {label}
                </span>
            </div>
            {value !== undefined && value !== null && (
                <div className="text-xl font-black text-amber-950 sm:text-2xl">
                    {value}
                </div>
            )}
        </div>
    );
}

// ── HiveDropdown ─────────────────────────────────────────────────────────
function HiveDropdown({
    hives,
    selected,
    onSelect,
}: {
    hives: Hive[];
    selected: number;
    onSelect: (id: number) => void;
}) {
    const [open, setOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);
    const selectedHive = hives.find((h) => h.id === selected);

    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (ref.current && !ref.current.contains(e.target as Node)) {
                setOpen(false);
            }
        };
        document.addEventListener('mousedown', handler);

        return () => document.removeEventListener('mousedown', handler);
    }, []);

    return (
        <div ref={ref} className="relative w-full sm:w-auto">
            <button
                onClick={() => setOpen((o) => !o)}
                className="flex w-full min-w-0 items-center justify-between gap-3 rounded-xl border border-yellow-200 bg-white px-4 py-2.5 text-sm font-semibold text-amber-900 transition-colors hover:bg-yellow-50/50 sm:min-w-[180px]"
            >
                <span className="truncate">
                    {selectedHive?.name ?? 'Select hive'}
                </span>
                <ChevronDown
                    className={`h-4 w-4 text-amber-900/40 transition-transform ${open ? 'rotate-180' : ''}`}
                />
            </button>
            {open && (
                <div className="absolute top-full left-0 z-20 mt-2 w-full min-w-0 overflow-hidden rounded-2xl border border-yellow-100 bg-white shadow-lg sm:min-w-[180px]">
                    {hives.map((h) => (
                        <button
                            key={h.id}
                            onClick={() => {
                                onSelect(h.id);
                                setOpen(false);
                            }}
                            className="flex w-full items-center justify-between px-4 py-2.5 text-sm text-amber-900 transition-colors hover:bg-yellow-50/60"
                        >
                            <span
                                className={
                                    h.id === selected
                                        ? 'font-bold'
                                        : 'font-medium'
                                }
                            >
                                {h.name}
                            </span>
                            {h.id === selected && (
                                <Check className="h-3.5 w-3.5 text-amber-500" />
                            )}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}

// ── AdminSensors ─────────────────────────────────────────────────────────
export default function AdminSensors({
    hives,
    selected,
    window,
    date,
    latest,
    history,
    last_seen,
}: Props) {
    const liveReloadInFlight = useRef(false);
    const normalizedLatest = latest
        ? {
              ...latest,
              temperature: toFiniteNumber(latest.temperature),
              humidity: toFiniteNumber(latest.humidity),
              mq2: toFiniteNumber(latest.mq2),
              mq3: toFiniteNumber(latest.mq3),
              mq5: toFiniteNumber(latest.mq5),
              mq135: toFiniteNumber(latest.mq135),
          }
        : null;
    const normalizedHistory = history.map((point) => ({
        ...point,
        temperature: toFiniteNumber(point.temperature) ?? 0,
        humidity: toFiniteNumber(point.humidity) ?? 0,
        mq2: toFiniteNumber(point.mq2) ?? 0,
        mq3: toFiniteNumber(point.mq3) ?? 0,
        mq5: toFiniteNumber(point.mq5) ?? 0,
        mq135: toFiniteNumber(point.mq135) ?? 0,
    }));
    const sensorChannelName = hives.some((hive) => hive.id === selected)
        ? `hive.${selected}.sensors`
        : null;
    const sensorCards = [
        {
            key: 'temperature' as const,
            label: 'Temperature',
            description: SENSOR_DESCRIPTIONS.temperature,
            value: normalizedLatest?.temperature ?? null,
            suffix: '°C',
            maxFractionDigits: 1,
            icon: <Thermometer className="h-4 w-4" />,
            iconBg: 'bg-amber-100',
            iconColor: '#B45309',
            renderVisual: () => (
                <>
                    <ArcGauge
                        value={normalizedLatest?.temperature ?? 0}
                        max={45}
                        color={
                            normalizedLatest?.temperature != null
                                ? tempColor(normalizedLatest.temperature)
                                : '#FEF3C7'
                        }
                        noData={!normalizedLatest}
                    />
                    {normalizedLatest?.temperature != null && (
                        <StatusBadge
                            color={tempColor(normalizedLatest.temperature)}
                        />
                    )}
                </>
            ),
        },
        {
            key: 'humidity' as const,
            label: 'Humidity',
            description: SENSOR_DESCRIPTIONS.humidity,
            value: normalizedLatest?.humidity ?? null,
            suffix: '%',
            maxFractionDigits: 1,
            icon: <Droplets className="h-4 w-4" />,
            iconBg: 'bg-blue-50',
            iconColor: '#3B82F6',
            renderVisual: () => (
                <>
                    <ProgressBar
                        value={normalizedLatest?.humidity ?? 0}
                        color={
                            normalizedLatest?.humidity != null
                                ? humidColor(normalizedLatest.humidity)
                                : '#FEF3C7'
                        }
                        noData={!normalizedLatest}
                    />
                    {normalizedLatest?.humidity != null && (
                        <StatusBadge
                            color={humidColor(normalizedLatest.humidity)}
                        />
                    )}
                </>
            ),
        },
        {
            key: 'mq2' as const,
            label: 'MQ-2',
            description: SENSOR_DESCRIPTIONS.mq2,
            value: normalizedLatest?.mq2 ?? null,
            maxFractionDigits: 0,
            icon: <Flame className="h-4 w-4" />,
            iconBg: 'bg-red-50',
            iconColor: '#EF4444',
            renderVisual: () => (
                <>
                    <ArcGauge
                        value={normalizedLatest?.mq2 ?? 0}
                        max={MQ_GAUGE_MAX}
                        color={
                            normalizedLatest?.mq2 != null
                                ? mqColor(normalizedLatest.mq2)
                                : '#FEF3C7'
                        }
                        noData={!normalizedLatest}
                    />
                    {normalizedLatest?.mq2 != null && (
                        <StatusBadge color={mqColor(normalizedLatest.mq2)} />
                    )}
                </>
            ),
        },
        {
            key: 'mq3' as const,
            label: 'MQ-3',
            description: SENSOR_DESCRIPTIONS.mq3,
            value: normalizedLatest?.mq3 ?? null,
            maxFractionDigits: 0,
            icon: <Flame className="h-4 w-4" />,
            iconBg: 'bg-red-50',
            iconColor: '#EF4444',
            renderVisual: () => (
                <>
                    <ArcGauge
                        value={normalizedLatest?.mq3 ?? 0}
                        max={MQ_GAUGE_MAX}
                        color={
                            normalizedLatest?.mq3 != null
                                ? mqColor(normalizedLatest.mq3)
                                : '#FEF3C7'
                        }
                        noData={!normalizedLatest}
                    />
                    {normalizedLatest?.mq3 != null && (
                        <StatusBadge color={mqColor(normalizedLatest.mq3)} />
                    )}
                </>
            ),
        },
        {
            key: 'mq5' as const,
            label: 'MQ-5',
            description: SENSOR_DESCRIPTIONS.mq5,
            value: normalizedLatest?.mq5 ?? null,
            maxFractionDigits: 0,
            icon: <Flame className="h-4 w-4" />,
            iconBg: 'bg-red-50',
            iconColor: '#EF4444',
            renderVisual: () => (
                <>
                    <ArcGauge
                        value={normalizedLatest?.mq5 ?? 0}
                        max={MQ_GAUGE_MAX}
                        color={
                            normalizedLatest?.mq5 != null
                                ? mqColor(normalizedLatest.mq5)
                                : '#FEF3C7'
                        }
                        noData={!normalizedLatest}
                    />
                    {normalizedLatest?.mq5 != null && (
                        <StatusBadge color={mqColor(normalizedLatest.mq5)} />
                    )}
                </>
            ),
        },
        {
            key: 'mq135' as const,
            label: 'MQ-135',
            description: SENSOR_DESCRIPTIONS.mq135,
            value: normalizedLatest?.mq135 ?? null,
            maxFractionDigits: 0,
            icon: <Flame className="h-4 w-4" />,
            iconBg: 'bg-red-50',
            iconColor: '#EF4444',
            renderVisual: () => (
                <>
                    <ArcGauge
                        value={normalizedLatest?.mq135 ?? 0}
                        max={MQ_GAUGE_MAX}
                        color={
                            normalizedLatest?.mq135 != null
                                ? mqColor(normalizedLatest.mq135)
                                : '#FEF3C7'
                        }
                        noData={!normalizedLatest}
                    />
                    {normalizedLatest?.mq135 != null && (
                        <StatusBadge color={mqColor(normalizedLatest.mq135)} />
                    )}
                </>
            ),
        },
    ];
    const summarySensorCards = sensorCards.slice(0, 2);
    const gasSensorCards = sensorCards.slice(2);

    const navigate = (params: Record<string, string | number | null>) =>
        router.get(route('admin.sensors.index'), {
            hive_id: selected,
            window,
            date: date ?? '',
            ...params,
        });

    const WINDOWS: ('1h' | '6h' | '24h')[] = ['1h', '6h', '24h'];

    useEffect(() => {
        const resetLiveReload = () => {
            liveReloadInFlight.current = false;
        };

        const removeStartListener = router.on('start', () => {
            liveReloadInFlight.current = true;
        });
        const removeFinishListener = router.on('finish', resetLiveReload);

        return () => {
            removeStartListener();
            removeFinishListener();
        };
    }, []);

    useEffect(() => {
        if (!sensorChannelName) {
            return;
        }

        const realtime = echo();
        const channel = realtime.private(sensorChannelName);
        const eventName = '.sensor.reading.created';
        const resetLiveReload = () => {
            liveReloadInFlight.current = false;
        };
        const reloadSensorProps = () => {
            if (document.hidden || liveReloadInFlight.current) {
                return;
            }

            liveReloadInFlight.current = true;

            router.reload({
                only: ['latest', 'history', 'last_seen'],
                onCancel: resetLiveReload,
                onError: resetLiveReload,
                onFinish: resetLiveReload,
                onSuccess: resetLiveReload,
            });
        };

        channel.listen(eventName, reloadSensorProps);

        return () => {
            channel.stopListening(eventName, reloadSensorProps);
            realtime.leave(sensorChannelName);
        };
    }, [sensorChannelName]);

    return (
        <AdminLayout>
            <Head title="Sensor Readings" />

            <div className="space-y-6">
                {/* ── Controls ────────────────────────────────────── */}
                <div className="grid gap-3 md:flex md:items-center md:justify-between">
                    <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto] md:flex md:items-center">
                        <HiveDropdown
                            hives={hives}
                            selected={selected}
                            onSelect={(id) => navigate({ hive_id: id })}
                        />
                        {normalizedLatest !== null ? (
                            <div className="flex min-h-11 items-center justify-center gap-1.5 rounded-xl bg-emerald-50 px-3 py-1.5 sm:justify-start">
                                <span className="relative flex h-2 w-2">
                                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                                    <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
                                </span>
                                <span className="text-xs font-bold text-emerald-700">
                                    Live
                                </span>
                            </div>
                        ) : (
                            <div className="flex min-h-11 items-center gap-2 rounded-xl bg-gray-50 px-3 py-2 text-left">
                                <span className="mt-0.5 h-2 w-2 flex-shrink-0 rounded-full bg-gray-400" />
                                <span className="text-xs leading-relaxed font-bold text-gray-500">
                                    No Data
                                    {last_seen
                                        ? ` | Last seen ${last_seen}`
                                        : ''}
                                </span>
                            </div>
                        )}
                    </div>
                    <div className="grid grid-cols-[auto_minmax(0,1fr)] items-center gap-2 sm:flex sm:flex-wrap md:justify-end">
                        {/* Date filter */}
                        <DatePicker
                            className="justify-self-start"
                            value={date}
                            onChange={(d) =>
                                navigate({ date: d ?? '', window })
                            }
                        />

                        {/* Time window */}
                        <div className="grid grid-cols-3 gap-1 rounded-2xl bg-yellow-100/50 p-1.5">
                            {WINDOWS.map((w) => (
                                <button
                                    key={w}
                                    onClick={() => navigate({ window: w })}
                                    className={[
                                        'rounded-xl px-2 py-2 text-sm font-semibold transition-all sm:px-4 sm:py-1.5',
                                        w === window
                                            ? 'bg-white text-amber-900 shadow-sm'
                                            : 'text-amber-900/60 hover:bg-yellow-200/50',
                                    ].join(' ')}
                                >
                                    {w}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* ── Window Nudge Bar ──────────────────────────────── */}
                {normalizedLatest === null && (
                    <div className="rounded-xl border border-amber-100 bg-amber-50 px-4 py-3">
                        <div className="flex min-w-0 items-start gap-2">
                            <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-amber-600" />
                            <span className="text-sm leading-relaxed font-semibold text-amber-700">
                                No readings in the last {window}.
                            </span>
                        </div>
                    </div>
                )}

                {/* ── Sensor Cards ─────────────────────────────────── */}
                {hives.length === 0 ? (
                    <Card>
                        <p className="py-8 text-center text-sm text-amber-900/50">
                            No hives found.
                        </p>
                    </Card>
                ) : (
                    <div className="space-y-6">
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-6">
                            {summarySensorCards.map(
                                ({
                                    key,
                                    label,
                                    description,
                                    value,
                                    suffix,
                                    maxFractionDigits,
                                    icon,
                                    iconBg,
                                    iconColor,
                                    renderVisual,
                                }) => (
                                    <Card
                                        key={key}
                                        className="flex min-h-[500px] min-w-0 flex-col p-4 sm:p-6"
                                    >
                                        <SensorHeader
                                            icon={icon}
                                            label={label}
                                            value={
                                                <AnimatedMetricValue
                                                    value={value}
                                                    suffix={suffix}
                                                    maxFractionDigits={
                                                        maxFractionDigits
                                                    }
                                                />
                                            }
                                            iconBg={iconBg}
                                            iconColor={iconColor}
                                        />
                                        <p className="text-xs text-amber-700/55">
                                            {description}
                                        </p>
                                        <div className="mt-4 flex min-h-[174px] flex-col justify-center px-2 py-2">
                                            {renderVisual()}
                                        </div>
                                        <div className="mt-auto">
                                            <SensorTrendChart
                                                data={normalizedHistory}
                                                dataKey={key}
                                                label={label}
                                            />
                                        </div>
                                    </Card>
                                ),
                            )}
                        </div>

                        <div>
                            <div className="mb-3 flex items-center gap-2">
                                <motion.div
                                    initial={{ scale: 0.6, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    transition={{
                                        type: 'spring',
                                        stiffness: 350,
                                        damping: 20,
                                    }}
                                    className="rounded-xl bg-red-50 p-2 text-red-500"
                                >
                                    <Flame className="h-4 w-4" />
                                </motion.div>
                                <span className="text-xs font-black tracking-widest text-amber-900/60 uppercase">
                                    Gas Sensors
                                </span>
                            </div>
                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                                {gasSensorCards.map(
                                    ({
                                        key,
                                        label,
                                        description,
                                        value,
                                        suffix,
                                        maxFractionDigits,
                                        icon,
                                        iconBg,
                                        iconColor,
                                        renderVisual,
                                    }) => (
                                        <Card
                                            key={key}
                                            className="flex h-[500px] min-w-0 flex-col p-4 sm:p-6"
                                        >
                                            <SensorHeader
                                                icon={icon}
                                                label={label}
                                                value={
                                                    <AnimatedMetricValue
                                                        value={value}
                                                        suffix={suffix}
                                                        maxFractionDigits={
                                                            maxFractionDigits
                                                        }
                                                    />
                                                }
                                                iconBg={iconBg}
                                                iconColor={iconColor}
                                            />
                                            <p className="text-xs text-amber-700/55">
                                                {description}
                                            </p>
                                            <div className="mt-4 flex min-h-[174px] flex-col justify-center px-2 py-2">
                                                {renderVisual()}
                                            </div>
                                            <div className="mt-auto">
                                                <SensorTrendChart
                                                    data={normalizedHistory}
                                                    dataKey={key}
                                                    label={label}
                                                />
                                            </div>
                                        </Card>
                                    ),
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* ── Last updated ──────────────────────────────────── */}
                {normalizedLatest && (
                    <p className="text-right text-xs font-semibold tracking-widest text-amber-900/30 uppercase">
                        Last reading: {normalizedLatest.recorded_at}
                    </p>
                )}
            </div>
        </AdminLayout>
    );
}
