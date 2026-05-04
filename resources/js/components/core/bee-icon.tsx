import type { SVGAttributes } from 'react';

export function BeeIcon({
    className,
    ...props
}: SVGAttributes<SVGElement> & { className?: string }) {
    return (
        <svg
            className={className}
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
            {...props}
        >
            {/* Wings */}
            <ellipse
                cx="6.5"
                cy="10.5"
                rx="4"
                ry="2.3"
                fill="currentColor"
                opacity="0.4"
                transform="rotate(-12 6.5 10.5)"
            />
            <ellipse
                cx="17.5"
                cy="10.5"
                rx="4"
                ry="2.3"
                fill="currentColor"
                opacity="0.4"
                transform="rotate(12 17.5 10.5)"
            />
            {/* Body with stripe cutouts — evenodd makes holes that show background = bee stripes */}
            <path
                fill="currentColor"
                fillRule="evenodd"
                d="M7.8 15 a4.2 5.3 0 1 1 8.4 0 a4.2 5.3 0 1 1 -8.4 0 Z M8 12.5 h8 v1.5 H8 Z M8 15.5 h8 v1.5 H8 Z"
            />
            {/* Head */}
            <circle cx="12" cy="8" r="2.4" fill="currentColor" />
            {/* Left antenna */}
            <path
                d="M10.5 6 L8 3.5"
                stroke="currentColor"
                strokeWidth="1.3"
                strokeLinecap="round"
                fill="none"
            />
            <circle cx="7.5" cy="3" r="0.9" fill="currentColor" />
            {/* Right antenna */}
            <path
                d="M13.5 6 L16 3.5"
                stroke="currentColor"
                strokeWidth="1.3"
                strokeLinecap="round"
                fill="none"
            />
            <circle cx="16.5" cy="3" r="0.9" fill="currentColor" />
        </svg>
    );
}
