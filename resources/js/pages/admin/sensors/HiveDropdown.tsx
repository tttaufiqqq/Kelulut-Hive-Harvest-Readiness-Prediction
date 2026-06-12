import { Check, ChevronDown } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import type { Hive } from './types';

export interface HiveDropdownProps {
    hives: Hive[];
    selected: number;
    onSelect: (id: number) => void;
}

export function HiveDropdown({ hives, selected, onSelect }: HiveDropdownProps) {
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
            <button onClick={() => setOpen((o) => !o)} className="flex w-full min-w-0 items-center justify-between gap-3 rounded-xl border border-yellow-200 bg-white px-4 py-2.5 text-sm font-semibold text-amber-900 transition-colors hover:bg-yellow-50/50 sm:min-w-[180px]">
                <span className="truncate">{selectedHive?.name ?? 'Select hive'}</span>
                <ChevronDown className={`h-4 w-4 text-amber-900/40 transition-transform ${open ? 'rotate-180' : ''}`} />
            </button>
            {open && (
                <div className="absolute top-full left-0 z-20 mt-2 w-full min-w-0 overflow-hidden rounded-2xl border border-yellow-100 bg-white shadow-lg sm:min-w-[180px]">
                    {hives.map((h) => (
                        <button key={h.id} onClick={() => {
 onSelect(h.id); setOpen(false); 
}} className="flex w-full items-center justify-between px-4 py-2.5 text-sm text-amber-900 transition-colors hover:bg-yellow-50/60">
                            <span className={h.id === selected ? 'font-bold' : 'font-medium'}>{h.name}</span>
                            {h.id === selected && <Check className="h-3.5 w-3.5 text-amber-500" />}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}
