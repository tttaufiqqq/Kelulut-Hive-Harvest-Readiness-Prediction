import { AlertCircle, CheckCircle2, Info, X, XCircle } from 'lucide-react';
import { motion } from 'motion/react';
import React from 'react';
import { cn } from '@/lib/utils';

type AlertVariant = 'info' | 'success' | 'warning' | 'error';

interface AlertProps {
    variant?: AlertVariant;
    title?: string;
    children: React.ReactNode;
    onClose?: () => void;
    className?: string;
}

const variants = {
    info: {
        bg: 'bg-blue-50',
        border: 'border-blue-100',
        text: 'text-blue-900',
        icon: <Info className="h-5 w-5 text-blue-500" />,
    },
    success: {
        bg: 'bg-emerald-50',
        border: 'border-emerald-100',
        text: 'text-emerald-900',
        icon: <CheckCircle2 className="h-5 w-5 text-emerald-500" />,
    },
    warning: {
        bg: 'bg-yellow-50',
        border: 'border-yellow-100',
        text: 'text-yellow-900',
        icon: <AlertCircle className="h-5 w-5 text-yellow-500" />,
    },
    error: {
        bg: 'bg-red-50',
        border: 'border-red-100',
        text: 'text-red-900',
        icon: <XCircle className="h-5 w-5 text-red-500" />,
    },
};

export const Alert = ({
    variant = 'info',
    title,
    children,
    onClose,
    className,
}: AlertProps) => {
    const style = variants[variant];

    return (
        <div
            className={cn(
                'flex gap-3 rounded-2xl border p-4',
                style.bg,
                style.border,
                style.text,
                className,
            )}
        >
            <div className="mt-0.5 shrink-0">{style.icon}</div>
            <div className="flex-1 space-y-1">
                {title && <h5 className="leading-none font-bold">{title}</h5>}
                <div className="text-sm leading-relaxed opacity-80">
                    {children}
                </div>
            </div>
            {onClose && (
                <button
                    onClick={onClose}
                    className="shrink-0 transition-opacity hover:opacity-60"
                >
                    <X className="h-4 w-4" />
                </button>
            )}
        </div>
    );
};

export const Progress = ({
    value,
    max = 100,
    className,
    barColor = 'bg-yellow-400',
    showZeroPlaceholder = false,
}: {
    value: number;
    max?: number;
    className?: string;
    barColor?: string;
    showZeroPlaceholder?: boolean;
}) => {
    const percentage = Math.min(100, Math.max(0, (value / max) * 100));
    const shouldRenderPlaceholder = showZeroPlaceholder && percentage === 0;

    return (
        <div
            className={cn(
                'h-1.5 w-full overflow-hidden rounded-full bg-yellow-100',
                className,
            )}
        >
            {shouldRenderPlaceholder ? (
                <div
                    aria-hidden="true"
                    className="h-full w-1/4 rounded-full bg-amber-200/80"
                />
            ) : percentage > 0 ? (
                <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${percentage}%` }}
                    className={cn('h-full rounded-full', barColor)}
                    transition={{ duration: 1, ease: 'easeOut' }}
                />
            ) : null}
        </div>
    );
};

export const Skeleton = ({ className }: { className?: string }) => (
    <div className={cn('animate-pulse rounded-xl bg-yellow-100', className)} />
);
