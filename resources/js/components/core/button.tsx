import React from 'react';
import { cn } from '@/lib/utils';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'destructive';
    size?: 'sm' | 'md' | 'lg';
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
    ({ className, variant = 'primary', size = 'md', ...props }, ref) => {
        const variants = {
            primary:
                'bg-yellow-400 text-yellow-950 hover:bg-yellow-500 shadow-sm',
            secondary: 'bg-amber-100 text-amber-900 hover:bg-amber-200',
            outline:
                'border-2 border-yellow-400 text-yellow-700 hover:bg-yellow-50',
            ghost: 'hover:bg-yellow-50 text-yellow-700',
            destructive: 'bg-red-500 text-white hover:bg-red-600 shadow-sm',
        };

        const sizes = {
            sm: 'px-3 py-1.5 text-sm',
            md: 'px-6 py-2.5',
            lg: 'px-8 py-4 text-lg font-semibold',
        };

        return (
            <button
                ref={ref}
                className={cn(
                    'inline-flex cursor-pointer items-center justify-center rounded-full font-medium transition-all active:scale-95 disabled:pointer-events-none disabled:opacity-50',
                    variants[variant],
                    sizes[size],
                    className,
                )}
                {...props}
            />
        );
    },
);

Button.displayName = 'Button';
