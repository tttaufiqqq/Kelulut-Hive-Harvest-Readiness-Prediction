export const DAYS_PER_WEEK_CHUNK = 7;

export interface CalendarWeek {
    week: number;
    start: string;
    end: string;
    label: string;
}

function pad(value: number) {
    return String(value).padStart(2, '0');
}

function toDateValue(date: Date) {
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function formatShort(date: Date) {
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export function calendarWeeksForMonth(monthValue: string): CalendarWeek[] {
    const [year, month] = monthValue.split('-').map(Number);
    const monthStart = new Date(year, month - 1, 1);
    const monthEnd = new Date(year, month, 0);
    const weeks: CalendarWeek[] = [];
    let week = 1;

    for (const start = new Date(monthStart); start <= monthEnd; start.setDate(start.getDate() + DAYS_PER_WEEK_CHUNK)) {
        const end = new Date(start);
        end.setDate(end.getDate() + DAYS_PER_WEEK_CHUNK - 1);

        if (end > monthEnd) {
            end.setTime(monthEnd.getTime());
        }

        weeks.push({
            week,
            start: toDateValue(start),
            end: toDateValue(end),
            label: `Week ${week}: ${formatShort(start)} - ${formatShort(end)}`,
        });

        week++;
    }

    return weeks;
}

export function weekContaining(dateValue: string): { month: string; week: number } {
    const [year, month, day] = dateValue.split('-').map(Number);

    return {
        month: `${year}-${pad(month)}`,
        week: Math.ceil(day / DAYS_PER_WEEK_CHUNK),
    };
}
