import { Head, Link, router } from '@inertiajs/react';
import { ArrowLeft } from 'lucide-react';
import { useState } from 'react';
import { Breadcrumbs } from '@/components/core/navigation';
import { AuthenticatedLayout } from '@/layouts/authenticated-layout';
import { HarvestBar } from './HarvestBar';
import type { HarvestRecord } from './HarvestBar';
import { HriScoreCard } from './HriScoreCard';
import type { HiveData } from './HriScoreCard';
import { HriTrendChart } from './HriTrendChart';
import type { HriTrend } from './HriTrendChart';
import { LatestPredictionCard } from './LatestPredictionCard';
import type { LatestPrediction } from './LatestPredictionCard';
import { SensorChart } from './SensorChart';
import type { SensorReading } from './SensorChart';

interface Props {
    hive: HiveData;
    hriTrend: HriTrend[];
    sensorReadings: SensorReading[];
    latestPrediction: LatestPrediction | null;
    harvestHistory: HarvestRecord[];
}

export default function Analytics({ hive, hriTrend, sensorReadings, latestPrediction, harvestHistory }: Props) {
    const todayString = () => new Date().toISOString().slice(0, 10);
    const [sensorDate, setSensorDate] = useState(todayString);

    function handleSensorDateChange(date: string | null) {
        const resolved = date ?? todayString();
        setSensorDate(resolved);
        router.get(route('analytics.show', { hive: hive.id }), { sensor_date: resolved }, { preserveState: true, preserveScroll: true, only: ['sensorReadings'] });
    }

    return (
        <AuthenticatedLayout>
            <Head title={`Analytics — ${hive.name}`} />
            <div className="mx-auto max-w-7xl space-y-8 p-6 md:p-10 lg:px-10 lg:py-8">
                <div className="flex flex-col gap-2">
                    <Breadcrumbs items={[{ label: 'Home', href: '/' }, { label: 'My Hives', href: '/dashboard' }, { label: hive.name, href: '/dashboard' }, { label: 'Analytics' }]} />
                    <div className="flex items-center gap-3">
                        <Link href="/dashboard" className="flex h-9 w-9 items-center justify-center rounded-full bg-amber-100 text-amber-900 transition-colors hover:bg-amber-200">
                            <ArrowLeft className="h-4 w-4" />
                        </Link>
                        <div>
                            <h1 className="text-2xl font-black text-amber-900">Analytics</h1>
                            <p className="mt-1 text-sm text-amber-700">{hive.name} — Harvest Readiness Intelligence</p>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 items-stretch gap-6 lg:grid-cols-3">
                    <div className="h-full lg:col-span-1"><HriScoreCard hive={hive} /></div>
                    <div className="h-full lg:col-span-2"><HriTrendChart data={hriTrend} /></div>
                </div>

                <SensorChart data={sensorReadings} selectedDate={sensorDate} onDateChange={handleSensorDateChange} />

                <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                    <LatestPredictionCard prediction={latestPrediction} />
                    <HarvestBar data={harvestHistory} />
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
