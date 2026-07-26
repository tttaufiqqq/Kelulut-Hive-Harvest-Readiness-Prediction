import { ChartDateFilter } from '@/components/core/chart-date-filter/ChartDateFilter';
import type { ChartDateFilterValue } from '@/components/core/chart-date-filter/types';

interface ChartsFilterBarProps {
    value: ChartDateFilterValue;
    defaultDate: string;
    onChange: (value: ChartDateFilterValue) => void;
}

export function ChartsFilterBar({ value, defaultDate, onChange }: ChartsFilterBarProps) {
    return (
        <div className="flex flex-col gap-3 rounded-3xl border border-yellow-100 bg-white px-4 py-4 shadow-sm sm:flex-row sm:items-center sm:justify-between sm:px-5">
            <div>
                <p className="text-[10px] font-black tracking-widest text-amber-900/45 uppercase">Chart Filter</p>
                <p className="mt-1 text-sm text-amber-700">Choose a date or a week to update both trend charts together.</p>
            </div>
            <ChartDateFilter value={value} defaultDate={defaultDate} onChange={onChange} />
        </div>
    );
}
