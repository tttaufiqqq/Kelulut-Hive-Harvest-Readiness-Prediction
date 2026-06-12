import React from 'react';
import { InputError } from '@/components/core/form/input-error';
import { cn } from '@/lib/utils';

export interface AuthFormFieldBlockProps {
    label: React.ReactNode;
    children: React.ReactNode;
    error?: string;
    helperText?: React.ReactNode;
    className?: string;
    htmlFor?: string;
    labelSuffix?: React.ReactNode;
}

export function AuthFormFieldBlock({
    label,
    children,
    error,
    helperText,
    className,
    htmlFor,
    labelSuffix,
}: AuthFormFieldBlockProps) {
    return (
        <div className={cn('space-y-1.5', className)}>
            <label
                htmlFor={htmlFor}
                className="text-xs font-bold tracking-widest text-amber-900/60 uppercase"
            >
                {label}{' '}
                {labelSuffix && (
                    <span className="font-normal text-amber-900/40 normal-case">
                        {labelSuffix}
                    </span>
                )}
            </label>
            {children}
            <InputError message={error} />
            {helperText && (
                <div className="text-xs text-amber-900/40">{helperText}</div>
            )}
        </div>
    );
}

export interface AuthTextInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    icon?: React.ReactNode;
    className?: string;
    containerClassName?: string;
    iconClassName?: string;
}

export const AuthTextInput = React.forwardRef<
    HTMLInputElement,
    AuthTextInputProps
>(
    (
        {
            icon,
            className,
            containerClassName,
            iconClassName,
            readOnly,
            disabled,
            ...props
        },
        ref,
    ) => {
        const isReadOnly = readOnly || disabled;

        return (
            <div className={cn('relative', containerClassName)}>
                {icon && (
                    <div
                        className={cn(
                            'pointer-events-none absolute top-1/2 left-4 -translate-y-1/2 text-amber-400',
                            iconClassName,
                        )}
                    >
                        {icon}
                    </div>
                )}
                <input
                    ref={ref}
                    readOnly={readOnly}
                    disabled={disabled}
                    className={cn(
                        'w-full rounded-2xl border-2 border-amber-100 bg-white px-4 py-3.5 font-medium text-amber-950 transition-colors placeholder:text-amber-300 focus:border-yellow-400 focus:outline-none disabled:cursor-not-allowed disabled:opacity-60',
                        icon && 'pl-11',
                        isReadOnly &&
                            'cursor-not-allowed bg-amber-50 text-amber-900/60 placeholder:text-amber-900/35',
                        className,
                    )}
                    {...props}
                />
            </div>
        );
    },
);

AuthTextInput.displayName = 'AuthTextInput';

export interface AuthHelperListProps {
    items: React.ReactNode[];
    className?: string;
}

export function AuthHelperList({ items, className }: AuthHelperListProps) {
    return (
        <div className={cn('space-y-0.5 text-xs text-amber-900/40', className)}>
            {items.map((item, index) => (
                <p key={index}>{item}</p>
            ))}
        </div>
    );
}
