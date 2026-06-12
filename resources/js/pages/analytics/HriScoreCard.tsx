import { getReadinessColor, ReadinessScoreCard } from '@/components/core/readiness-chart-cards';

export interface HiveData {
    id: number;
    name: string;
    latest_readiness_level: string | null;
    avg_hri_pct: number;
    avg_hri_7d_pct: number;
    total_harvests: number;
    last_harvest_date: string | null;
}

function formatDate(ymd: string): string {
    const [year, month, day] = ymd.split('-').map(Number);
    return new Date(year, month - 1, day).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
}

interface Props {
    hive: HiveData;
}

export function HriScoreCard({ hive }: Props) {
    return (
        <ReadinessScoreCard
            value={
                <span style={{ color: getReadinessColor(hive.latest_readiness_level) }}>
                    {hive.avg_hri_pct}%
                </span>
            }
            level={hive.latest_readiness_level}
            secondaryLabel="7-day avg"
            secondaryValue={`${hive.avg_hri_7d_pct}%`}
            tertiaryLabel="Last harvest"
            tertiaryValue={hive.last_harvest_date ? formatDate(hive.last_harvest_date) : '—'}
            description="Current harvest readiness score based on the latest analytics window."
        />
    );
}
