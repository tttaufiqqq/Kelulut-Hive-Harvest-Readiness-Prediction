import React from 'react';
import { cn } from '@/lib/utils';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    error?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
    ({ label, error, className, ...props }, ref) => {
        return (
            <div className="w-full space-y-1.5">
                {label && (
                    <label className="ml-1 text-sm font-medium text-amber-900">
                        {label}
                    </label>
                )}
                <input
                    ref={ref}
                    className={cn(
                        'w-full rounded-2xl border border-yellow-200 bg-yellow-50/50 px-4 py-2.5 text-amber-950 transition-all placeholder:text-amber-900/30 focus:ring-2 focus:ring-yellow-400/50 focus:outline-none',
                        error && 'border-red-400 focus:ring-red-400/50',
                        className,
                    )}
                    {...props}
                />
                {error && <p className="ml-1 text-xs text-red-500">{error}</p>}
            </div>
        );
    },
);

Input.displayName = 'Input';
