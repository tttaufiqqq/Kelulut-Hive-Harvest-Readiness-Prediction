import { useEffect, useRef, useState } from 'react';

export function useAnimatedNumber(value: number, durationMs = 700): number {
    const [displayValue, setDisplayValue] = useState(value);
    const previousValueRef = useRef(value);
    const animationFrameRef = useRef<number | null>(null);

    useEffect(() => {
        if (animationFrameRef.current !== null) {
            cancelAnimationFrame(animationFrameRef.current);
            animationFrameRef.current = null;
        }

        const startValue = previousValueRef.current;

        if (startValue === value) {
            setDisplayValue(value);
            return;
        }

        previousValueRef.current = value;

        const startedAt = performance.now();
        const tick = (now: number) => {
            const progress = Math.min((now - startedAt) / durationMs, 1);
            const easedProgress = 1 - Math.pow(1 - progress, 3);
            const nextValue = startValue + (value - startValue) * easedProgress;

            setDisplayValue(nextValue);

            if (progress < 1) {
                animationFrameRef.current = requestAnimationFrame(tick);
            } else {
                animationFrameRef.current = null;
                setDisplayValue(value);
            }
        };

        animationFrameRef.current = requestAnimationFrame(tick);

        return () => {
            if (animationFrameRef.current !== null) {
                cancelAnimationFrame(animationFrameRef.current);
                animationFrameRef.current = null;
            }
        };
    }, [durationMs, value]);

    return displayValue;
}
