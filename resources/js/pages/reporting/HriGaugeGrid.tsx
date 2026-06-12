import { Card } from '@/components/core/card';
import { ConfidenceBar, ReadinessBadge } from '@/components/core/readiness-chart-cards';

export interface HriGauge {
    hive_id: number;
    hive_name: string;
    site_name: string | null;
    readiness_level: string | null;
    hri_value: number | null;
    confidence_pct: number | null;
}

const READINESS_BAR_STYLES: Record<string, string> = {
    not_ready: 'bg-rose-400',
    approaching: 'bg-amber-400',
    nearly_ready: 'bg-yellow-400',
    ready: 'bg-emerald-400',
};

function HriGaugeCard({ gauge }: { gauge: HriGauge }) {
    return (
        <Card className="flex h-full flex-col gap-5 border border-amber-100/80 bg-white/95">
            <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                    <p className="text-lg font-bold text-amber-900">{gauge.hive_name}</p>
                    <p className="mt-1 text-sm text-amber-900/50">{gauge.site_name ?? 'No site assigned'}</p>
                </div>
                <ReadinessBadge level={gauge.readiness_level} size="sm" />
            </div>
            <div className="space-y-1">
                <p className="text-xs font-bold tracking-widest text-amber-900/40 uppercase">Current HRI</p>
                <p className="text-5xl font-black tracking-tight text-amber-900">
                    {gauge.hri_value !== null ? gauge.hri_value.toFixed(2) : '—'}
                </p>
            </div>
            <ConfidenceBar
                value={gauge.confidence_pct}
                label="Confidence"
                emptyLabel="—"
                barClassName={READINESS_BAR_STYLES[gauge.readiness_level ?? ''] ?? 'bg-amber-400'}
            />
        </Card>
    );
}

interface Props {
    gauges: HriGauge[];
}

export function HriGaugeGrid({ gauges }: Props) {
    if (gauges.length === 0) {
        return (
            <Card>
                <p className="py-6 text-center text-sm text-amber-900/40">No hives registered yet.</p>
            </Card>
        );
    }

    return (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {gauges.map((gauge) => (
                <HriGaugeCard key={gauge.hive_id} gauge={gauge} />
            ))}
        </div>
    );
}
