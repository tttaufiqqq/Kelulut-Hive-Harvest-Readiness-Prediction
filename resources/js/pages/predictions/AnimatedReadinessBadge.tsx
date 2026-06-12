import { motion } from 'motion/react';
import { ReadinessBadge } from '@/components/core/readiness-chart-cards';

interface AnimatedReadinessBadgeProps {
    level: string;
}

export function AnimatedReadinessBadge({ level }: AnimatedReadinessBadgeProps) {
    const badge = <ReadinessBadge level={level} appearance="solid" className="text-base" />;

    if (level !== 'ready') {
        return badge;
    }

    return (
        <motion.div
            className="inline-flex rounded-full"
            animate={{
                filter: [
                    'drop-shadow(0 0 0 rgba(22,163,74,0.0))',
                    'drop-shadow(0 0 12px rgba(22,163,74,0.38)) drop-shadow(0 0 20px rgba(110,231,183,0.26))',
                    'drop-shadow(0 0 0 rgba(22,163,74,0.0))',
                ],
            }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
        >
            {badge}
        </motion.div>
    );
}
