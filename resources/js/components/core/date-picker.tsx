import { Calendar, ChevronLeft, ChevronRight, X } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { cn } from '@/lib/utils';

interface DatePickerProps {
    value: string | null; // Y-m-d format
    onChange: (date: string | null) => void;
    defaultValue?: string; // when value === defaultValue, hide clear button
    className?: string;
}

const DAY_HEADERS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

export function DatePicker({
    value,
    onChange,
    defaultValue,
    className,
}: DatePickerProps) {
    const today = new Date();
    today.setHours(23, 59, 59, 999);

    const [open, setOpen] = useState(false);
    const [viewDate, setViewDate] = useState(() =>
        value ? new Date(value + 'T00:00:00') : new Date(),
    );
    const ref = useRef<HTMLDivElement>(null);

    // Close on outside click
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

    const monthLabel = viewDate.toLocaleString('default', {
        month: 'long',
        year: 'numeric',
    });
    const firstOffset = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    // Build grid: leading nulls + day numbers, padded to full rows
    const cells: (number | null)[] = [
        ...Array(firstOffset).fill(null),
        ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
    ];

    while (cells.length % 7 !== 0) {
        cells.push(null);
    }

    const toYMD = (d: number) =>
        `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;

    const isFuture = (d: number) => new Date(year, month, d) > today;
    const isSelected = (d: number) => value === toYMD(d);
    const isToday = (d: number) =>
        new Date(year, month, d).toDateString() === new Date().toDateString();

    const prevMonth = () => setViewDate(new Date(year, month - 1, 1));
    const nextMonth = () => {
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
        year > today.getFullYear() ||
        (year === today.getFullYear() && month >= today.getMonth());

    const selectDay = (d: number) => {
        if (isFuture(d)) {
            return;
        }

        onChange(toYMD(d));
        setOpen(false);
    };

    const displayLabel = value
        ? new Date(value + 'T00:00:00').toLocaleDateString('en-GB', {
              day: 'numeric',
              month: 'short',
              year: 'numeric',
          })
        : null;
    const hasCustomValue = Boolean(value && value !== defaultValue);

    return (
        <div ref={ref} className={cn('relative inline-block', className)}>
            {/* ── Trigger ── */}
            <button
                type="button"
                onClick={() => setOpen((o) => !o)}
                className={cn(
                    'flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl border border-yellow-200 bg-yellow-50/50 px-4 py-2.5 text-sm whitespace-nowrap transition-all',
                    value && value !== defaultValue && 'pr-11',
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
                {displayLabel && <span>{displayLabel}</span>}
            </button>

            {/* ── Clear badge ── */}
            {value && value !== defaultValue && (
                <button
                    type="button"
                    onClick={(event) => {
                        event.stopPropagation();
                        onChange(null);
                    }}
                    className="absolute top-1/2 right-3 flex h-5 w-5 -translate-y-1/2 items-center justify-center rounded-full bg-amber-900 transition-colors hover:bg-amber-700"
                    aria-label="Clear date"
                >
                    <X className="h-3 w-3 text-white" />
                </button>
            )}

            {/* ── Dropdown ── */}
            {open && (
                <div className="absolute top-full left-0 z-30 mt-2 w-72 rounded-2xl border border-yellow-100 bg-white p-4 shadow-lg">
                    {/* Month navigation */}
                    <div className="mb-4 flex items-center justify-between">
                        <button
                            onClick={prevMonth}
                            className="rounded-xl p-1.5 transition-colors hover:bg-yellow-50"
                        >
                            <ChevronLeft className="h-4 w-4 text-amber-900" />
                        </button>
                        <span className="text-sm font-black text-amber-900">
                            {monthLabel}
                        </span>
                        <button
                            onClick={nextMonth}
                            disabled={isNextDisabled}
                            className="rounded-xl p-1.5 transition-colors hover:bg-yellow-50 disabled:cursor-not-allowed disabled:opacity-25"
                        >
                            <ChevronRight className="h-4 w-4 text-amber-900" />
                        </button>
                    </div>

                    {/* Day headers */}
                    <div className="mb-1 grid grid-cols-7">
                        {DAY_HEADERS.map((h) => (
                            <div
                                key={h}
                                className="py-1 text-center text-[10px] font-black tracking-widest text-amber-900/40 uppercase"
                            >
                                {h}
                            </div>
                        ))}
                    </div>

                    {/* Day cells */}
                    <div className="grid grid-cols-7 gap-y-1">
                        {cells.map((day, i) => {
                            if (!day) {
                                return <div key={i} />;
                            }

                            const future = isFuture(day);
                            const selected = isSelected(day);
                            const todayDay = isToday(day);

                            return (
                                <button
                                    key={i}
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
                </div>
            )}
        </div>
    );
}

// ── DatePickerField — full-width form field version ──────────────────────────
interface DatePickerFieldProps {
    label?: string;
    value: string | null;
    onChange: (date: string | null) => void;
    placeholder?: string;
    error?: string;
    maxDate?: 'today';
}

export function DatePickerField({
    label,
    value,
    onChange,
    placeholder = 'Select date...',
    error,
    maxDate,
}: DatePickerFieldProps) {
    const today = new Date();
    today.setHours(23, 59, 59, 999);

    const [open, setOpen] = useState(false);
    const [viewDate, setViewDate] = useState(() =>
        value ? new Date(value + 'T00:00:00') : new Date(),
    );
    const [menuStyle, setMenuStyle] = useState<React.CSSProperties>({});
    const triggerRef = useRef<HTMLButtonElement>(null);
    const menuRef = useRef<HTMLDivElement>(null);

    const updateMenuStyle = () => {
        if (!triggerRef.current || typeof window === 'undefined') {
            return;
        }

        const rect = triggerRef.current.getBoundingClientRect();
        const viewportPadding = 12;
        const minWidth = 288;
        const width = Math.min(
            Math.max(rect.width, minWidth),
            window.innerWidth - viewportPadding * 2,
        );
        const estimatedHeight = 320;
        const belowTop = rect.bottom + 8;
        const fitsBelow =
            belowTop + estimatedHeight <=
            window.innerHeight - viewportPadding;
        const top = fitsBelow
            ? belowTop
            : Math.max(viewportPadding, rect.top - estimatedHeight - 8);
        const left = Math.min(
            Math.max(viewportPadding, rect.left),
            Math.max(
                viewportPadding,
                window.innerWidth - width - viewportPadding,
            ),
        );

        setMenuStyle({
            position: 'fixed',
            top,
            left,
            width,
            zIndex: 9999,
        });
    };

    useEffect(() => {
        const handler = (e: MouseEvent) => {
            const t = e.target as Node;

            if (
                !triggerRef.current?.contains(t) &&
                !menuRef.current?.contains(t)
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

        updateMenuStyle();

        const syncMenuPosition = () => updateMenuStyle();

        window.addEventListener('resize', syncMenuPosition);
        window.addEventListener('scroll', syncMenuPosition, true);

        return () => {
            window.removeEventListener('resize', syncMenuPosition);
            window.removeEventListener('scroll', syncMenuPosition, true);
        };
    }, [open]);

    const handleOpen = () => {
        if (!open) {
            updateMenuStyle();
        }

        setOpen((o) => !o);
    };

    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();
    const monthLabel = viewDate.toLocaleString('default', {
        month: 'long',
        year: 'numeric',
    });
    const firstOffset = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const cells: (number | null)[] = [
        ...Array(firstOffset).fill(null),
        ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
    ];

    while (cells.length % 7 !== 0) {
        cells.push(null);
    }

    const toYMD = (d: number) =>
        `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    const isFuture = (d: number) =>
        maxDate === 'today' && new Date(year, month, d) > today;
    const isSelected = (d: number) => value === toYMD(d);
    const isToday = (d: number) =>
        new Date(year, month, d).toDateString() === new Date().toDateString();

    const prevMonth = () => setViewDate(new Date(year, month - 1, 1));
    const nextMonth = () => {
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
        (year > today.getFullYear() ||
            (year === today.getFullYear() && month >= today.getMonth()));

    const selectDay = (d: number) => {
        if (isFuture(d)) {
            return;
        }

        onChange(toYMD(d));
        setOpen(false);
    };

    const displayLabel = value
        ? new Date(value + 'T00:00:00').toLocaleDateString('en-GB', {
              day: 'numeric',
              month: 'short',
              year: 'numeric',
          })
        : null;

    return (
        <div className="w-full space-y-1.5">
            {label && (
                <label className="ml-1 text-sm font-medium text-amber-900">
                    {label}
                </label>
            )}

            <button
                ref={triggerRef}
                type="button"
                onClick={handleOpen}
                className={cn(
                    'flex min-h-12 w-full items-center gap-2 rounded-2xl border border-yellow-200 bg-yellow-50/50 px-4 py-2.5 text-left text-sm transition-all focus:outline-none',
                    open && 'ring-2 ring-yellow-400/50',
                    error && 'border-red-400 focus:ring-red-400/50',
                )}
            >
                <Calendar className="h-4 w-4 flex-shrink-0 text-amber-900/40" />
                <span
                    className={cn(
                        'truncate',
                        displayLabel ? 'text-amber-950' : 'text-amber-900/40'
                    )}
                >
                    {displayLabel ?? placeholder}
                </span>
            </button>

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
                                    onClick={prevMonth}
                                    className="rounded-xl p-1.5 transition-colors hover:bg-yellow-50"
                                >
                                    <ChevronLeft className="h-4 w-4 text-amber-900" />
                                </button>
                                <span className="text-sm font-black text-amber-900">
                                    {monthLabel}
                                </span>
                                <button
                                    onClick={nextMonth}
                                    disabled={isNextDisabled}
                                    className="rounded-xl p-1.5 transition-colors hover:bg-yellow-50 disabled:cursor-not-allowed disabled:opacity-25"
                                >
                                    <ChevronRight className="h-4 w-4 text-amber-900" />
                                </button>
                            </div>

                            <div className="mb-1 grid grid-cols-7">
                                {DAY_HEADERS.map((h) => (
                                    <div
                                        key={h}
                                        className="py-1 text-center text-[10px] font-black tracking-widest text-amber-900/40 uppercase"
                                    >
                                        {h}
                                    </div>
                                ))}
                            </div>

                            <div className="grid grid-cols-7 gap-y-1">
                                {cells.map((day, i) => {
                                    if (!day) {
                                        return <div key={i} />;
                                    }

                                    const future = isFuture(day);
                                    const selected = isSelected(day);
                                    const todayDay = isToday(day);

                                    return (
                                        <button
                                            key={i}
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
                                                    'cursor-not-allowed text-amber-900/20',
                                            )}
                                        >
                                            {day}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    ) : null,
                    document.body,
                )}
        </div>
    );
}
