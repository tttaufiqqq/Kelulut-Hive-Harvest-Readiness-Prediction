import { ChartCard, ConfidenceBar } from '@/components/core/readiness-chart-cards';
import { AnimatedNumber } from './AnimatedNumber';
import { AnimatedReadinessBadge } from './AnimatedReadinessBadge';
import { PredictionTrustNotice } from './PredictionTrustNotice';
import { StalenessLabel } from './StalenessLabel';
import type { PredictionEntry } from './types';
import { READINESS_BAR_STYLES, formatCapturedTime, formatPredictionTime, getTrustLabel, getTrustStyle } from './utils';

interface LatestPredictionCardProps {
    prediction: PredictionEntry;
    secondsAgo: number;
    justUpdated: boolean;
}

export function LatestPredictionCard({ prediction, secondsAgo, justUpdated }: LatestPredictionCardProps) {
    return (
        <div className={justUpdated ? 'rounded-[1.75rem] ring-2 ring-yellow-400/50 transition-all duration-300' : 'rounded-[1.75rem] ring-2 ring-transparent transition-all duration-300'}>
            <ChartCard eyebrow="Latest Prediction" title="Current model output" description="Live harvest readiness result from the most recent processed sensor reading." className="p-6 sm:p-8">
                <div className="space-y-6">
                    <PredictionTrustNotice prediction={prediction} />
                    <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
                        <div className="space-y-4">
                            <AnimatedReadinessBadge level={prediction.readiness_level} />
                            <div className="flex flex-wrap items-end gap-3">
                                <p className="text-5xl font-black tracking-tight text-amber-900">
                                    <AnimatedNumber value={prediction.hri_value * 100} suffix="%" className="text-5xl font-black tracking-tight text-amber-900" />
                                </p>
                                <p className="pb-1 text-sm text-amber-900/55">HRI value</p>
                            </div>
                            <StalenessLabel secondsAgo={secondsAgo} />
                        </div>
                        <div className="grid gap-5 text-sm sm:grid-cols-2 lg:min-w-[360px]">
                            <div>
                                <p className="text-[10px] font-bold tracking-wider text-amber-900/40 uppercase">Trust</p>
                                <span className={`mt-2 inline-flex rounded-full px-3 py-1 text-sm font-bold ${getTrustStyle(prediction.warning_state)}`}>
                                    {getTrustLabel(prediction)}
                                </span>
                            </div>
                            <div>
                                <p className="text-[10px] font-bold tracking-wider text-amber-900/40 uppercase">Captured</p>
                                <p className="mt-2 font-semibold text-amber-900">{formatCapturedTime(prediction)}</p>
                            </div>
                            <div>
                                <p className="text-[10px] font-bold tracking-wider text-amber-900/40 uppercase">Prediction Time</p>
                                <p className="mt-2 font-semibold text-amber-900">{formatPredictionTime(prediction)}</p>
                            </div>
                            <div>
                                <p className="text-[10px] font-bold tracking-wider text-amber-900/40 uppercase">Device</p>
                                <p className="mt-2 font-semibold text-amber-900">{prediction.device_identifier ?? 'Unknown device'}</p>
                            </div>
                        </div>
                    </div>
                    <ConfidenceBar
                        value={Math.min(prediction.confidence_score * 100, 99.9)}
                        label="Raw model confidence"
                        formatter={() => <AnimatedNumber value={prediction.confidence_score * 100} suffix="%" maxFractionDigits={1} />}
                        barClassName={READINESS_BAR_STYLES[prediction.readiness_level] ?? 'bg-amber-400'}
                    />
                </div>
            </ChartCard>
        </div>
    );
}
