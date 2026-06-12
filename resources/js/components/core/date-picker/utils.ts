import type { CSSProperties } from 'react';

export type PickerMode = 'day' | 'month';

export function pad(value: number) {
    return String(value).padStart(2, '0');
}

export function parsePickerValue(value: string | null, mode: PickerMode) {
    if (!value) return new Date();
    const normalized = mode === 'month' ? `${value}-01T00:00:00` : `${value}T00:00:00`;
    const parsed = new Date(normalized);
    return Number.isNaN(parsed.getTime()) ? new Date() : parsed;
}

export function formatPickerValue(year: number, month: number, day: number | null, mode: PickerMode) {
    if (mode === 'month') return `${year}-${pad(month + 1)}`;
    return `${year}-${pad(month + 1)}-${pad(day ?? 1)}`;
}

export function formatDisplayValue(value: string | null, mode: PickerMode) {
    if (!value) return null;
    const parsed = parsePickerValue(value, mode);
    return parsed.toLocaleDateString('en-GB', {
        ...(mode === 'day'
            ? { day: '2-digit', month: '2-digit', year: 'numeric' }
            : { month: '2-digit', year: 'numeric' }),
    });
}

export function getHeaderLabel(viewDate: Date, mode: PickerMode) {
    return mode === 'month'
        ? String(viewDate.getFullYear())
        : viewDate.toLocaleString('default', { month: 'long', year: 'numeric' });
}

export function isFutureMonth(year: number, month: number, today: Date) {
    return year > today.getFullYear() || (year === today.getFullYear() && month > today.getMonth());
}

export function buildMenuStyle(trigger: HTMLButtonElement, mode: PickerMode): CSSProperties {
    const rect = trigger.getBoundingClientRect();
    const viewportPadding = 12;
    const minWidth = 288;
    const width = Math.min(Math.max(rect.width, minWidth), window.innerWidth - viewportPadding * 2);
    const estimatedHeight = mode === 'month' ? 260 : 320;
    const belowTop = rect.bottom + 8;
    const fitsBelow = belowTop + estimatedHeight <= window.innerHeight - viewportPadding;
    const top = fitsBelow ? belowTop : Math.max(viewportPadding, rect.top - estimatedHeight - 8);
    const left = Math.min(
        Math.max(viewportPadding, rect.left),
        Math.max(viewportPadding, window.innerWidth - width - viewportPadding),
    );
    return { position: 'fixed', top, left, width, zIndex: 9999 };
}
