import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatPickerValue, isFutureMonth } from './utils';
import type { PickerMode } from './utils';

const DAY_HEADERS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
const MONTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

interface Props {
    viewDate: Date;
    mode: PickerMode;
    value: string | null;
    maxDate?: 'today';
    today: Date;
    headerLabel: string;
    isNextDisabled: boolean;
    onDaySelect: (day: number) => void;
    onMonthSelect: (month: number) => void;
    onPrevMonth: () => void;
    onNextMonth: () => void;
}

export function CalendarGrid({ viewDate, mode, value, maxDate, today, headerLabel, isNextDisabled, onDaySelect, onMonthSelect, onPrevMonth, onNextMonth }: Props) {
    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();
    const firstOffset = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const cells: (number | null)[] = [...Array(firstOffset).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => i + 1)];

    while (cells.length % 7 !== 0) {
cells.push(null);
}

    return (
        <>
            <div className="mb-4 flex items-center justify-between">
                <button type="button" onClick={onPrevMonth} className="rounded-xl p-1.5 transition-colors hover:bg-yellow-50">
                    <ChevronLeft className="h-4 w-4 text-amber-900" />
                </button>
                <span className="text-sm font-black text-amber-900">{headerLabel}</span>
                <button type="button" onClick={onNextMonth} disabled={isNextDisabled} className="rounded-xl p-1.5 transition-colors hover:bg-yellow-50 disabled:cursor-not-allowed disabled:opacity-25">
                    <ChevronRight className="h-4 w-4 text-amber-900" />
                </button>
            </div>

            {mode === 'month' ? (
                <div className="grid grid-cols-3 gap-2">
                    {MONTH_LABELS.map((label, monthIndex) => {
                        const selected = value === formatPickerValue(year, monthIndex, null, 'month');
                        const future = maxDate === 'today' && isFutureMonth(year, monthIndex, today);

                        return (
                            <button key={`${year}-${label}`} type="button" onClick={() => onMonthSelect(monthIndex)} disabled={future}
                                className={cn('flex h-10 items-center justify-center rounded-2xl text-sm transition-colors',
                                    selected && 'bg-yellow-400 font-black text-amber-950',
                                    !selected && !future && 'font-medium text-amber-900 hover:bg-yellow-50',
                                    future && 'cursor-not-allowed font-medium text-amber-900/20')}>
                                {label}
                            </button>
                        );
                    })}
                </div>
            ) : (
                <>
                    <div className="mb-1 grid grid-cols-7">
                        {DAY_HEADERS.map((header) => (
                            <div key={header} className="py-1 text-center text-[10px] font-black tracking-widest text-amber-900/40 uppercase">{header}</div>
                        ))}
                    </div>
                    <div className="grid grid-cols-7 gap-y-1">
                        {cells.map((day, index) => {
                            if (!day) {
return <div key={index} />;
}

                            const dateValue = formatPickerValue(year, month, day, 'day');
                            const future = maxDate === 'today' && new Date(`${dateValue}T00:00:00`) > today;
                            const selected = value === dateValue;
                            const todayDay = new Date(year, month, day).toDateString() === new Date().toDateString();

                            return (
                                <button key={index} type="button" onClick={() => onDaySelect(day)} disabled={future}
                                    className={cn('mx-auto flex h-8 w-8 items-center justify-center rounded-xl text-sm transition-colors',
                                        selected && 'bg-yellow-400 font-black text-amber-950',
                                        !selected && todayDay && 'bg-yellow-100 font-bold text-amber-900',
                                        !selected && !todayDay && !future && 'font-medium text-amber-900 hover:bg-yellow-50',
                                        future && 'cursor-not-allowed font-medium text-amber-900/20')}>
                                    {day}
                                </button>
                            );
                        })}
                    </div>
                </>
            )}
        </>
    );
}
