import React from 'react';
import { Minus, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';

interface NumberInputProps {
    label?:    string;
    value:     string | number;
    onChange:  (value: string) => void;
    min?:      number;
    max?:      number;
    step?:     number;
    placeholder?: string;
    error?:    string;
    disabled?: boolean;
    unit?:     string;
}

export function NumberInput({
    label, value, onChange, min, max, step = 1, placeholder, error, disabled, unit,
}: NumberInputProps) {
    const numVal = parseFloat(String(value));

    const clamp = (v: number) => {
        if (!isNaN(min as number) && v < (min as number)) return min as number;
        if (!isNaN(max as number) && v > (max as number)) return max as number;
        return v;
    };

    const increment = () => {
        const next = clamp(isNaN(numVal) ? (min ?? 0) + step : numVal + step);
        onChange(String(step < 1 ? next.toFixed(2) : next));
    };

    const decrement = () => {
        const next = clamp(isNaN(numVal) ? (min ?? 0) : numVal - step);
        onChange(String(step < 1 ? next.toFixed(2) : next));
    };

    return (
        <div className="space-y-1.5 w-full">
            {label && (
                <label className="text-sm font-medium text-amber-900 ml-1">{label}</label>
            )}

            <div className={cn(
                'flex items-center bg-yellow-50/50 border border-yellow-200 rounded-2xl overflow-hidden transition-all',
                'focus-within:ring-2 focus-within:ring-yellow-400/50',
                error && 'border-red-400 focus-within:ring-red-400/50',
            )}>
                <button
                    type="button"
                    onClick={decrement}
                    disabled={disabled || (!isNaN(min as number) && numVal <= (min as number))}
                    className="px-3 py-2.5 text-amber-900/50 hover:text-amber-900 hover:bg-yellow-100 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                >
                    <Minus className="w-3.5 h-3.5" />
                </button>

                <input
                    type="number"
                    value={value}
                    onChange={e => onChange(e.target.value)}
                    min={min}
                    max={max}
                    step={step}
                    placeholder={placeholder}
                    disabled={disabled}
                    className="flex-1 min-w-0 bg-transparent px-2 py-2.5 text-sm text-amber-950 text-center focus:outline-none placeholder:text-amber-900/30 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                />

                {unit && (
                    <span className="text-xs text-amber-900/40 font-medium pr-2">{unit}</span>
                )}

                <button
                    type="button"
                    onClick={increment}
                    disabled={disabled || (!isNaN(max as number) && numVal >= (max as number))}
                    className="px-3 py-2.5 text-amber-900/50 hover:text-amber-900 hover:bg-yellow-100 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                >
                    <Plus className="w-3.5 h-3.5" />
                </button>
            </div>

            {error && <p className="text-xs text-red-500 ml-1">{error}</p>}
        </div>
    );
}
