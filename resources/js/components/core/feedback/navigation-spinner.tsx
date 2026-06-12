import { router } from '@inertiajs/react';
import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

const DELAY_MS = 250;

export function NavigationSpinner() {
    const [visible, setVisible] = useState(false);
    const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    useEffect(() => {
        const clearTimer = () => {
            if (timerRef.current !== null) {
                clearTimeout(timerRef.current);
                timerRef.current = null;
            }
        };

        const unsubStart = router.on('start', () => {
            clearTimer();
            timerRef.current = setTimeout(() => {
                setVisible(true);
            }, DELAY_MS);
        });

        const unsubFinish = router.on('finish', () => {
            clearTimer();
            setVisible(false);
        });

        return () => {
            clearTimer();
            unsubStart();
            unsubFinish();
        };
    }, []);

    if (!visible) {
        return null;
    }

    return createPortal(
        <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center gap-3 backdrop-blur-sm">
            <svg
                className="h-10 w-10 animate-spin text-amber-500 drop-shadow-md"
                viewBox="0 0 24 24"
                fill="none"
                aria-hidden="true"
            >
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                />
            </svg>
            <span className="text-xs font-semibold tracking-widest text-amber-900/70 uppercase drop-shadow-sm">Loading…</span>
        </div>,
        document.body,
    );
}
