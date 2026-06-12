import { useEffect, useRef, useState } from 'react';
import { formatAnimatedReading } from './utils';

export interface AnimatedMetricValueProps {
    value: number | null;
    suffix?: string;
    maxFractionDigits?: number;
    className?: string;
}

export function AnimatedMetricValue({ value, suffix = '', maxFractionDigits = 0, className = '' }: AnimatedMetricValueProps) {
    const [displayValue, setDisplayValue] = useState<number | null>(value);
    const previousValueRef = useRef<number | null>(value);
    const animationFrameRef = useRef<number | null>(null);

    useEffect(() => {
        if (animationFrameRef.current !== null) {
 cancelAnimationFrame(animationFrameRef.current); animationFrameRef.current = null; 
}

        if (value === null) {
            previousValueRef.current = null;
            animationFrameRef.current = requestAnimationFrame(() => {
 setDisplayValue(null); animationFrameRef.current = null; 
});
  
            return;
        }

        if (previousValueRef.current === null) {
            previousValueRef.current = value;
            animationFrameRef.current = requestAnimationFrame(() => {
 setDisplayValue(value); animationFrameRef.current = null; 
});
  
            return;
        }

        const startValue = previousValueRef.current;

        if (startValue === value) {
            animationFrameRef.current = requestAnimationFrame(() => {
 setDisplayValue(value); animationFrameRef.current = null; 
});
  
            return;
        }

        previousValueRef.current = value;

        const durationMs = 700;
        const startedAt = performance.now();
        const tick = (now: number) => {
            const progress = Math.min((now - startedAt) / durationMs, 1);
            const easedProgress = 1 - Math.pow(1 - progress, 3);
            const nextValue = startValue + (value - startValue) * easedProgress;
            setDisplayValue(nextValue);
  
            if (progress < 1) {
 animationFrameRef.current = requestAnimationFrame(tick); 
} else {
 animationFrameRef.current = null; setDisplayValue(value); 
}  
        };
        animationFrameRef.current = requestAnimationFrame(tick);

        return () => {
 if (animationFrameRef.current !== null) {
 cancelAnimationFrame(animationFrameRef.current); animationFrameRef.current = null; 
} 
};
    }, [value]);

    if (displayValue === null) {
return <span className={className}>—</span>;
}

    return <span className={`tabular-nums ${className}`}>{formatAnimatedReading(displayValue, maxFractionDigits)}{suffix}</span>;
}
