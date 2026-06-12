import { motion } from 'motion/react';
import type { ReactNode } from 'react';

export interface SensorHeaderProps {
    icon: ReactNode;
    label: string;
    value?: ReactNode;
    iconBg: string;
    iconColor: string;
}

export function SensorHeader({ icon, label, value, iconBg, iconColor }: SensorHeaderProps) {
    return (
        <div className="mb-1 flex items-center justify-between">
            <div className="flex items-center gap-2">
                <motion.div
                    initial={{ scale: 0.6, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: 'spring', stiffness: 350, damping: 20 }}
                    className={`${iconBg} rounded-xl p-2`}
                    style={{ color: iconColor }}
                >
                    {icon}
                </motion.div>
                <span className="text-[11px] font-black tracking-widest text-amber-900/60 uppercase sm:text-xs">{label}</span>
            </div>
            {value !== undefined && value !== null && (
                <div className="text-xl font-black text-amber-950 sm:text-2xl">{value}</div>
            )}
        </div>
    );
}
