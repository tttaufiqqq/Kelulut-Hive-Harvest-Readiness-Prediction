import { motion } from 'motion/react';
import { BeeIcon } from '@/components/core/bee-icon';

interface Props {
    status: number;
    title: string;
    message: string;
    reason?: string | null;
    actions: React.ReactNode;
    footer: React.ReactNode;
}

export function EmptyStateShell({ status, title, message, reason, actions, footer }: Props) {
    return (
        <div className="w-full max-w-md text-center">
            <div className="mb-6 flex justify-center">
                <motion.div
                    className="flex h-24 w-24 items-center justify-center bg-yellow-400"
                    style={{
                        clipPath: 'polygon(50% 0%, 95% 25%, 95% 75%, 50% 100%, 5% 75%, 5% 25%)',
                        boxShadow: '0 8px 24px rgba(251,191,36,0.30)',
                    }}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.4, ease: 'easeOut' }}
                >
                    <BeeIcon className="h-10 w-10 text-yellow-950" />
                </motion.div>
            </div>

            <motion.p
                className="mb-2 font-light tracking-tighter text-amber-400"
                style={{ fontSize: '96px', lineHeight: 1 }}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.1 }}
            >
                {status}
            </motion.p>

            <motion.h1
                className="mb-4 text-2xl font-semibold text-amber-950"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.15 }}
            >
                {title}
            </motion.h1>

            <motion.p
                className="mb-8 leading-relaxed text-amber-800/70"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.2 }}
            >
                {message}
            </motion.p>

            {reason && (
                <motion.div
                    className="mb-8 rounded-2xl border border-amber-100 bg-white/80 px-5 py-4 text-left shadow-sm"
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 0.22 }}
                >
                    <p className="text-xs font-black tracking-widest text-amber-900/45 uppercase">
                        Why This Happened
                    </p>
                    <p className="mt-2 text-sm leading-relaxed text-amber-900/70">{reason}</p>
                </motion.div>
            )}

            <motion.div
                className="mb-10 flex flex-wrap justify-center gap-3"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.25 }}
            >
                {actions}
            </motion.div>

            <div className="flex flex-wrap justify-center gap-4 border-t border-amber-100 pt-6">
                {footer}
            </div>
        </div>
    );
}
