import { useEffect, useMemo, useState } from 'react';
import { Check, ChevronDown, ChevronLeft, ChevronRight, ChevronUp, Info } from 'lucide-react';
import { Dropdown } from '@/components/core/overlay/dropdown';
import { Modal } from '@/components/core/overlay/modal';
import { SensorRadarChart } from '@/components/core/data/visualization-charts';
import { fmtDate } from '@/lib/format';
import type { Hive } from './types';

const ROWS_PER_PAGE = 7;

type DayRow = {
    date: string;
    avg_temp: number;
    avg_humidity: number;
    avg_mq2: number;
    avg_mq3: number;
    avg_mq5: number;
    avg_mq135: number;
    avg_hri_pct: number;
    reading_count: number;
};

export interface DailyHistoryModalProps {
    isOpen: boolean;
    hives: Hive[];
    initialHiveIndex: number;
    onClose: () => void;
}

function fmtMonth(ym: string): string {
    const [year, month] = ym.split('-');
    return new Intl.DateTimeFormat('en', { month: 'long', year: 'numeric' }).format(new Date(Number(year), Number(month) - 1));
}

export function DailyHistoryModal({ isOpen, hives, initialHiveIndex, onClose }: DailyHistoryModalProps) {
    const [activeIndex, setActiveIndex] = useState(initialHiveIndex);
    const [historyCache, setHistoryCache] = useState<Record<number, DayRow[]>>({});
    const [historyLoading, setHistoryLoading] = useState(false);
    const [tableOpen, setTableOpen] = useState(false);
    const [infoOpen, setInfoOpen] = useState(false);
    const [filterMonth, setFilterMonth] = useState<string | null>(null);
    const [currentPage, setCurrentPage] = useState(1);

    const activeHive = hives[activeIndex] ?? null;
    const historyRows = activeHive ? (historyCache[activeHive.id] ?? null) : null;
    const hasPrev = activeIndex > 0;
    const hasNext = activeIndex < hives.length - 1;

    useEffect(() => {
        if (isOpen) setActiveIndex(initialHiveIndex); // eslint-disable-line react-hooks/set-state-in-effect
    }, [isOpen, initialHiveIndex]);

    useEffect(() => { setFilterMonth(null); setCurrentPage(1); }, [activeIndex]);

    useEffect(() => {
        if (!isOpen || !activeHive) return;
        if (historyRows !== null) return;
        let cancelled = false;
        setHistoryLoading(true); // eslint-disable-line react-hooks/set-state-in-effect
        fetch(`/admin/sensors/${activeHive.id}/daily-history`, { headers: { Accept: 'application/json' } })
            .then((res) => res.json() as Promise<{ days: DayRow[] }>)
            .then((data) => { if (!cancelled) setHistoryCache((prev) => ({ ...prev, [activeHive.id]: data.days ?? [] })); }) // eslint-disable-line react-hooks/set-state-in-effect
            .catch(() => { if (!cancelled) setHistoryCache((prev) => ({ ...prev, [activeHive.id]: [] })); }) // eslint-disable-line react-hooks/set-state-in-effect
            .finally(() => { if (!cancelled) setHistoryLoading(false); }); // eslint-disable-line react-hooks/set-state-in-effect
        return () => { cancelled = true; };
    }, [isOpen, activeHive, historyRows]);

    useEffect(() => {
        if (!isOpen) return;
        const handler = (e: KeyboardEvent) => {
            if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') { e.preventDefault(); setActiveIndex((i) => Math.max(0, i - 1)); }
            if (e.key === 'ArrowRight' || e.key === 'ArrowDown') { e.preventDefault(); setActiveIndex((i) => Math.min(hives.length - 1, i + 1)); }
        };
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, [isOpen, hives.length]);

    const monthOptions = useMemo(() => {
        if (!historyRows) return [];
        return [...new Set(historyRows.map((r) => r.date.slice(0, 7)))].sort((a, b) => b.localeCompare(a));
    }, [historyRows]);

    const filteredRows = useMemo(() => {
        if (!historyRows) return [];
        return filterMonth ? historyRows.filter((r) => r.date.startsWith(filterMonth)) : historyRows;
    }, [historyRows, filterMonth]);

    const pageCount = Math.max(1, Math.ceil(filteredRows.length / ROWS_PER_PAGE));
    const pageRows = filteredRows.slice((currentPage - 1) * ROWS_PER_PAGE, currentPage * ROWS_PER_PAGE);

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={`${activeHive?.name ?? 'Hive'} — Daily History`} maxWidth="lg">
            <div className="-mt-1 mb-4 flex items-center justify-between">
                <p className="text-xs text-amber-900/40">{hives.length} hive{hives.length !== 1 ? 's' : ''}</p>
                <div className="flex items-center gap-1">
                    <button onClick={() => setActiveIndex((i) => i - 1)} disabled={!hasPrev} className="flex h-7 w-7 items-center justify-center rounded-lg text-amber-900 transition-colors hover:bg-yellow-100 disabled:cursor-not-allowed disabled:opacity-25">
                        <ChevronLeft className="h-4 w-4" />
                    </button>
                    <span className="min-w-[3rem] text-center text-xs font-bold tabular-nums text-amber-900/40">{activeIndex + 1} / {hives.length}</span>
                    <button onClick={() => setActiveIndex((i) => i + 1)} disabled={!hasNext} className="flex h-7 w-7 items-center justify-center rounded-lg text-amber-900 transition-colors hover:bg-yellow-100 disabled:cursor-not-allowed disabled:opacity-25">
                        <ChevronRight className="h-4 w-4" />
                    </button>
                </div>
            </div>

            {historyLoading ? (
                <div className="flex h-40 items-center justify-center text-sm text-amber-900/40">Loading…</div>
            ) : !historyRows || historyRows.length === 0 ? (
                <p className="py-8 text-center text-sm text-amber-900/40">No daily data available.</p>
            ) : (
                <div className="space-y-4">
                    <div className="rounded-2xl border border-yellow-100 bg-yellow-50/30 p-3">
                        <div className="mb-2 flex items-center justify-between gap-2">
                            <p className="text-xs font-black tracking-widest text-amber-900/50 uppercase">Sensor Profile</p>
                            <div className="flex items-center gap-1.5">
                                <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-700">
                                    {fmtDate(historyRows[0].date)} · {historyRows[0].reading_count} reading{historyRows[0].reading_count !== 1 ? 's' : ''}
                                </span>
                                <button onClick={() => setInfoOpen((o) => !o)} title={infoOpen ? 'Hide info' : 'What is this chart?'} className={`flex h-5 w-5 items-center justify-center rounded-full transition-colors ${infoOpen ? 'bg-amber-200 text-amber-700' : 'text-amber-400 hover:bg-amber-100 hover:text-amber-600'}`}>
                                    <Info className="h-3 w-3" />
                                </button>
                            </div>
                        </div>
                        {infoOpen && (
                            <div className="mb-3 flex items-start gap-1.5 rounded-xl bg-white/70 px-2.5 py-2">
                                <Info className="mt-0.5 h-3 w-3 shrink-0 text-amber-500" />
                                <p className="text-[11px] leading-relaxed text-amber-700/70">
                                    Shows the average sensor readings for the <span className="font-semibold text-amber-800">most recent day with data</span>. Each axis represents one sensor metric, scaled to its expected range — a wider, fuller shape indicates higher overall readings. Useful for spotting which sensors are elevated or low at a glance.
                                </p>
                            </div>
                        )}
                        <SensorRadarChart hiveName="" profile={{ avg_temperature: historyRows[0].avg_temp, avg_humidity: historyRows[0].avg_humidity, avg_mq2: historyRows[0].avg_mq2, avg_mq3: historyRows[0].avg_mq3, avg_mq5: historyRows[0].avg_mq5, avg_mq135: historyRows[0].avg_mq135 }} height={220} />
                    </div>

                    <div>
                        <button onClick={() => setTableOpen((o) => !o)} className="flex w-full items-center justify-between rounded-xl px-1 py-1.5 text-left transition-colors hover:bg-yellow-50/60">
                            <span className="text-xs font-black tracking-widest text-amber-900/50 uppercase">Daily Records</span>
                            {tableOpen ? <ChevronUp className="h-3.5 w-3.5 text-amber-900/40" /> : <ChevronDown className="h-3.5 w-3.5 text-amber-900/40" />}
                        </button>

                        {tableOpen && (
                            <div className="mt-2 space-y-3">
                                <div className="flex items-center justify-between gap-2">
                                    <Dropdown
                                        align="left"
                                        trigger={
                                            <div className="flex items-center gap-2 rounded-xl border border-yellow-200 bg-white px-3 py-1.5 text-xs font-semibold text-amber-900 transition-colors hover:bg-yellow-50/50">
                                                <span>{filterMonth ? fmtMonth(filterMonth) : 'All months'}</span>
                                                <ChevronDown className="h-3.5 w-3.5 text-amber-900/40" />
                                            </div>
                                        }
                                        items={[
                                            { id: 'all', label: 'All months', icon: !filterMonth ? <Check className="h-3.5 w-3.5" /> : undefined, onClick: () => { setFilterMonth(null); setCurrentPage(1); } },
                                            ...monthOptions.map((m) => ({ id: m, label: fmtMonth(m), icon: filterMonth === m ? <Check className="h-3.5 w-3.5" /> : undefined, onClick: () => { setFilterMonth(m); setCurrentPage(1); } })),
                                        ]}
                                    />
                                    <span className="text-xs text-amber-900/40">{filteredRows.length} record{filteredRows.length !== 1 ? 's' : ''}</span>
                                </div>

                                <div className="overflow-hidden rounded-2xl border border-yellow-100">
                                    <table className="w-full text-xs">
                                        <thead>
                                            <tr className="border-b border-yellow-100 bg-yellow-50/50">
                                                <th className="px-3 py-2 text-left font-bold tracking-widest text-amber-900/50 uppercase">Date</th>
                                                <th className="px-3 py-2 text-right font-bold tracking-widest text-amber-900/50 uppercase">Temp</th>
                                                <th className="px-3 py-2 text-right font-bold tracking-widest text-amber-900/50 uppercase">Humid</th>
                                                <th className="px-3 py-2 text-right font-bold tracking-widest text-amber-900/50 uppercase">MQ135</th>
                                                <th className="px-3 py-2 text-right font-bold tracking-widest text-amber-900/50 uppercase">HRI %</th>
                                                <th className="px-3 py-2 text-right font-bold tracking-widest text-amber-900/50 uppercase">Readings</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-yellow-50">
                                            {pageRows.length === 0 ? (
                                                <tr><td colSpan={6} className="px-3 py-6 text-center text-amber-900/40">No records for this month.</td></tr>
                                            ) : pageRows.map((row) => (
                                                <tr key={row.date} className={row === historyRows[0] ? 'bg-amber-50/40' : ''}>
                                                    <td className="px-3 py-2 font-medium text-amber-950">{fmtDate(row.date)}</td>
                                                    <td className="px-3 py-2 text-right tabular-nums text-amber-800">{row.avg_temp}°C</td>
                                                    <td className="px-3 py-2 text-right tabular-nums text-amber-800">{row.avg_humidity}%</td>
                                                    <td className="px-3 py-2 text-right tabular-nums text-amber-800">{row.avg_mq135}</td>
                                                    <td className="px-3 py-2 text-right tabular-nums text-amber-800">{row.avg_hri_pct}%</td>
                                                    <td className="px-3 py-2 text-right tabular-nums text-amber-800">{row.reading_count}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>

                                {pageCount > 1 && (
                                    <div className="flex items-center justify-between px-1">
                                        <button onClick={() => setCurrentPage((p) => p - 1)} disabled={currentPage === 1} className="flex h-7 w-7 items-center justify-center rounded-lg text-amber-900 transition-colors hover:bg-yellow-100 disabled:cursor-not-allowed disabled:opacity-25">
                                            <ChevronLeft className="h-4 w-4" />
                                        </button>
                                        <span className="text-xs font-bold tabular-nums text-amber-900/40">{currentPage} / {pageCount}</span>
                                        <button onClick={() => setCurrentPage((p) => p + 1)} disabled={currentPage === pageCount} className="flex h-7 w-7 items-center justify-center rounded-lg text-amber-900 transition-colors hover:bg-yellow-100 disabled:cursor-not-allowed disabled:opacity-25">
                                            <ChevronRight className="h-4 w-4" />
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    <p className="text-center text-[10px] tracking-widest text-amber-900/25 uppercase">Use arrow keys to navigate hives</p>
                </div>
            )}
        </Modal>
    );
}
