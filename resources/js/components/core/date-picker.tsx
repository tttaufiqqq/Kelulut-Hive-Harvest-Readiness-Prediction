import { Calendar, ChevronLeft, ChevronRight, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { cn } from '@/lib/utils';

type PickerMode = 'day' | 'month';

interface DatePickerProps {
    value: string | null;
    onChange: (date: string | null) => void;
    defaultValue?: string;
    className?: string;
    mode?: PickerMode;
    placeholder?: string;
}

interface DatePickerFieldProps {
    label?: string;
    value: string | null;
    onChange: (date: string | null) => void;
    placeholder?: string;
    error?: string;
    maxDate?: 'today';
    mode?: PickerMode;
    defaultValue?: string;
    clearable?: boolean;
}

const DAY_HEADERS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
const MONTH_LABELS = [
    'Jan',
    'Feb',
    'Mar',
    'Apr',
    'May',
    'Jun',
    'Jul',
    'Aug',
    'Sep',
    'Oct',
    'Nov',
    'Dec',
];

function pad(value: number) {
    return String(value).padStart(2, '0');
}

function parsePickerValue(value: string | null, mode: PickerMode) {
    if (!value) {
        return new Date();
    }

    const normalized =
        mode === 'month' ? `${value}-01T00:00:00` : `${value}T00:00:00`;
    const parsed = new Date(normalized);

    return Number.isNaN(parsed.getTime()) ? new Date() : parsed;
}

function formatPickerValue(
    year: number,
    month: number,
    day: number | null,
    mode: PickerMode,
) {
    if (mode === 'month') {
        return `${year}-${pad(month + 1)}`;
    }

    return `${year}-${pad(month + 1)}-${pad(day ?? 1)}`;
}

function formatDisplayValue(value: string | null, mode: PickerMode) {
    if (!value) {
        return null;
    }

    const parsed = parsePickerValue(value, mode);

    return parsed.toLocaleDateString('en-GB', {
        ...(mode === 'day'
            ? { day: 'numeric', month: 'short', year: 'numeric' }
            : { month: 'short', year: 'numeric' }),
    });
}

function getHeaderLabel(viewDate: Date, mode: PickerMode) {
    return mode === 'month'
        ? String(viewDate.getFullYear())
        : viewDate.toLocaleString('default', {
              month: 'long',
              year: 'numeric',
          });
}

function isFutureMonth(year: number, month: number, today: Date) {
    return (
        year > today.getFullYear() ||
        (year === today.getFullYear() && month > today.getMonth())
    );
}

function buildMenuStyle(trigger: HTMLButtonElement, mode: PickerMode) {
    const rect = trigger.getBoundingClientRect();
    const viewportPadding = 12;
    const minWidth = 288;
    const width = Math.min(
        Math.max(rect.width, minWidth),
        window.innerWidth - viewportPadding * 2,
    );
    const estimatedHeight = mode === 'month' ? 260 : 320;
    const belowTop = rect.bottom + 8;
    const fitsBelow =
        belowTop + estimatedHeight <= window.innerHeight - viewportPadding;
    const top = fitsBelow
        ? belowTop
        : Math.max(viewportPadding, rect.top - estimatedHeight - 8);
    const left = Math.min(
        Math.max(viewportPadding, rect.left),
        Math.max(viewportPadding, window.innerWidth - width - viewportPadding),
    );

    return {
        position: 'fixed',
        top,
        left,
        width,
        zIndex: 9999,
    } satisfies React.CSSProperties;
}

function renderMonthGrid({
    value,
    year,
    today,
    onSelect,
    restrictToToday,
}: {
    value: string | null;
    year: number;
    today: Date;
    onSelect: (month: number) => void;
    restrictToToday: boolean;
}) {
    return (
        <div className="grid grid-cols-3 gap-2">
            {MONTH_LABELS.map((label, monthIndex) => {
                const selected =
                    value ===
                    formatPickerValue(year, monthIndex, null, 'month');
                const future =
                    restrictToToday && isFutureMonth(year, monthIndex, today);

                return (
                    <button
                        key={`${year}-${label}`}
                        type="button"
                        onClick={() => onSelect(monthIndex)}
                        disabled={future}
                        className={cn(
                            'flex h-10 items-center justify-center rounded-2xl text-sm transition-colors',
                            selected &&
                                'bg-yellow-400 font-black text-amber-950',
                            !selected &&
                                !future &&
                                'font-medium text-amber-900 hover:bg-yellow-50',
                            future &&
                                'cursor-not-allowed font-medium text-amber-900/20',
                        )}
                    >
                        {label}
                    </button>
                );
            })}
        </div>
    );
}

export function DatePicker({
    value,
    onChange,
    defaultValue,
    className,
    mode = 'day',
    placeholder,
}: DatePickerProps) {
    const today = new Date();
    today.setHours(23, 59, 59, 999);

    const [open, setOpen] = useState(false);
    const [viewDate, setViewDate] = useState(() =>
        parsePickerValue(value, mode),
    );
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (ref.current && !ref.current.contains(e.target as Node)) {
                setOpen(false);
            }
        };
        document.addEventListener('mousedown', handler);

        return () => document.removeEventListener('mousedown', handler);
    }, []);

    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();
    const headerLabel = getHeaderLabel(viewDate, mode);
    const displayLabel = formatDisplayValue(value, mode);
    const hasCustomValue = Boolean(value && value !== defaultValue);

    const firstOffset = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const cells: (number | null)[] = [
        ...Array(firstOffset).fill(null),
        ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
    ];

    while (cells.length % 7 !== 0) {
        cells.push(null);
    }

    const prevView = () =>
        setViewDate(
            mode === 'month'
                ? new Date(year - 1, month, 1)
                : new Date(year, month - 1, 1),
        );
    const nextView = () => {
        if (mode === 'month') {
            if (year < today.getFullYear()) {
                setViewDate(new Date(year + 1, month, 1));
            }

            return;
        }

        const next = new Date(year, month + 1, 1);

        if (
            next.getFullYear() < today.getFullYear() ||
            (next.getFullYear() === today.getFullYear() &&
                next.getMonth() <= today.getMonth())
        ) {
            setViewDate(next);
        }
    };
    const isNextDisabled =
        mode === 'month'
            ? year >= today.getFullYear()
            : year > today.getFullYear() ||
              (year === today.getFullYear() && month >= today.getMonth());

    const selectDay = (day: number) => {
        const nextValue = formatPickerValue(year, month, day, 'day');

        if (new Date(`${nextValue}T00:00:00`) > today) {
            return;
        }

        onChange(nextValue);
        setOpen(false);
    };
    const selectMonth = (monthIndex: number) => {
        if (isFutureMonth(year, monthIndex, today)) {
            return;
        }

        onChange(formatPickerValue(year, monthIndex, null, 'month'));
        setOpen(false);
    };

    return (
        <div ref={ref} className={cn('relative inline-block', className)}>
            <button
                type="button"
                onClick={() => setOpen((o) => !o)}
                className={cn(
                    'flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl border border-yellow-200 bg-yellow-50/50 px-4 py-2.5 text-sm whitespace-nowrap transition-all',
                    'focus:ring-2 focus:ring-yellow-400/50 focus:outline-none',
                    open && 'ring-2 ring-yellow-400/50',
                    hasCustomValue
                        ? 'border-yellow-400 bg-yellow-400/15 text-amber-900'
                        : value
                          ? 'text-amber-950'
                          : 'text-amber-900/40 hover:bg-yellow-50',
                )}
            >
                <Calendar
                    className={cn(
                        'h-4 w-4 shrink-0',
                        hasCustomValue ? 'text-amber-900' : 'text-amber-900/40',
                    )}
                />
                <span>
                    {displayLabel ??
                        placeholder ??
                        (mode === 'month' ? 'Select month' : 'Select date')}
                </span>
            </button>

            {hasCustomValue && (
                <button
                    type="button"
                    onClick={(event) => {
                        event.stopPropagation();
                        onChange(null);
                    }}
                    className="absolute -top-2 -right-2 flex h-5 w-5 items-center justify-center rounded-full bg-amber-900 transition-colors hover:bg-amber-700"
                    aria-label={mode === 'month' ? 'Clear month' : 'Clear date'}
                >
                    <X className="h-3 w-3 text-white" />
                </button>
            )}

            {open && (
                <div className="absolute top-full left-0 z-30 mt-2 w-72 rounded-2xl border border-yellow-100 bg-white p-4 shadow-lg">
                    <div className="mb-4 flex items-center justify-between">
                        <button
                            type="button"
                            onClick={prevView}
                            className="rounded-xl p-1.5 transition-colors hover:bg-yellow-50"
                        >
                            <ChevronLeft className="h-4 w-4 text-amber-900" />
                        </button>
                        <span className="text-sm font-black text-amber-900">
                            {headerLabel}
                        </span>
                        <button
                            type="button"
                            onClick={nextView}
                            disabled={isNextDisabled}
                            className="rounded-xl p-1.5 transition-colors hover:bg-yellow-50 disabled:cursor-not-allowed disabled:opacity-25"
                        >
                            <ChevronRight className="h-4 w-4 text-amber-900" />
                        </button>
                    </div>

                    {mode === 'month' ? (
                        renderMonthGrid({
                            value,
                            year,
                            today,
                            onSelect: selectMonth,
                            restrictToToday: true,
                        })
                    ) : (
                        <>
                            <div className="mb-1 grid grid-cols-7">
                                {DAY_HEADERS.map((header) => (
                                    <div
                                        key={header}
                                        className="py-1 text-center text-[10px] font-black tracking-widest text-amber-900/40 uppercase"
                                    >
                                        {header}
                                    </div>
                                ))}
                            </div>

                            <div className="grid grid-cols-7 gap-y-1">
                                {cells.map((day, index) => {
                                    if (!day) {
                                        return <div key={index} />;
                                    }

                                    const dateValue = formatPickerValue(
                                        year,
                                        month,
                                        day,
                                        'day',
                                    );
                                    const future =
                                        new Date(`${dateValue}T00:00:00`) >
                                        today;
                                    const selected = value === dateValue;
                                    const todayDay =
                                        new Date(
                                            year,
                                            month,
                                            day,
                                        ).toDateString() ===
                                        new Date().toDateString();

                                    return (
                                        <button
                                            key={index}
                                            type="button"
                                            onClick={() => selectDay(day)}
                                            disabled={future}
                                            className={cn(
                                                'mx-auto flex h-8 w-8 items-center justify-center rounded-xl text-sm transition-colors',
                                                selected &&
                                                    'bg-yellow-400 font-black text-amber-950',
                                                !selected &&
                                                    todayDay &&
                                                    'bg-yellow-100 font-bold text-amber-900',
                                                !selected &&
                                                    !todayDay &&
                                                    !future &&
                                                    'font-medium text-amber-900 hover:bg-yellow-50',
                                                future &&
                                                    'cursor-not-allowed font-medium text-amber-900/20',
                                            )}
                                        >
                                            {day}
                                        </button>
                                    );
                                })}
                            </div>
                        </>
                    )}
                </div>
            )}
        </div>
    );
}

export function DatePickerField({
    label,
    value,
    onChange,
    placeholder,
    error,
    maxDate,
    mode = 'day',
    defaultValue,
    clearable = false,
}: DatePickerFieldProps) {
    const today = new Date();
    today.setHours(23, 59, 59, 999);

    const [open, setOpen] = useState(false);
    const [viewDate, setViewDate] = useState(() =>
        parsePickerValue(value, mode),
    );
    const [menuStyle, setMenuStyle] = useState<React.CSSProperties>({});
    const triggerRef = useRef<HTMLButtonElement>(null);
    const menuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handler = (e: MouseEvent) => {
            const target = e.target as Node;

            if (
                !triggerRef.current?.contains(target) &&
                !menuRef.current?.contains(target)
            ) {
                setOpen(false);
            }
        };
        document.addEventListener('mousedown', handler);

        return () => document.removeEventListener('mousedown', handler);
    }, []);

    useEffect(() => {
        if (!open || typeof window === 'undefined') {
            return;
        }

        if (triggerRef.current) {
            setMenuStyle(buildMenuStyle(triggerRef.current, mode));
        }

        const syncMenuPosition = () => {
            if (triggerRef.current) {
                setMenuStyle(buildMenuStyle(triggerRef.current, mode));
            }
        };

        window.addEventListener('resize', syncMenuPosition);
        window.addEventListener('scroll', syncMenuPosition, true);

        return () => {
            window.removeEventListener('resize', syncMenuPosition);
            window.removeEventListener('scroll', syncMenuPosition, true);
        };
    }, [open, mode]);

    const handleOpen = () => {
        if (!open && triggerRef.current && typeof window !== 'undefined') {
            setMenuStyle(buildMenuStyle(triggerRef.current, mode));
        }

        setOpen((o) => !o);
    };

    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();
    const headerLabel = getHeaderLabel(viewDate, mode);
    const displayLabel = formatDisplayValue(value, mode);
    const hasCustomValue = Boolean(value && value !== defaultValue);

    const firstOffset = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const cells: (number | null)[] = [
        ...Array(firstOffset).fill(null),
        ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
    ];

    while (cells.length % 7 !== 0) {
        cells.push(null);
    }

    const prevView = () =>
        setViewDate(
            mode === 'month'
                ? new Date(year - 1, month, 1)
                : new Date(year, month - 1, 1),
        );
    const nextView = () => {
        if (mode === 'month') {
            const nextYear = year + 1;

            if (maxDate !== 'today' || nextYear <= today.getFullYear()) {
                setViewDate(new Date(nextYear, month, 1));
            }

            return;
        }

        const next = new Date(year, month + 1, 1);

        if (
            maxDate !== 'today' ||
            next.getFullYear() < today.getFullYear() ||
            (next.getFullYear() === today.getFullYear() &&
                next.getMonth() <= today.getMonth())
        ) {
            setViewDate(next);
        }
    };
    const isNextDisabled =
        maxDate === 'today' &&
        (mode === 'month'
            ? year >= today.getFullYear()
            : year > today.getFullYear() ||
              (year === today.getFullYear() && month >= today.getMonth()));

    const selectDay = (day: number) => {
        const nextValue = formatPickerValue(year, month, day, 'day');

        if (maxDate === 'today' && new Date(`${nextValue}T00:00:00`) > today) {
            return;
        }

        onChange(nextValue);
        setOpen(false);
    };
    const selectMonth = (monthIndex: number) => {
        if (maxDate === 'today' && isFutureMonth(year, monthIndex, today)) {
            return;
        }

        onChange(formatPickerValue(year, monthIndex, null, 'month'));
        setOpen(false);
    };

    return (
        <div className="w-full space-y-1.5">
            {label && (
                <label className="ml-1 text-sm font-medium text-amber-900">
                    {label}
                </label>
            )}

            <div className="relative">
                <button
                    ref={triggerRef}
                    type="button"
                    onClick={handleOpen}
                    className={cn(
                        'flex min-h-12 w-full items-center gap-2 rounded-2xl border border-yellow-200 bg-yellow-50/50 px-4 py-2.5 text-left text-sm transition-all focus:outline-none',
                        open && 'ring-2 ring-yellow-400/50',
                        hasCustomValue && clearable && 'border-yellow-400 bg-yellow-400/15',
                        error && 'border-red-400 focus:ring-red-400/50',
                    )}
                >
                    <Calendar className="h-4 w-4 flex-shrink-0 text-amber-900/40" />
                    <span
                        className={cn(
                            'truncate',
                            displayLabel
                                ? 'text-amber-950'
                                : 'text-amber-900/40',
                        )}
                    >
                        {displayLabel ??
                            placeholder ??
                            (mode === 'month'
                                ? 'Select month'
                                : 'Select date...')}
                    </span>
                </button>

                {hasCustomValue && clearable && (
                    <button
                        type="button"
                        onClick={(event) => {
                            event.stopPropagation();
                            onChange(null);
                        }}
                        className="absolute -top-2 -right-2 flex h-5 w-5 items-center justify-center rounded-full bg-amber-900 transition-colors hover:bg-amber-700"
                        aria-label={
                            mode === 'month' ? 'Clear month' : 'Clear date'
                        }
                    >
                        <X className="h-3 w-3 text-white" />
                    </button>
                )}
            </div>

            {error && <p className="ml-1 text-xs text-red-500">{error}</p>}

            {typeof document !== 'undefined' &&
                createPortal(
                    open ? (
                        <div
                            ref={menuRef}
                            style={menuStyle}
                            className="max-w-[calc(100vw-1.5rem)] rounded-2xl border border-yellow-100 bg-white p-4 shadow-xl"
                        >
                            <div className="mb-4 flex items-center justify-between">
                                <button
                                    type="button"
                                    onClick={prevView}
                                    className="rounded-xl p-1.5 transition-colors hover:bg-yellow-50"
                                >
                                    <ChevronLeft className="h-4 w-4 text-amber-900" />
                                </button>
                                <span className="text-sm font-black text-amber-900">
                                    {headerLabel}
                                </span>
                                <button
                                    type="button"
                                    onClick={nextView}
                                    disabled={isNextDisabled}
                                    className="rounded-xl p-1.5 transition-colors hover:bg-yellow-50 disabled:cursor-not-allowed disabled:opacity-25"
                                >
                                    <ChevronRight className="h-4 w-4 text-amber-900" />
                                </button>
                            </div>

                            {mode === 'month' ? (
                                renderMonthGrid({
                                    value,
                                    year,
                                    today,
                                    onSelect: selectMonth,
                                    restrictToToday: maxDate === 'today',
                                })
                            ) : (
                                <>
                                    <div className="mb-1 grid grid-cols-7">
                                        {DAY_HEADERS.map((header) => (
                                            <div
                                                key={header}
                                                className="py-1 text-center text-[10px] font-black tracking-widest text-amber-900/40 uppercase"
                                            >
                                                {header}
                                            </div>
                                        ))}
                                    </div>

                                    <div className="grid grid-cols-7 gap-y-1">
                                        {cells.map((day, index) => {
                                            if (!day) {
                                                return <div key={index} />;
                                            }

                                            const dateValue = formatPickerValue(
                                                year,
                                                month,
                                                day,
                                                'day',
                                            );
                                            const future =
                                                maxDate === 'today' &&
                                                new Date(
                                                    `${dateValue}T00:00:00`,
                                                ) > today;
                                            const selected =
                                                value === dateValue;
                                            const todayDay =
                                                new Date(
                                                    year,
                                                    month,
                                                    day,
                                                ).toDateString() ===
                                                new Date().toDateString();

                                            return (
                                                <button
                                                    key={index}
                                                    type="button"
                                                    onClick={() =>
                                                        selectDay(day)
                                                    }
                                                    disabled={future}
                                                    className={cn(
                                                        'mx-auto flex h-8 w-8 items-center justify-center rounded-xl text-sm transition-colors',
                                                        selected &&
                                                            'bg-yellow-400 font-black text-amber-950',
                                                        !selected &&
                                                            todayDay &&
                                                            'bg-yellow-100 font-bold text-amber-900',
                                                        !selected &&
                                                            !todayDay &&
                                                            !future &&
                                                            'font-medium text-amber-900 hover:bg-yellow-50',
                                                        future &&
                                                            'cursor-not-allowed text-amber-900/20',
                                                    )}
                                                >
                                                    {day}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </>
                            )}
                        </div>
                    ) : null,
                    document.body,
                )}
        </div>
    );
}
