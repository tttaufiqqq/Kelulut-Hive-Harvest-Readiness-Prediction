import { useEffect, useState } from 'react';
import { Modal } from '@/components/core/modal';
import { SensorRadarChart } from '@/components/core/visualization-charts';
import { fmtDate } from '@/lib/format';
import type { Hive } from './types';

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
    hive: Hive | null;
    onClose: () => void;
}

export function DailyHistoryModal({ isOpen, hive, onClose }: DailyHistoryModalProps) {
    const [historyCache, setHistoryCache] = useState<{ hiveId: number; rows: DayRow[] } | null>(null);
    const [historyLoading, setHistoryLoading] = useState(false);

    const historyRows = historyCache?.hiveId === hive?.id ? historyCache.rows : null;

    useEffect(() => {
        if (!isOpen || !hive) return;
        if (historyRows !== null) return; // already cached for this hive

        let cancelled = false;
        setHistoryLoading(true); // eslint-disable-line react-hooks/set-state-in-effect
        fetch(`/admin/sensors/${hive.id}/daily-history`, { headers: { Accept: 'application/json' } })
            .then((res) => res.json() as Promise<{ days: DayRow[] }>)
            .then((data) => { if (!cancelled) setHistoryCache({ hiveId: hive.id, rows: data.days ?? [] }); }) // eslint-disable-line react-hooks/set-state-in-effect
            .catch(() => { if (!cancelled) setHistoryCache({ hiveId: hive.id, rows: [] }); }) // eslint-disable-line react-hooks/set-state-in-effect
            .finally(() => { if (!cancelled) setHistoryLoading(false); }); // eslint-disable-line react-hooks/set-state-in-effect
        return () => { cancelled = true; };
    }, [isOpen, hive, historyRows]);

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={`${hive?.name ?? 'Hive'} — Daily History`} maxWidth="lg">
            {historyLoading ? (
                <div className="flex h-40 items-center justify-center text-sm text-amber-900/40">Loading…</div>
            ) : !historyRows || historyRows.length === 0 ? (
                <p className="py-8 text-center text-sm text-amber-900/40">No daily data available.</p>
            ) : (
                <div className="space-y-4">
                    <SensorRadarChart hiveName="" profile={{ avg_temperature: historyRows[0].avg_temp, avg_humidity: historyRows[0].avg_humidity, avg_mq2: historyRows[0].avg_mq2, avg_mq3: historyRows[0].avg_mq3, avg_mq5: historyRows[0].avg_mq5, avg_mq135: historyRows[0].avg_mq135 }} height={220} />
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
                                {historyRows.map((row) => (
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
                </div>
            )}
        </Modal>
    );
}
