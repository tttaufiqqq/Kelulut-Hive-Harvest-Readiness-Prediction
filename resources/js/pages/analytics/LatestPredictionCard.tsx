import { ChartCard, ConfidenceBar, ReadinessBadge } from '@/components/core/readiness-chart-cards';
import { fmtDateTime } from '@/lib/format';

export interface LatestPrediction {
    readiness_level: string;
    hri_value: number;
    confidence_score: number;
    prediction_timestamp: string;
}

const READINESS_BAR_STYLES: Record<string, string> = {
    not_ready: 'bg-rose-400',
    approaching: 'bg-amber-400',
    nearly_ready: 'bg-yellow-400',
    ready: 'bg-emerald-400',
};

interface Props {
    prediction: LatestPrediction | null;
}

export function LatestPredictionCard({ prediction }: Props) {
    if (!prediction) {
        return (
            <ChartCard
                eyebrow="Latest Prediction"
                title="Awaiting first prediction"
                description="Predictions will appear here once enough sensor data has been processed."
            >
                <p className="py-8 text-center text-sm text-amber-700/60">No predictions yet.</p>
            </ChartCard>
        );
    }

    const confidencePct = Math.round(prediction.confidence_score * 100);

    return (
        <ChartCard
            eyebrow="Latest Prediction"
            title="Most recent harvest readiness result"
            description="The newest model output paired with its confidence score."
        >
            <div className="space-y-5">
                <ReadinessBadge level={prediction.readiness_level} appearance="solid" className="self-start" />
                <ConfidenceBar
                    value={Math.min(prediction.confidence_score * 100, 99.9)}
                    label="Model confidence"
                    formatter={() => `${confidencePct}%`}
                    barClassName={READINESS_BAR_STYLES[prediction.readiness_level] ?? 'bg-amber-400'}
                />
                <div className="grid grid-cols-2 gap-4 text-center">
                    <div>
                        <p className="text-[10px] font-bold tracking-wider text-amber-900/40 uppercase">HRI Value</p>
                        <p className="text-xl font-bold text-amber-900">{Math.round(prediction.hri_value * 100)}%</p>
                    </div>
                    <div>
                        <p className="text-[10px] font-bold tracking-wider text-amber-900/40 uppercase">Timestamp</p>
                        <p className="text-sm font-semibold text-amber-900">{fmtDateTime(prediction.prediction_timestamp)}</p>
                    </div>
                </div>
            </div>
        </ChartCard>
    );
}
