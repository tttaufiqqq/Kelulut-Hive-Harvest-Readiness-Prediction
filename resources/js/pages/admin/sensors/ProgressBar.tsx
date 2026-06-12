import { useAnimatedNumber } from './use-animated-number';

export interface ProgressBarProps {
    value: number;
    color: string;
    noData?: boolean;
}

export function ProgressBar({ value, color, noData = false }: ProgressBarProps) {
    const displayValue = useAnimatedNumber(value, 950);

    return (
        <>
            <div className="my-4 h-3 w-full overflow-hidden rounded-full" style={{ backgroundColor: noData ? '#D1D5DB' : '#FEF3C7' }}>
                <div className="h-full rounded-full" style={{ width: noData ? '0%' : `${Math.min(displayValue, 100)}%`, backgroundColor: color, transition: 'background-color 0.3s ease' }} />
            </div>
            {noData && <p className="-mt-2 mb-1 text-center text-xs text-gray-400">--</p>}
        </>
    );
}
