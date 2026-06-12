import { formatSecondsAgo } from './utils';

interface StalenessLabelProps {
    secondsAgo: number;
}

export function StalenessLabel({ secondsAgo }: StalenessLabelProps) {
    if (secondsAgo < 300) {
        return (
            <p className="text-xs font-semibold text-emerald-600">
                {formatSecondsAgo(secondsAgo)}
            </p>
        );
    }

    if (secondsAgo < 900) {
        return (
            <p className="flex items-center gap-1.5 text-xs font-semibold text-amber-500">
                <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
                {formatSecondsAgo(secondsAgo)}
            </p>
        );
    }

    return (
        <p className="flex items-center gap-1.5 text-xs font-semibold text-red-500">
            <span className="h-1.5 w-1.5 rounded-full bg-red-500" />
            {formatSecondsAgo(secondsAgo)} — data may be stale
        </p>
    );
}
