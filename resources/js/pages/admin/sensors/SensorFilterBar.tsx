import { CalendarDays } from 'lucide-react';
import { DatePicker } from '@/components/core/date-picker';
import { HiveDropdown } from './HiveDropdown';
import type { Hive, NormalizedLatest } from './types';

export interface SensorFilterBarProps {
    hives: Hive[];
    selected: number;
    window: string;
    date: string | null;
    normalizedLatest: NormalizedLatest;
    lastSeen: string | null;
    onHiveChange: (id: number) => void;
    onWindowChange: (w: string) => void;
    onDateChange: (d: string | null) => void;
    onOpenHistory: () => void;
}

const WINDOWS: ('1h' | '6h' | '24h')[] = ['1h', '6h', '24h'];

export function SensorFilterBar({ hives, selected, window, date, normalizedLatest, lastSeen, onHiveChange, onWindowChange, onDateChange, onOpenHistory }: SensorFilterBarProps) {
    const today = new Date().toISOString().slice(0, 10);

    return (
        <div className="grid gap-3 md:flex md:items-center md:justify-between">
            <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto] md:flex md:items-center">
                <HiveDropdown hives={hives} selected={selected} onSelect={onHiveChange} />
                <button onClick={onOpenHistory} className="flex items-center gap-1.5 rounded-xl border border-yellow-200 bg-white px-3 py-2 text-xs font-semibold text-amber-900 transition-colors hover:bg-yellow-50/50">
                    <CalendarDays className="h-3.5 w-3.5 text-amber-600" />
                    Daily History
                </button>
                {normalizedLatest !== null ? (
                    <div className="flex min-h-11 items-center justify-center gap-1.5 rounded-xl bg-emerald-50 px-3 py-1.5 sm:justify-start">
                        <span className="relative flex h-2 w-2">
                            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                            <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
                        </span>
                        <span className="text-xs font-bold text-emerald-700">Live</span>
                    </div>
                ) : (
                    <div className="flex min-h-11 items-center gap-2 rounded-xl bg-gray-50 px-3 py-2 text-left">
                        <span className="mt-0.5 h-2 w-2 flex-shrink-0 rounded-full bg-gray-400" />
                        <span className="text-xs leading-relaxed font-bold text-gray-500">No Data{lastSeen ? ` | Last seen ${lastSeen}` : ''}</span>
                    </div>
                )}
            </div>
            <div className="grid grid-cols-[auto_minmax(0,1fr)] items-center gap-2 sm:flex sm:flex-wrap md:justify-end">
                <DatePicker className="justify-self-start" value={date ?? today} defaultValue={today} onChange={onDateChange} maxDate="today" />
                <div className="grid grid-cols-3 gap-1 rounded-2xl bg-yellow-100/50 p-1.5">
                    {WINDOWS.map((w) => (
                        <button key={w} onClick={() => onWindowChange(w)} className={['rounded-xl px-2 py-2 text-sm font-semibold transition-all sm:px-4 sm:py-1.5', w === window ? 'bg-white text-amber-900 shadow-sm' : 'text-amber-900/60 hover:bg-yellow-200/50'].join(' ')}>
                            {w}
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
}
