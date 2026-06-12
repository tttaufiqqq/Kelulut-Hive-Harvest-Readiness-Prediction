import { DatePicker } from '@/components/core/date-picker';

interface ChartsFilterBarProps {
    selectedDate: string;
    defaultDate: string;
    onDateChange: (date: string | null) => void;
}

export function ChartsFilterBar({ selectedDate, defaultDate, onDateChange }: ChartsFilterBarProps) {
    return (
        <div className="flex flex-col gap-3 rounded-3xl border border-yellow-100 bg-white px-4 py-4 shadow-sm sm:flex-row sm:items-center sm:justify-between sm:px-5">
            <div>
                <p className="text-[10px] font-black tracking-widest text-amber-900/45 uppercase">Chart Filter</p>
                <p className="mt-1 text-sm text-amber-700">Choose one date to update both trend charts together.</p>
            </div>
            <div className="w-full sm:w-auto">
                <DatePicker className="w-full sm:w-[160px]" value={selectedDate} onChange={onDateChange} defaultValue={defaultDate} maxDate="today" />
            </div>
        </div>
    );
}
