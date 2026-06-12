import React from 'react';
import { cn } from '@/lib/utils';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
    children: React.ReactNode;
    className?: string;
}

export const Card = ({ children, className, ...props }: CardProps) => {
    return (
        <div
            className={cn(
                'rounded-3xl border border-yellow-100 bg-white p-6 shadow-sm',
                className,
            )}
            {...props}
        >
            {children}
        </div>
    );
};
