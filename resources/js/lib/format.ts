function toDate(value: string | null | undefined): Date | null {
    if (!value) {
        return null;
    }

    const d = new Date(value);

    return isNaN(d.getTime()) ? null : d;
}

/** Date-only display: "07/05/2026" */
export function fmtDate(value: string | null | undefined): string {
    const d = toDate(value);

    if (!d) {
        return '—';
    }

    return d.toLocaleDateString('en-GB', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
    });
}

/** Datetime display: "07/05/2026, 14:30" */
export function fmtDateTime(value: string | null | undefined): string {
    const d = toDate(value);

    if (!d) {
        return '—';
    }

    const date = d.toLocaleDateString('en-GB', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
    });
    const time = d.toLocaleTimeString('en-GB', {
        hour: '2-digit',
        minute: '2-digit',
    });

    return `${date}, ${time}`;
}

/** Smart time: today → "14:30", other days → "07/05/2026, 14:30" */
export function fmtSmartTime(value: string | null | undefined): string {
    const d = toDate(value);

    if (!d) {
        return '—';
    }

    const now = new Date();

    if (d.toDateString() === now.toDateString()) {
        return d.toLocaleTimeString('en-GB', {
            hour: '2-digit',
            minute: '2-digit',
        });
    }

    return fmtDateTime(value);
}
