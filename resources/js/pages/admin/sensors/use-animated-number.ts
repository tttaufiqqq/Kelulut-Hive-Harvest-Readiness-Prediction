import { useEffect, useRef, useState } from 'react';

export function useAnimatedNumber(value: number, durationMs = 900) {
    const [displayValue, setDisplayValue] = useState(0);
    const animationFrameRef = useRef<number | null>(null);
    const displayedValueRef = useRef(0);

    useEffect(() => {
        if (animationFrameRef.current !== null) {
 cancelAnimationFrame(animationFrameRef.current); animationFrameRef.current = null; 
}

        const startValue = displayedValueRef.current;
        const targetValue = value;

        if (startValue === targetValue) {
return;
}

        const startedAt = performance.now();
        const tick = (now: number) => {
            const progress = Math.min((now - startedAt) / durationMs, 1);
            const easedProgress = progress < 0.5 ? 4 * progress * progress * progress : 1 - Math.pow(-2 * progress + 2, 3) / 2;
            const nextValue = startValue + (targetValue - startValue) * easedProgress;
            displayedValueRef.current = nextValue;
            setDisplayValue(nextValue);
  
            if (progress < 1) {
                animationFrameRef.current = requestAnimationFrame(tick);
            } else {
                displayedValueRef.current = targetValue;
                animationFrameRef.current = null;
                setDisplayValue(targetValue);  
            }
        };
        animationFrameRef.current = requestAnimationFrame(tick);

        return () => {
 if (animationFrameRef.current !== null) {
 cancelAnimationFrame(animationFrameRef.current); animationFrameRef.current = null; 
} 
};
    }, [durationMs, value]);

    return displayValue;
}
