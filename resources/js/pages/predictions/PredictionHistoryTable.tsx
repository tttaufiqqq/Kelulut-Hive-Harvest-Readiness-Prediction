import { Link } from '@inertiajs/react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { motion } from 'motion/react';
import { Button } from '@/components/core/display/button';
import { Card } from '@/components/core/display/card';
import { DataTable } from '@/components/core/data/content';
import { ChartCard } from '@/components/core/readiness-chart-cards';
import { ReadinessBadge } from '@/components/core/readiness-chart-cards';
import { ScrollArea } from '@/components/core/display/scroll-area';
import type { PaginatedPredictions, PredictionEntry } from './types';
import { formatPredictionTime, formatRawConfidence, getRowToneStyle, getTrustLabel, getTrustStyle } from './utils';

function MobilePredictionHistoryList({ predictions, onSelect }: { predictions: PredictionEntry[]; onSelect: (id: number) => void }) {
    return (
        <Card className="overflow-hidden border-yellow-100 p-0 shadow-sm">
            <ScrollArea direction="horizontal" className="w-full">
                <DataTable
                    className="overflow-visible"
                    tableClassName="min-w-[760px] text-sm"
                    bodyClassName="divide-y divide-yellow-50"
                    rowClassName={(prediction) => getRowToneStyle(prediction.warning_state)}
                    data={predictions}
                    onRowClick={(_, index) => onSelect(predictions[index]?.id ?? 0)}
                    emptyColSpan={6}
                    emptyState={
                        <div className="px-6 py-10 text-center text-sm text-amber-900/40">No older predictions yet.</div>
                    }
                    columns={[
                        {
                            key: 'time',
                            header: 'Time',
                            cellClassName: 'min-w-[11rem] px-4 py-3.5 font-semibold whitespace-nowrap text-amber-900 tabular-nums sm:px-6 sm:py-4',
                            render: (prediction) => formatPredictionTime(prediction),
                        },
                        {
                            key: 'readiness',
                            header: 'Readiness',
                            cellClassName: 'px-4 py-3.5 sm:px-6 sm:py-4',
                            render: (prediction) => <ReadinessBadge level={prediction.readiness_level} size="sm" />,
                        },
                        {
                            key: 'hri',
                            header: 'HRI',
                            cellClassName: 'px-4 py-3.5 font-semibold whitespace-nowrap text-amber-800 sm:px-6 sm:py-4',
                            render: (prediction) => `${Math.round(prediction.hri_value * 100)}%`,
                        },
                        {
                            key: 'confidence',
                            header: 'Raw Confidence',
                            cellClassName: 'px-4 py-3.5 font-semibold whitespace-nowrap text-amber-800 sm:px-6 sm:py-4',
                            render: (prediction) => formatRawConfidence(prediction.confidence_score),
                        },
                        {
                            key: 'trust',
                            header: 'Trust',
                            headerClassName: 'hidden sm:table-cell',
                            cellClassName: 'hidden px-4 py-3.5 sm:table-cell sm:px-6 sm:py-4',
                            render: (prediction) => (
                                <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-bold whitespace-nowrap ${getTrustStyle(prediction.warning_state)}`}>
                                    {getTrustLabel(prediction)}
                                </span>
                            ),
                        },
                        {
                            key: 'device',
                            header: 'Device',
                            headerClassName: 'hidden sm:table-cell',
                            cellClassName: 'hidden px-6 py-4 font-mono whitespace-nowrap text-amber-900/60 sm:table-cell',
                            render: (prediction) => prediction.device_identifier ?? 'Unknown device',
                        },
                    ]}
                />
            </ScrollArea>
        </Card>
    );
}

interface PredictionHistoryTableProps {
    predictions: PaginatedPredictions;
    showHistory: boolean;
    onToggleHistory: () => void;
    onSelectHistory: (id: number) => void;
}

export function PredictionHistoryTable({ predictions, showHistory, onToggleHistory, onSelectHistory }: PredictionHistoryTableProps) {
    return (
        <ChartCard eyebrow="Recent Predictions" title="History browser" description="Select a row to inspect older prediction details." className="p-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <span className="w-fit rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-700">
                    {predictions.total} older
                </span>
                <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={onToggleHistory}
                    className="w-full justify-center gap-2 text-sm font-semibold sm:w-auto"
                >
                    {showHistory ? (
                        <ChevronLeft className="h-4 w-4 rotate-[-90deg]" />
                    ) : (
                        <ChevronRight className="h-4 w-4" />
                    )}
                    {showHistory ? 'Hide history' : 'Show history'}
                </Button>
            </div>

            <motion.div
                initial={false}
                animate={{ height: showHistory ? 'auto' : 0, opacity: showHistory ? 1 : 0 }}
                transition={{ duration: 0.2, ease: 'easeOut' }}
                className={showHistory ? 'mt-4 space-y-3' : 'pointer-events-none mt-4 space-y-3 overflow-hidden'}
            >
                <MobilePredictionHistoryList predictions={predictions.data} onSelect={onSelectHistory} />

                {predictions.last_page > 1 && (
                    <>
                        <div className="flex items-center justify-between gap-3 pt-1 md:hidden">
                            {predictions.links[0]?.url ? (
                                <Link href={predictions.links[0].url} preserveState preserveScroll className="rounded-full bg-yellow-100 px-4 py-2 text-sm font-semibold text-amber-900 transition-colors hover:bg-yellow-200">
                                    Previous
                                </Link>
                            ) : (
                                <span className="rounded-full bg-stone-100 px-4 py-2 text-sm font-semibold text-stone-400">Previous</span>
                            )}
                            <span className="text-center text-sm font-semibold text-amber-900/70">
                                Page {predictions.current_page} of {predictions.last_page}
                            </span>
                            {predictions.links.at(-1)?.url ? (
                                <Link href={predictions.links.at(-1)!.url!} preserveState preserveScroll className="rounded-full bg-yellow-100 px-4 py-2 text-sm font-semibold text-amber-900 transition-colors hover:bg-yellow-200">
                                    Next
                                </Link>
                            ) : (
                                <span className="rounded-full bg-stone-100 px-4 py-2 text-sm font-semibold text-stone-400">Next</span>
                            )}
                        </div>

                        <div className="hidden flex-wrap items-center justify-center gap-1 pt-1 md:flex">
                            {predictions.links.map((link, index) =>
                                link.url ? (
                                    <Link
                                        key={index}
                                        href={link.url}
                                        preserveState
                                        preserveScroll
                                        className={`rounded-lg px-3 py-1.5 text-sm transition-colors ${link.active ? 'bg-amber-500 font-semibold text-white' : 'text-amber-900/70 hover:bg-yellow-100'}`}
                                        dangerouslySetInnerHTML={{ __html: link.label }}
                                    />
                                ) : (
                                    <span key={index} className="px-3 py-1.5 text-sm text-amber-900/30" dangerouslySetInnerHTML={{ __html: link.label }} />
                                ),
                            )}
                        </div>
                    </>
                )}
            </motion.div>
        </ChartCard>
    );
}
