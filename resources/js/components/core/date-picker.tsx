import { Calendar, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { cn } from '@/lib/utils';
import { CalendarGrid } from './date-picker/CalendarGrid';
import { buildMenuStyle, formatDisplayValue, formatPickerValue, getHeaderLabel, isFutureMonth, parsePickerValue } from './date-picker/utils';
import type { PickerMode } from './date-picker/utils';

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

export function DatePicker({ value, onChange, defaultValue, className, mode = 'day', placeholder }: DatePickerProps) {
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    const [open, setOpen] = useState(false);
    const [viewDate, setViewDate] = useState(() => parsePickerValue(value, mode));
    const [menuStyle, setMenuStyle] = useState<React.CSSProperties>({});
    const triggerRef = useRef<HTMLButtonElement>(null);
    const menuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const h = (e: MouseEvent | TouchEvent) => {
            const t = (e instanceof TouchEvent ? e.touches[0]?.target : e.target) as Node;
            if (!triggerRef.current?.contains(t) && !menuRef.current?.contains(t)) setOpen(false);
        };
        document.addEventListener('mousedown', h);
        document.addEventListener('touchstart', h as EventListener);
        return () => { document.removeEventListener('mousedown', h); document.removeEventListener('touchstart', h as EventListener); };
    }, []);

    useEffect(() => {
        if (!open || typeof window === 'undefined') return;
        const sync = () => { if (triggerRef.current) setMenuStyle(buildMenuStyle(triggerRef.current, mode)); };
        sync();
        window.addEventListener('resize', sync);
        window.addEventListener('scroll', sync, true);
        return () => { window.removeEventListener('resize', sync); window.removeEventListener('scroll', sync, true); };
    }, [open, mode]);

    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();
    const headerLabel = getHeaderLabel(viewDate, mode);
    const displayLabel = formatDisplayValue(value, mode);
    const hasCustomValue = Boolean(value && value !== defaultValue);
    const prevView = () => setViewDate(mode === 'month' ? new Date(year - 1, month, 1) : new Date(year, month - 1, 1));
    const nextView = () => {
        if (mode === 'month') { if (year < today.getFullYear()) setViewDate(new Date(year + 1, month, 1)); return; }
        const next = new Date(year, month + 1, 1);
        if (next.getFullYear() < today.getFullYear() || (next.getFullYear() === today.getFullYear() && next.getMonth() <= today.getMonth())) setViewDate(next);
    };
    const isNextDisabled = mode === 'month' ? year >= today.getFullYear() : year > today.getFullYear() || (year === today.getFullYear() && month >= today.getMonth());
    const selectDay = (day: number) => { const v = formatPickerValue(year, month, day, 'day'); if (new Date(`${v}T00:00:00`) > today) return; onChange(v); setOpen(false); };
    const selectMonth = (mi: number) => { if (isFutureMonth(year, mi, today)) return; onChange(formatPickerValue(year, mi, null, 'month')); setOpen(false); };
    const handleOpen = () => { if (!open && triggerRef.current && typeof window !== 'undefined') setMenuStyle(buildMenuStyle(triggerRef.current, mode)); setOpen((o) => !o); };

    return (
        <div className={cn('relative inline-block', className)}>
            <button ref={triggerRef} type="button" onClick={handleOpen} className={cn(
                'flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl border border-yellow-200 bg-yellow-50/50 px-4 py-2.5 text-sm whitespace-nowrap transition-all focus:ring-2 focus:ring-yellow-400/50 focus:outline-none',
                open && 'ring-2 ring-yellow-400/50',
                hasCustomValue ? 'border-yellow-400 bg-yellow-400/15 text-amber-900' : value ? 'text-amber-950' : 'text-amber-900/40 hover:bg-yellow-50')}>
                <Calendar className={cn('h-4 w-4 shrink-0', hasCustomValue ? 'text-amber-900' : 'text-amber-900/40')} />
                <span>{displayLabel ?? placeholder ?? (mode === 'month' ? 'Select month' : 'Select date')}</span>
            </button>
            {hasCustomValue && (
                <button type="button" onClick={(e) => { e.stopPropagation(); onChange(null); }} className="absolute -top-2 -right-2 flex h-5 w-5 items-center justify-center rounded-full bg-amber-900 transition-colors hover:bg-amber-700" aria-label={mode === 'month' ? 'Clear month' : 'Clear date'}>
                    <X className="h-3 w-3 text-white" />
                </button>
            )}
            {typeof document !== 'undefined' && createPortal(
                open ? (
                    <div ref={menuRef} style={menuStyle} className="max-w-[calc(100vw-1.5rem)] rounded-2xl border border-yellow-100 bg-white p-4 shadow-xl">
                        <CalendarGrid viewDate={viewDate} mode={mode} value={value} maxDate="today" today={today} headerLabel={headerLabel} isNextDisabled={isNextDisabled} onDaySelect={selectDay} onMonthSelect={selectMonth} onPrevMonth={prevView} onNextMonth={nextView} />
                    </div>
                ) : null,
                document.body,
            )}
        </div>
    );
}

export function DatePickerField({ label, value, onChange, placeholder, error, maxDate, mode = 'day', defaultValue, clearable = false }: DatePickerFieldProps) {
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    const [open, setOpen] = useState(false);
    const [viewDate, setViewDate] = useState(() => parsePickerValue(value, mode));
    const [menuStyle, setMenuStyle] = useState<React.CSSProperties>({});
    const triggerRef = useRef<HTMLButtonElement>(null);
    const menuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const h = (e: MouseEvent | TouchEvent) => {
            const t = (e instanceof TouchEvent ? e.touches[0]?.target : e.target) as Node;
            if (!triggerRef.current?.contains(t) && !menuRef.current?.contains(t)) setOpen(false);
        };
        document.addEventListener('mousedown', h);
        document.addEventListener('touchstart', h as EventListener);
        return () => { document.removeEventListener('mousedown', h); document.removeEventListener('touchstart', h as EventListener); };
    }, []);

    useEffect(() => {
        if (!open || typeof window === 'undefined') return;
        const sync = () => { if (triggerRef.current) setMenuStyle(buildMenuStyle(triggerRef.current, mode)); };
        sync();
        window.addEventListener('resize', sync);
        window.addEventListener('scroll', sync, true);
        return () => { window.removeEventListener('resize', sync); window.removeEventListener('scroll', sync, true); };
    }, [open, mode]);

    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();
    const headerLabel = getHeaderLabel(viewDate, mode);
    const displayLabel = formatDisplayValue(value, mode);
    const hasCustomValue = Boolean(value && value !== defaultValue);
    const handleOpen = () => { if (!open && triggerRef.current && typeof window !== 'undefined') setMenuStyle(buildMenuStyle(triggerRef.current, mode)); setOpen((o) => !o); };
    const prevView = () => setViewDate(mode === 'month' ? new Date(year - 1, month, 1) : new Date(year, month - 1, 1));
    const nextView = () => {
        if (mode === 'month') { if (maxDate !== 'today' || year + 1 <= today.getFullYear()) setViewDate(new Date(year + 1, month, 1)); return; }
        const next = new Date(year, month + 1, 1);
        if (maxDate !== 'today' || next.getFullYear() < today.getFullYear() || (next.getFullYear() === today.getFullYear() && next.getMonth() <= today.getMonth())) setViewDate(next);
    };
    const isNextDisabled = maxDate === 'today' && (mode === 'month' ? year >= today.getFullYear() : year > today.getFullYear() || (year === today.getFullYear() && month >= today.getMonth()));
    const selectDay = (day: number) => { const v = formatPickerValue(year, month, day, 'day'); if (maxDate === 'today' && new Date(`${v}T00:00:00`) > today) return; onChange(v); setOpen(false); };
    const selectMonth = (mi: number) => { if (maxDate === 'today' && isFutureMonth(year, mi, today)) return; onChange(formatPickerValue(year, mi, null, 'month')); setOpen(false); };

    return (
        <div className="w-full space-y-1.5">
            {label && <label className="ml-1 text-sm font-medium text-amber-900">{label}</label>}
            <div className="relative">
                <button ref={triggerRef} type="button" onClick={handleOpen} className={cn(
                    'flex min-h-12 w-full items-center gap-2 rounded-2xl border border-yellow-200 bg-yellow-50/50 px-4 py-2.5 text-left text-sm transition-all focus:outline-none',
                    open && 'ring-2 ring-yellow-400/50',
                    hasCustomValue && clearable && 'border-yellow-400 bg-yellow-400/15',
                    error && 'border-red-400 focus:ring-red-400/50')}>
                    <Calendar className="h-4 w-4 flex-shrink-0 text-amber-900/40" />
                    <span className={cn('truncate', displayLabel ? 'text-amber-950' : 'text-amber-900/40')}>
                        {displayLabel ?? placeholder ?? (mode === 'month' ? 'Select month' : 'Select date...')}
                    </span>
                </button>
                {hasCustomValue && clearable && (
                    <button type="button" onClick={(e) => { e.stopPropagation(); onChange(null); }} className="absolute -top-2 -right-2 flex h-5 w-5 items-center justify-center rounded-full bg-amber-900 transition-colors hover:bg-amber-700" aria-label={mode === 'month' ? 'Clear month' : 'Clear date'}>
                        <X className="h-3 w-3 text-white" />
                    </button>
                )}
            </div>
            {error && <p className="ml-1 text-xs text-red-500">{error}</p>}
            {typeof document !== 'undefined' && createPortal(
                open ? (
                    <div ref={menuRef} style={menuStyle} className="max-w-[calc(100vw-1.5rem)] rounded-2xl border border-yellow-100 bg-white p-4 shadow-xl">
                        <CalendarGrid viewDate={viewDate} mode={mode} value={value} maxDate={maxDate} today={today} headerLabel={headerLabel} isNextDisabled={isNextDisabled} onDaySelect={selectDay} onMonthSelect={selectMonth} onPrevMonth={prevView} onNextMonth={nextView} />
                    </div>
                ) : null,
                document.body,
            )}
        </div>
    );
}
