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
import { Card } from '@/components/core/card';
import { DatePicker } from '@/components/core/date-picker';
import { ScrollArea } from '@/components/core/scroll-area';
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
    const [displayValue, setDisplayValue] = useState(0);
    const mounted = useRef(false);

    useEffect(() => {
        if (!mounted.current) {
            mounted.current = true;
            const t = setTimeout(() => setDisplayValue(value), 80);

            return () => clearTimeout(t);
        }

        setDisplayValue(value);
    }, [value]);

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
                    transition:
                        'stroke-dasharray 0.7s ease-out, stroke 0.4s ease',
                }}
            />
            {/* Needle — rotates around pivot, drawn pointing right at rest */}
            <g
                style={{
                    transformOrigin: `${cx}px ${cy}px`,
                    transform: `rotate(${rotateDeg}deg)`,
                    transition: 'transform 0.7s ease-out',
                    opacity: noData ? 0 : 1,
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
    const [displayValue, setDisplayValue] = useState(0);
    const mounted = useRef(false);

    useEffect(() => {
        if (!mounted.current) {
            mounted.current = true;
            const t = setTimeout(() => setDisplayValue(value), 80);

            return () => clearTimeout(t);
        }

        setDisplayValue(value);
    }, [value]);

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
                        transition:
                            'width 0.7s ease-out, background-color 0.4s ease',
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
const AXIS_TICK = { fill: '#78350F', fontSize: 10, fontWeight: 600 };
const TOOLTIP_STYLE = {
    backgroundColor: '#FFFBEB',
    border: '1px solid #FEF3C7',
    borderRadius: '12px',
    fontSize: '12px',
    fontWeight: 'bold',
    color: '#78350F',
};

function SensorLine({
    data,
    dataKey,
}: {
    data: HistoryPoint[];
    dataKey: keyof HistoryPoint;
}) {
    return (
        <div className="mt-4 w-full min-w-0">
            <ResponsiveContainer width="100%" height={140}>
                <LineChart data={data}>
                    <CartesianGrid
                        strokeDasharray="3 3"
                        vertical={false}
                        stroke="#FEF3C7"
                    />
                    <XAxis
                        dataKey="time"
                        axisLine={false}
                        tickLine={false}
                        tick={AXIS_TICK}
                        dy={8}
                        interval="preserveStartEnd"
                    />
                    <YAxis
                        axisLine={false}
                        tickLine={false}
                        tick={AXIS_TICK}
                        width={32}
                    />
                    <Tooltip contentStyle={TOOLTIP_STYLE} />
                    <Line
                        type="monotone"
                        dataKey={dataKey}
                        stroke="#F59E0B"
                        strokeWidth={2}
                        dot={false}
                        isAnimationActive={false}
                    />
                </LineChart>
            </ResponsiveContainer>
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
    value?: string;
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
            {value && (
                <motion.span
                    key={value}
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                    className="text-xl font-black text-amber-950 sm:text-2xl"
                >
                    {value}
                </motion.span>
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
    const sensorChannelName = hives.some((hive) => hive.id === selected)
        ? `hive.${selected}.sensors`
        : null;

    const navigate = (params: Record<string, string | number | null>) =>
        router.get(route('admin.sensors.index'), {
            hive_id: selected,
            window,
            date: date ?? '',
            ...params,
        });

    const WINDOWS: ('1h' | '6h' | '24h')[] = ['1h', '6h', '24h'];

    const nudgeWindows =
        latest === null
            ? WINDOWS.filter(
                  (w) => WINDOWS.indexOf(w) > WINDOWS.indexOf(window),
              )
            : [];

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
            <Head title="Sensor Readings — BuzzyHive 2.0" />

            <div className="space-y-6">
                {/* ── Controls ────────────────────────────────────── */}
                <div className="grid gap-3 md:flex md:items-center md:justify-between">
                    <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto] md:flex md:items-center">
                        <HiveDropdown
                            hives={hives}
                            selected={selected}
                            onSelect={(id) => navigate({ hive_id: id })}
                        />
                        {latest !== null ? (
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
                {latest === null && (
                    <div className="flex flex-col gap-3 rounded-xl border border-amber-100 bg-amber-50 px-4 py-3 sm:flex-row sm:items-center">
                        <div className="flex min-w-0 flex-1 items-start gap-2">
                            <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-amber-600" />
                            <span className="text-sm leading-relaxed font-semibold text-amber-700">
                                No readings in the last {window}.
                            </span>
                        </div>
                        <div className="flex gap-2 self-start sm:self-auto">
                            {nudgeWindows.map((w) => (
                                <button
                                    key={w}
                                    onClick={() => navigate({ window: w })}
                                    className="rounded-lg bg-amber-100 px-3 py-1 text-xs font-bold text-amber-900 transition-colors hover:bg-amber-200"
                                >
                                    {w}
                                </button>
                            ))}
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
                        {/* ── Top row: Temperature + Humidity ── */}
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-6">
                            {/* Temperature */}
                            <Card className="flex flex-col p-4 sm:p-6">
                                <SensorHeader
                                    icon={<Thermometer className="h-4 w-4" />}
                                    label="Temperature"
                                    value={
                                        latest ? `${latest.temperature}°C` : '—'
                                    }
                                    iconBg="bg-amber-100"
                                    iconColor="#B45309"
                                />
                                <ArcGauge
                                    value={latest?.temperature ?? 0}
                                    max={45}
                                    color={
                                        latest
                                            ? tempColor(latest.temperature)
                                            : '#FEF3C7'
                                    }
                                    noData={!latest}
                                />
                                {latest && (
                                    <StatusBadge
                                        color={tempColor(latest.temperature)}
                                    />
                                )}
                                <SensorLine
                                    data={history}
                                    dataKey="temperature"
                                />
                            </Card>

                            {/* Humidity */}
                            <Card className="flex flex-col p-4 sm:p-6">
                                <SensorHeader
                                    icon={<Droplets className="h-4 w-4" />}
                                    label="Humidity"
                                    value={latest ? `${latest.humidity}%` : '—'}
                                    iconBg="bg-blue-50"
                                    iconColor="#3B82F6"
                                />
                                <ProgressBar
                                    value={latest?.humidity ?? 0}
                                    color={
                                        latest
                                            ? humidColor(latest.humidity)
                                            : '#FEF3C7'
                                    }
                                    noData={!latest}
                                />
                                {latest && (
                                    <StatusBadge
                                        color={humidColor(latest.humidity)}
                                    />
                                )}
                                <SensorLine data={history} dataKey="humidity" />
                            </Card>
                        </div>

                        {/* ── Bottom row: Gas sensors (horizontal scroll) ── */}
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
                            <ScrollArea
                                direction="horizontal"
                                className="-mx-1 px-1 pb-3"
                            >
                                <div className="flex min-w-max gap-4">
                                    {(
                                        [
                                            {
                                                key: 'mq2' as const,
                                                label: 'MQ-2',
                                                desc: 'Smoke / LPG',
                                            },
                                            {
                                                key: 'mq3' as const,
                                                label: 'MQ-3',
                                                desc: 'Alcohol / Benzene',
                                            },
                                            {
                                                key: 'mq5' as const,
                                                label: 'MQ-5',
                                                desc: 'LPG / Natural Gas',
                                            },
                                            {
                                                key: 'mq135' as const,
                                                label: 'MQ-135',
                                                desc: 'Air Quality / CO₂',
                                            },
                                        ] as const
                                    ).map(({ key, label, desc }) => (
                                        <Card
                                            key={key}
                                            className="flex w-[min(18rem,85vw)] flex-shrink-0 flex-col p-4 sm:w-64 sm:p-6"
                                        >
                                            <div className="mb-1 flex items-center justify-between">
                                                <div>
                                                    <span className="text-xs font-black tracking-widest text-amber-900/60 uppercase">
                                                        {label}
                                                    </span>
                                                    <p className="mt-0.5 text-[10px] font-medium text-amber-900/40">
                                                        {desc}
                                                    </p>
                                                </div>
                                                {latest && (
                                                    <motion.span
                                                        key={latest[key]}
                                                        initial={{
                                                            opacity: 0,
                                                            y: -4,
                                                        }}
                                                        animate={{
                                                            opacity: 1,
                                                            y: 0,
                                                        }}
                                                        transition={{
                                                            duration: 0.3,
                                                        }}
                                                        className="text-2xl font-black text-amber-950"
                                                    >
                                                        {latest[key]}
                                                    </motion.span>
                                                )}
                                            </div>
                                            <ArcGauge
                                                value={latest?.[key] ?? 0}
                                                max={MQ_GAUGE_MAX}
                                                color={
                                                    latest
                                                        ? mqColor(latest[key])
                                                        : '#FEF3C7'
                                                }
                                                noData={!latest}
                                            />
                                            {latest && (
                                                <StatusBadge
                                                    color={mqColor(latest[key])}
                                                />
                                            )}
                                            <SensorLine
                                                data={history}
                                                dataKey={key}
                                            />
                                        </Card>
                                    ))}
                                </div>
                            </ScrollArea>
                        </div>
                    </div>
                )}

                {/* ── Last updated ──────────────────────────────────── */}
                {latest && (
                    <p className="text-right text-xs font-semibold tracking-widest text-amber-900/30 uppercase">
                        Last reading: {latest.recorded_at}
                    </p>
                )}
            </div>
        </AdminLayout>
    );
}
