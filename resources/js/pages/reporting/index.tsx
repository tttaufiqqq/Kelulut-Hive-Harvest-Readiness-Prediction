import { Head } from '@inertiajs/react';
import { useMemo } from 'react';
import { BeekeeperTabs } from '@/components/core/beekeeper-tabs';
import { Breadcrumbs } from '@/components/core/navigation';
import { ReadinessDonutChart } from '@/components/core/visualization-charts';
import type { SensorProfile } from '@/components/core/visualization-charts';
import { AuthenticatedLayout } from '@/layouts/authenticated-layout';
import { HarvestBarChart } from './HarvestBarChart';
import type { HarvestSummaryItem } from './HarvestBarChart';
import { HriGaugeGrid } from './HriGaugeGrid';
import type { HriGauge } from './HriGaugeGrid';
import { ReadinessTrendChart } from './ReadinessTrendChart';
import type { ReadinessTrend } from './ReadinessTrendChart';
import { SensorProfilesGrid } from './SensorProfilesGrid';

interface Props {
    hriGauges: HriGauge[];
    readinessTrends: ReadinessTrend[];
    harvestSummary: HarvestSummaryItem[];
    sensorProfiles: Record<number, SensorProfile>;
}

export default function Reporting({ hriGauges, readinessTrends, harvestSummary, sensorProfiles }: Props) {
    const donutData = useMemo(() => {
        const counts: Record<string, number> = {};
        for (const gauge of hriGauges) {
            const level = gauge.readiness_level ?? 'not_ready';
            counts[level] = (counts[level] ?? 0) + 1;
        }
        return Object.entries(counts).map(([level, count]) => ({ level, count }));
    }, [hriGauges]);

    const hivesWithProfiles = hriGauges.filter((g) => sensorProfiles[g.hive_id] !== undefined);

    return (
        <AuthenticatedLayout>
            <Head title="Reporting" />
            <div className="mx-auto max-w-7xl space-y-6 p-6 md:p-10 lg:px-10 lg:py-8">
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <Breadcrumbs items={[{ label: 'Home', href: '/' }, { label: 'Reporting' }]} />
                    <BeekeeperTabs active="reporting" />
                </div>

                <div>
                    <h1 className="text-lg font-bold text-amber-900">Reporting</h1>
                    <p className="mt-1 text-sm text-amber-900/50">Harvest readiness overview for your hives.</p>
                </div>

                <div>
                    <h2 className="text-xs font-bold tracking-widest text-amber-900/40 uppercase">HRI Gauge</h2>
                    <p className="mt-1 mb-4 text-sm text-amber-700">
                        Latest readiness index and prediction confidence for each of your hives.
                    </p>
                    <HriGaugeGrid gauges={hriGauges} />
                </div>

                <ReadinessDonutChart
                    data={donutData}
                    title="Readiness Distribution"
                    description="Current readiness breakdown across your hives"
                />

                <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                    <ReadinessTrendChart trends={readinessTrends} />
                    <HarvestBarChart data={harvestSummary} />
                </div>

                <SensorProfilesGrid hivesWithProfiles={hivesWithProfiles} sensorProfiles={sensorProfiles} />
            </div>
        </AuthenticatedLayout>
    );
}
