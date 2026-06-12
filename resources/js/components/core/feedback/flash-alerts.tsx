import { AnimatePresence, motion } from 'motion/react';
import { useEffect, useState } from 'react';
import { Alert } from '@/components/core/feedback';

export type FlashMessageBag = {
    id?: string | null;
    success?: {
        message: string;
        reason?: string | null;
    } | null;
    error?: {
        message: string;
        reason?: string | null;
    } | null;
    warning?: {
        message: string;
        reason?: string | null;
    } | null;
};

type FlashAlertItem = {
    id: number;
    message: string;
    reason?: string | null;
    variant: 'success' | 'error' | 'warning';
};

interface FlashAlertsProps {
    flash?: FlashMessageBag;
    durationMs?: number;
}

function buildFlashItems(flash?: FlashMessageBag): FlashAlertItem[] {
    const items: FlashAlertItem[] = [];

    if (flash?.success) {
            items.push({
                id: 0,
                message: flash.success.message,
                reason: flash.success.reason,
                variant: 'success',
            });
        }

    if (flash?.error) {
            items.push({
                id: 1,
                message: flash.error.message,
                reason: flash.error.reason,
                variant: 'error',
            });
        }

    if (flash?.warning) {
            items.push({
                id: 2,
                message: flash.warning.message,
                reason: flash.warning.reason,
                variant: 'warning',
            });
        }

    return items;
}

export function FlashAlerts({ flash, durationMs = 4500 }: FlashAlertsProps) {
    const [items, setItems] = useState<FlashAlertItem[]>(() =>
        buildFlashItems(flash),
    );

    useEffect(() => {
        if (items.length === 0) {
            return;
        }

        const timers = items.map((item) =>
            window.setTimeout(() => {
                setItems((current) =>
                    current.filter((entry) => entry.id !== item.id),
                );
            }, durationMs),
        );

        return () => {
            timers.forEach((timer) => window.clearTimeout(timer));
        };
    }, [durationMs, items]);

    if (items.length === 0) {
        return null;
    }

    return (
        <div className="space-y-3">
            <AnimatePresence initial={false}>
                {items.map((item) => (
                    <motion.div
                        key={item.id}
                        layout
                        initial={{ opacity: 0, y: -12, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -10, scale: 0.98 }}
                        transition={{ duration: 0.28, ease: 'easeOut' }}
                    >
                        <Alert
                            variant={item.variant}
                            title={item.reason ? item.message : undefined}
                            onClose={() =>
                                setItems((current) =>
                                    current.filter(
                                        (entry) => entry.id !== item.id,
                                    ),
                                )
                            }
                        >
                            {item.reason ?? item.message}
                        </Alert>
                    </motion.div>
                ))}
            </AnimatePresence>
        </div>
    );
}
