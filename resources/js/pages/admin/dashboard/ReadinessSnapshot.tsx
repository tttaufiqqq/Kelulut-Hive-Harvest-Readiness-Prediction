import { ReadinessDonutChart } from '@/components/core/data/visualization-charts';
import { DatePicker } from '@/components/core/date-picker';
import { PanelSpinner } from '@/components/core/feedback/panel-spinner';
import { fmtDate } from '@/lib/format';

export interface ReadinessSnapshotProps {
    isLiveMode: boolean;
    snapshotDate: string | null;
    snapshotLoading: boolean;
    donutData: { level: string; count: number }[];
    onDateChange: (date: string | null) => void;
}

export function ReadinessSnapshot({ isLiveMode, snapshotDate, snapshotLoading, donutData, onDateChange }: ReadinessSnapshotProps) {
    return (
        <div className="space-y-2">
            <div className="flex items-center justify-between gap-3 px-1">
                <div className="flex items-center gap-2">
                    {isLiveMode ? (
                        <>
                            <span className="inline-block h-2 w-2 rounded-full bg-emerald-500" />
                            <span className="text-xs font-bold text-emerald-700">Live</span>
                        </>
                    ) : (
                        <span className="text-xs font-bold text-amber-700">Viewing: {fmtDate(snapshotDate)}</span>
                    )}
                </div>
                <DatePicker value={snapshotDate} onChange={onDateChange} placeholder="Pick date…" />
            </div>

            {snapshotLoading ? (
                <PanelSpinner className="h-[300px]" />
            ) : (
                <ReadinessDonutChart
                    data={donutData}
                    title="Fleet Readiness"
                    description={
                        isLiveMode
                            ? `Today's readiness breakdown across all hives — ${fmtDate(new Date().toISOString())}`
                            : 'Historical readiness breakdown for selected date'
                    }
                />
            )}
        </div>
    );
}
