import { DatePicker } from '@/components/core/date-picker';
import { SelectField } from '@/components/core/form/select-field';
import { cn } from '@/lib/utils';
import type { ChartDateFilterValue } from './types';
import { calendarWeeksForMonth, weekContaining } from './weeks';

interface ChartDateFilterProps {
    value: ChartDateFilterValue;
    defaultDate: string;
    onChange: (value: ChartDateFilterValue) => void;
    className?: string;
}

export function ChartDateFilter({ value, defaultDate, onChange, className }: ChartDateFilterProps) {
    const defaultWeek = weekContaining(defaultDate);
    const weeks = calendarWeeksForMonth(value.type === 'week' ? value.month : defaultWeek.month);

    function switchToDate() {
        if (value.type === 'date') {
            return;
        }

        const currentWeek = calendarWeeksForMonth(value.month).find((w) => w.week === value.week);
        onChange({ type: 'date', date: currentWeek?.start ?? defaultDate });
    }

    function switchToWeek() {
        if (value.type === 'week') {
            return;
        }

        const target = weekContaining(value.date);
        onChange({ type: 'week', month: target.month, week: target.week });
    }

    function handleMonthChange(month: string | null) {
        if (!month) {
            return;
        }

        const monthWeeks = calendarWeeksForMonth(month);
        onChange({ type: 'week', month, week: monthWeeks[0]?.week ?? 1 });
    }

    function handleWeekChange(week: string) {
        if (value.type !== 'week') {
            return;
        }

        onChange({ type: 'week', month: value.month, week: Number(week) });
    }

    return (
        <div className={cn('flex flex-col gap-2 sm:flex-row sm:items-center', className)}>
            <div className="grid grid-cols-2 gap-1 rounded-2xl bg-yellow-100/50 p-1.5 sm:w-[220px]">
                <button type="button" onClick={switchToDate} className={cn('rounded-xl px-2 py-2 text-xs font-semibold transition-all', value.type === 'date' ? 'bg-white text-amber-900 shadow-sm' : 'text-amber-900/60 hover:bg-yellow-200/50')}>
                    Specific Date
                </button>
                <button type="button" onClick={switchToWeek} className={cn('rounded-xl px-2 py-2 text-xs font-semibold transition-all', value.type === 'week' ? 'bg-white text-amber-900 shadow-sm' : 'text-amber-900/60 hover:bg-yellow-200/50')}>
                    Specific Week
                </button>
            </div>

            {value.type === 'date' ? (
                <DatePicker className="w-full sm:w-[160px]" value={value.date} onChange={(date) => onChange({ type: 'date', date: date ?? defaultDate })} defaultValue={defaultDate} />
            ) : (
                <div className="grid grid-cols-2 gap-2 sm:flex">
                    <DatePicker className="w-full sm:w-[140px]" mode="month" value={value.month} onChange={handleMonthChange} defaultValue={defaultWeek.month} />
                    <SelectField className="sm:w-[220px]" value={value.week} onChange={handleWeekChange} options={weeks.map((w) => ({ value: w.week, label: w.label }))} />
                </div>
            )}
        </div>
    );
}
