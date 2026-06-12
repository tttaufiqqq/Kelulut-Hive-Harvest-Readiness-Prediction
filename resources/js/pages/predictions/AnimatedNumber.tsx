import { formatAnimatedReading } from './utils';
import { useAnimatedNumber } from './use-animated-number';

interface AnimatedNumberProps {
    value: number;
    suffix?: string;
    maxFractionDigits?: number;
    className?: string;
}

export function AnimatedNumber({ value, suffix = '', maxFractionDigits = 0, className = '' }: AnimatedNumberProps) {
    const displayValue = useAnimatedNumber(value);
    return (
        <span className={`tabular-nums ${className}`}>
            {formatAnimatedReading(displayValue, maxFractionDigits)}
            {suffix}
        </span>
    );
}
