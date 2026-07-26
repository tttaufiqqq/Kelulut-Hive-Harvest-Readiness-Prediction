import { Head, Link, router } from '@inertiajs/react';
import { ArrowLeft } from 'lucide-react';
import type { ChartDateFilterValue } from '@/components/core/chart-date-filter/types';
import { Alert } from '@/components/core/feedback/feedback';
import { Breadcrumbs } from '@/components/core/navigation/navigation';
import { ChartCard } from '@/components/core/readiness-chart-cards';
import { AuthenticatedLayout } from '@/layouts/authenticated-layout';
import { ChartsFilterBar } from './ChartsFilterBar';
import { EmptyPredictionState } from './EmptyPredictionState';
import { LatestPredictionCard } from './LatestPredictionCard';
import { LiveBadge } from './LiveBadge';
import { PredictionHistoryTable } from './PredictionHistoryTable';
import { PredictionThresholdModal } from './PredictionThresholdModal';
import { PredictionTrendChart } from './PredictionTrendChart';
import { SensorSnapshot } from './SensorSnapshot';
import { SensorTrendChart } from './SensorTrendChart';
import type { PaginatedPredictions, PredictionEntry, PredictionTrendItem } from './types';
import { usePredictionPage } from './use-prediction-page';
import { formatPredictionTime } from './utils';

interface Props {
    hive: { id: number; name: string };
    latestPrediction: PredictionEntry | null;
    sensorWarnings: string[];
    predictionTrends: PredictionTrendItem[];
    historyPredictions: PaginatedPredictions;
    filters: {
        page: number;
        filter_type: 'date' | 'week';
        chart_date: string;
        default_chart_date: string;
        chart_month: string;
        default_chart_month: string;
        chart_week: number;
        default_chart_week: number;
    };
}

export default function Predictions({ hive, latestPrediction, sensorWarnings, predictionTrends, historyPredictions, filters }: Props) {
    const {
        showHistory, setShowHistory,
        activeHistoryId, setActiveHistoryId,
        secondsAgo, justUpdated,
        activeHistoryIndex, activeHistoryPrediction,
        hasPrevHistory, hasNextHistory,
    } = usePredictionPage({ hive, latestPrediction, historyPredictions, filters });

    const chartFilterValue: ChartDateFilterValue =
        filters.filter_type === 'week'
            ? { type: 'week', month: filters.chart_month, week: filters.chart_week }
            : { type: 'date', date: filters.chart_date };

    function handleChartFilterChange(value: ChartDateFilterValue) {
        const params =
            value.type === 'week'
                ? { filter_type: 'week', chart_month: value.month, chart_week: value.week, page: filters.page }
                : { filter_type: 'date', chart_date: value.date, page: filters.page };

        router.get(route('predictions.live', { hive: hive.id }), params, { preserveState: true, preserveScroll: true, only: ['predictionTrends', 'filters'] });
    }

    return (
        <AuthenticatedLayout>
            <Head title={`Live Predictions — ${hive.name}`} />
            <div className="mx-auto w-full max-w-7xl space-y-8 p-4 sm:p-6 md:p-10 lg:px-10 lg:py-8">
                <div className="flex flex-col gap-3">
                    <Breadcrumbs items={[{ label: 'Home', href: '/' }, { label: 'My Hives', href: '/dashboard' }, { label: hive.name, href: '/dashboard' }, { label: 'Live Predictions' }]} />
                    <div className="flex items-start gap-3">
                        <Link href="/dashboard" className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber-100 text-amber-900 transition-colors hover:bg-amber-200">
                            <ArrowLeft className="h-4 w-4" />
                        </Link>
                        <div className="min-w-0 flex-1">
                            <h1 className="text-2xl leading-tight font-black text-amber-900">Live Predictions</h1>
                            <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:gap-3">
                                <div className="min-w-0 flex-1 text-sm leading-relaxed text-amber-700">
                                    <div className="flex items-center justify-between gap-3 sm:block">
                                        <p className="truncate font-semibold text-amber-800">{hive.name}</p>
                                        <LiveBadge className={`inline-flex shrink-0 sm:hidden${secondsAgo > 900 ? ' opacity-40' : ''}`} />
                                    </div>
                                    <p className="text-amber-700/75">ML Harvest Readiness</p>
                                </div>
                                <LiveBadge className={`hidden sm:inline-flex${secondsAgo > 900 ? ' opacity-40' : ''}`} />
                            </div>
                        </div>
                    </div>
                </div>

                {sensorWarnings.length > 0 && (
                    <Alert variant="warning">
                        Some sensor data is missing ({sensorWarnings.join(', ')}) — prediction cannot be made until all sensors report.
                    </Alert>
                )}

                {latestPrediction ? (
                    <>
                        <LatestPredictionCard prediction={latestPrediction} secondsAgo={secondsAgo} justUpdated={justUpdated} />
                        <div className="space-y-6">
                            <ChartsFilterBar value={chartFilterValue} defaultDate={filters.default_chart_date} onChange={handleChartFilterChange} />
                            <div className="grid gap-6 xl:grid-cols-2">
                                <PredictionTrendChart data={predictionTrends} />
                                <SensorTrendChart data={predictionTrends} />
                            </div>
                        </div>
                        <ChartCard eyebrow="Current Sensor Snapshot" title="Inputs behind the latest prediction" description="The most recent environmental and gas readings used by the model." actions={<p className="text-sm font-semibold text-amber-900/70">{formatPredictionTime(latestPrediction)}</p>}>
                            <SensorSnapshot prediction={latestPrediction} />
                        </ChartCard>
                        <PredictionHistoryTable predictions={historyPredictions} showHistory={showHistory} onToggleHistory={() => setShowHistory((c) => !c)} onSelectHistory={setActiveHistoryId} />
                    </>
                ) : (
                    <EmptyPredictionState />
                )}
            </div>

            <PredictionThresholdModal
                prediction={activeHistoryPrediction}
                isOpen={!!activeHistoryPrediction}
                currentIndex={activeHistoryIndex ?? 0}
                totalItems={historyPredictions.data.length}
                hasPrev={hasPrevHistory}
                hasNext={hasNextHistory}
                onPrev={() => setActiveHistoryId(historyPredictions.data[(activeHistoryIndex ?? 0) - 1]?.id ?? activeHistoryId)}
                onNext={() => setActiveHistoryId(historyPredictions.data[(activeHistoryIndex ?? 0) + 1]?.id ?? activeHistoryId)}
                onClose={() => setActiveHistoryId(null)}
            />
        </AuthenticatedLayout>
    );
}
