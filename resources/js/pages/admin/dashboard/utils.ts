export function formatLastReading(ts: string | null): string {
    if (!ts) {
return '—';
}

    const date = new Date(ts);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - date.getTime()) / 86400000);

    if (diffDays === 0) {
return `Today ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
}

    if (diffDays === 1) {
return 'Yesterday';
}

    return `${diffDays} days ago`;
}
