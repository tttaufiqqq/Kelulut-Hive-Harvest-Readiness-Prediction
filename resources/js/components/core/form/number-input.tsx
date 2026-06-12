import { Minus, Plus } from 'lucide-react';
import React from 'react';
import { cn } from '@/lib/utils';

interface NumberInputProps {
    label?: string;
    value: string | number;
    onChange: (value: string) => void;
    min?: number;
    max?: number;
    step?: number;
    placeholder?: string;
    error?: string;
    disabled?: boolean;
    unit?: string;
}

export function NumberInput({
    label,
    value,
    onChange,
    min,
    max,
    step = 1,
    placeholder,
    error,
    disabled,
    unit,
}: NumberInputProps) {
    const numVal = parseFloat(String(value));

    const clamp = (v: number) => {
        if (!isNaN(min as number) && v < (min as number)) {
            return min as number;
        }

        if (!isNaN(max as number) && v > (max as number)) {
            return max as number;
        }

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
        <div className="w-full space-y-1.5">
            {label && (
                <label className="ml-1 text-sm font-medium text-amber-900">
                    {label}
                </label>
            )}

            <div
                className={cn(
                    'flex items-center overflow-hidden rounded-2xl border border-yellow-200 bg-yellow-50/50 transition-all',
                    'focus-within:ring-2 focus-within:ring-yellow-400/50',
                    error && 'border-red-400 focus-within:ring-red-400/50',
                )}
            >
                <button
                    type="button"
                    onClick={decrement}
                    disabled={
                        disabled ||
                        (!isNaN(min as number) && numVal <= (min as number))
                    }
                    className="px-3 py-2.5 text-amber-900/50 transition-colors hover:bg-yellow-100 hover:text-amber-900 disabled:cursor-not-allowed disabled:opacity-30"
                >
                    <Minus className="h-3.5 w-3.5" />
                </button>

                <input
                    type="number"
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    min={min}
                    max={max}
                    step={step}
                    placeholder={placeholder}
                    disabled={disabled}
                    className="min-w-0 flex-1 [appearance:textfield] bg-transparent px-2 py-2.5 text-center text-sm text-amber-950 placeholder:text-amber-900/30 focus:outline-none [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                />

                {unit && (
                    <span className="pr-2 text-xs font-medium text-amber-900/40">
                        {unit}
                    </span>
                )}

                <button
                    type="button"
                    onClick={increment}
                    disabled={
                        disabled ||
                        (!isNaN(max as number) && numVal >= (max as number))
                    }
                    className="px-3 py-2.5 text-amber-900/50 transition-colors hover:bg-yellow-100 hover:text-amber-900 disabled:cursor-not-allowed disabled:opacity-30"
                >
                    <Plus className="h-3.5 w-3.5" />
                </button>
            </div>

            {error && <p className="ml-1 text-xs text-red-500">{error}</p>}
        </div>
    );
}
