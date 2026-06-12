import { Head, router } from '@inertiajs/react';
import { echo } from '@laravel/echo-react';
import { AlertCircle } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { Card } from '@/components/core/display/card';
import { AdminLayout } from '@/layouts/admin-layout';
import { DailyHistoryModal } from './sensors/DailyHistoryModal';
import { SensorCardGrid } from './sensors/SensorCardGrid';
import { SensorFilterBar } from './sensors/SensorFilterBar';
import type { Hive, HistoryPoint, LatestReading } from './sensors/types';
import { normalizeMissingReading, toFiniteNumber } from './sensors/utils';

type Props = {
    hives: Hive[];
    selected: number;
    window: '1h' | '6h' | '24h';
    date: string | null;
    latest: LatestReading;
    history: HistoryPoint[];
    last_seen: string | null;
};

export default function AdminSensors({ hives, selected, window, date, latest, history, last_seen }: Props) {
    const liveReloadInFlight = useRef(false);
    const [historyOpen, setHistoryOpen] = useState(false);

    const normalizedLatest = latest
        ? { ...latest, temperature: normalizeMissingReading(latest.temperature), humidity: normalizeMissingReading(latest.humidity), mq2: normalizeMissingReading(latest.mq2), mq3: normalizeMissingReading(latest.mq3), mq5: normalizeMissingReading(latest.mq5), mq135: normalizeMissingReading(latest.mq135) }
        : null;

    const missingSensors: string[] = normalizedLatest
        ? ([normalizedLatest.temperature == null ? 'Temperature' : null, normalizedLatest.humidity == null ? 'Humidity' : null, normalizedLatest.mq2 == null ? 'MQ-2' : null, normalizedLatest.mq3 == null ? 'MQ-3' : null, normalizedLatest.mq5 == null ? 'MQ-5' : null, normalizedLatest.mq135 == null ? 'MQ-135' : null] as (string | null)[]).filter((s): s is string => s !== null)
        : [];

    const normalizedHistory = history.map((point) => ({
        ...point,
        temperature: toFiniteNumber(point.temperature) ?? 0,
        humidity: toFiniteNumber(point.humidity) ?? 0,
        mq2: toFiniteNumber(point.mq2) ?? 0,
        mq3: toFiniteNumber(point.mq3) ?? 0,
        mq5: toFiniteNumber(point.mq5) ?? 0,
        mq135: toFiniteNumber(point.mq135) ?? 0,
    }));

    const sensorChannelName = hives.some((hive) => hive.id === selected) ? `hive.${selected}.sensors` : null;

    const navigate = (params: Record<string, string | number | null>) =>
        router.get(route('admin.sensors.index'), { hive_id: selected, window, date: date ?? '', ...params });

    useEffect(() => {
        const resetLiveReload = () => {
 liveReloadInFlight.current = false; 
};
        const removeStartListener = router.on('start', () => {
 liveReloadInFlight.current = true; 
});
        const removeFinishListener = router.on('finish', resetLiveReload);

        return () => {
 removeStartListener(); removeFinishListener(); 
};
    }, []);

    useEffect(() => {
        if (!sensorChannelName) {
return;
}

        const realtime = echo();
        const channel = realtime.private(sensorChannelName);
        const eventName = '.sensor.reading.created';
        const resetLiveReload = () => {
 liveReloadInFlight.current = false; 
};
        const reloadSensorProps = () => {
            if (document.hidden || liveReloadInFlight.current) {
return;
}

            liveReloadInFlight.current = true;
            router.reload({ only: ['latest', 'history', 'last_seen'], onCancel: resetLiveReload, onError: resetLiveReload, onFinish: resetLiveReload, onSuccess: resetLiveReload });
        };
        channel.listen(eventName, reloadSensorProps);

        return () => {
 channel.stopListening(eventName, reloadSensorProps); realtime.leave(sensorChannelName); 
};
    }, [sensorChannelName]);

    const historyHiveIndex = Math.max(0, hives.findIndex((h) => h.id === selected));

    return (
        <>
            <AdminLayout>
                <Head title="Sensor Readings" />
                <div className="space-y-6">
                    <SensorFilterBar hives={hives} selected={selected} window={window} date={date} normalizedLatest={normalizedLatest} lastSeen={last_seen} onHiveChange={(id) => navigate({ hive_id: id })} onWindowChange={(w) => navigate({ window: w })} onDateChange={(d) => navigate({ date: d ?? '', window })} onOpenHistory={() => setHistoryOpen(true)} />

                    {normalizedLatest === null && (
                        <div className="rounded-xl border border-amber-100 bg-amber-50 px-4 py-3">
                            <div className="flex min-w-0 items-start gap-2">
                                <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-amber-600" />
                                <span className="text-sm leading-relaxed font-semibold text-amber-700">No readings in the last {window}.</span>
                            </div>
                        </div>
                    )}

                    {normalizedLatest !== null && missingSensors.length > 0 && (
                        <div className="rounded-xl border border-amber-100 bg-amber-50 px-4 py-3">
                            <div className="flex min-w-0 items-start gap-2">
                                <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-amber-600" />
                                <div>
                                    <span className="text-sm leading-relaxed font-semibold text-amber-700">{missingSensors.length} sensor{missingSensors.length > 1 ? 's' : ''} not reporting: {missingSensors.join(', ')}</span>
                                    <p className="mt-0.5 text-xs text-amber-600/70">Check device wiring or firmware.</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {hives.length === 0 ? (
                        <Card><p className="py-8 text-center text-sm text-amber-900/50">No hives found.</p></Card>
                    ) : (
                        <SensorCardGrid normalizedLatest={normalizedLatest} normalizedHistory={normalizedHistory} />
                    )}

                    {normalizedLatest && (
                        <p className="text-right text-xs font-semibold tracking-widest text-amber-900/30 uppercase">Last reading: {normalizedLatest.recorded_at}</p>
                    )}
                </div>
            </AdminLayout>

            <DailyHistoryModal isOpen={historyOpen} hives={hives} initialHiveIndex={historyHiveIndex} onClose={() => setHistoryOpen(false)} />
        </>
    );
}
