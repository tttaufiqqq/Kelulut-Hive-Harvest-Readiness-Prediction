import React from 'react';
import { cn } from '@/lib/utils';

export interface TextareaFieldProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
    label?: string;
    error?: string;
    helperText?: React.ReactNode;
    containerClassName?: string;
}

export const TextareaField = React.forwardRef<
    HTMLTextAreaElement,
    TextareaFieldProps
>(
    (
        {
            label,
            error,
            helperText,
            className,
            containerClassName,
            rows = 3,
            ...props
        },
        ref,
    ) => {
        return (
            <div className={cn('w-full space-y-1.5', containerClassName)}>
                {label && (
                    <label className="ml-1 text-sm font-medium text-amber-900">
                        {label}
                    </label>
                )}
                <textarea
                    ref={ref}
                    rows={rows}
                    className={cn(
                        'w-full rounded-2xl border border-yellow-200 bg-yellow-50/50 px-4 py-2.5 text-sm text-amber-950 transition-all placeholder:text-amber-900/30 focus:ring-2 focus:ring-yellow-400/50 focus:outline-none',
                        'resize-none',
                        error && 'border-red-400 focus:ring-red-400/50',
                        className,
                    )}
                    {...props}
                />
                {error && <p className="ml-1 text-xs text-red-500">{error}</p>}
                {helperText && (
                    <div className="ml-1 text-xs text-amber-900/40">
                        {helperText}
                    </div>
                )}
            </div>
        );
    },
);

TextareaField.displayName = 'TextareaField';
