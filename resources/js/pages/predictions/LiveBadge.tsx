import { motion } from 'motion/react';

interface LiveBadgeProps {
    className?: string;
}

export function LiveBadge({ className = '' }: LiveBadgeProps) {
    return (
        <span
            className={`w-fit items-center gap-2 rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-bold tracking-[0.18em] text-emerald-700 uppercase ${className}`}
        >
            <motion.span
                className="h-2 w-2 shrink-0 rounded-full bg-emerald-500"
                animate={{ opacity: [1, 0.3, 1] }}
                transition={{ duration: 1.2, repeat: Infinity, ease: 'easeInOut' }}
            />
            Live
        </span>
    );
}
