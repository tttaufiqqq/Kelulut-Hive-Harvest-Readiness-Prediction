import { useAnimatedNumber } from './use-animated-number';

export interface ArcGaugeProps {
    value: number;
    max: number;
    color: string;
    noData?: boolean;
}

export function ArcGauge({ value, max, color, noData = false }: ArcGaugeProps) {
    const displayValue = useAnimatedNumber(value, 950);
    const cx = 60;
    const cy = 58;
    const radius = 46;
    const arcLength = Math.PI * radius;
    const ratio = Math.min(displayValue / max, 1);
    const fill = ratio * arcLength;
    const rotateDeg = -(1 - ratio) * 180;
    const d = `M ${cx - radius} ${cy} A ${radius} ${radius} 0 0 1 ${cx + radius} ${cy}`;

    return (
        <svg viewBox="0 0 120 65" className="mx-auto w-full max-w-[180px]">
            <path d={d} fill="none" stroke={noData ? '#D1D5DB' : '#FEF3C7'} strokeWidth="7" strokeLinecap="round" />
            <path d={d} fill="none" stroke={color} strokeWidth="7" strokeLinecap="round" style={{ strokeDasharray: noData ? `0 ${arcLength}` : `${fill} ${arcLength}`, transition: 'stroke 0.3s ease' }} />
            <g style={{ transformOrigin: `${cx}px ${cy}px`, transform: `rotate(${rotateDeg}deg)`, opacity: noData ? 0 : 1, transition: 'opacity 0.2s ease' }}>
                <line x1={cx - 7} y1={cy} x2={cx + 38} y2={cy} stroke="#78350F" strokeWidth="2" strokeLinecap="round" />
            </g>
            <circle cx={cx} cy={cy} r="4" fill={noData ? '#D1D5DB' : '#78350F'} />
            <circle cx={cx} cy={cy} r="2" fill={noData ? '#D1D5DB' : '#FEF3C7'} />
            {noData && <text x={cx} y={cy - 8} textAnchor="middle" fill="#9CA3AF" fontSize="14" fontWeight="bold">--</text>}
        </svg>
    );
}
