function statusLabel(color: string): { text: string; textColor: string; dotColor: string } {
    if (color === '#EF4444') {
return { text: 'Warning', textColor: 'text-red-600', dotColor: 'bg-red-400' };
}

    if (color === '#F59E0B') {
return { text: 'Monitor', textColor: 'text-amber-600', dotColor: 'bg-amber-400' };
}

    return { text: 'Healthy', textColor: 'text-emerald-600', dotColor: 'bg-emerald-400' };
}

export function StatusBadge({ color }: { color: string }) {
    const { text, textColor, dotColor } = statusLabel(color);

    return (
        <div className="mt-1 mb-2 flex justify-center">
            <span className={`flex items-center gap-1.5 text-xs font-bold ${textColor}`}>
                <span className={`h-2 w-2 rounded-full ${dotColor}`} />
                {text}
            </span>
        </div>
    );
}
