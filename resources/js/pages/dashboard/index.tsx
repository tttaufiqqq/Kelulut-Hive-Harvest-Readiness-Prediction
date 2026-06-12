import { Head, usePage } from '@inertiajs/react';
import { Bug as Bee } from 'lucide-react';
import { motion } from 'motion/react';
import { useState } from 'react';
import { FlashAlerts } from '@/components/core/feedback/flash-alerts';
import type { FlashMessageBag } from '@/components/core/feedback/flash-alerts';
import { BeekeeperTabs } from '@/components/core/navigation/beekeeper-tabs';
import { Breadcrumbs } from '@/components/core/navigation/navigation';
import { AuthenticatedLayout } from '@/layouts/authenticated-layout';
import { DashboardEmptyState } from './DashboardEmptyState';
import { HiveDetailPanel } from './HiveDetailPanel';
import { HiveListCard } from './HiveListCard';
import type { HiveCard } from './HiveListCard';
import { getPredictionContent } from './utils';

export default function Dashboard({ hives }: { hives: HiveCard[] }) {
    const { props } = usePage<{ flash?: FlashMessageBag }>();
    const flash = props.flash;

    const [selectedHive, setSelectedHive] = useState<HiveCard | null>(() => hives[0] ?? null);
    const predictionContent = getPredictionContent(selectedHive?.readiness_level ?? null);

    return (
        <AuthenticatedLayout>
            <Head title="My Hives" />
            <div className="mx-auto flex h-full max-w-7xl flex-col gap-6 p-6 md:p-8 lg:min-h-0 lg:px-10 lg:py-8">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <Breadcrumbs items={[{ label: 'Home', href: '/' }, { label: 'My Hives' }]} />
                    <BeekeeperTabs active="dashboard" />
                </div>

                <FlashAlerts key={flash?.id ?? 'dashboard-flash'} flash={flash} />

                <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
                    <div>
                        <h1 className="text-lg font-bold text-amber-900">Your Hives</h1>
                        <p className="text-sm text-amber-900/50">
                            Monitor readiness, recent sensor trends, and live predictions from one dashboard.
                        </p>
                    </div>
                </div>

                <div className="grid min-h-0 flex-1 grid-cols-1 gap-6 lg:grid-cols-[minmax(0,7fr)_minmax(0,13fr)] lg:items-stretch">
                    <div className="flex min-h-0 flex-col gap-4 lg:overflow-y-auto lg:pr-2">
                        {hives.length === 0 && <DashboardEmptyState />}
                        {hives.map((hive) => (
                            <HiveListCard
                                key={hive.id}
                                hive={hive}
                                isSelected={selectedHive?.id === hive.id}
                                onClick={() => setSelectedHive(hive)}
                            />
                        ))}
                    </div>

                    {selectedHive ? (
                        <HiveDetailPanel hive={selectedHive} predictionContent={predictionContent} />
                    ) : (
                        <motion.div
                            key="empty"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="flex min-h-[380px] flex-col items-center justify-center rounded-3xl border-2 border-dashed border-yellow-200 bg-white/60 p-12 text-center lg:min-h-full"
                        >
                            <div className="mb-6 rounded-full bg-yellow-100 p-6">
                                <Bee className="h-10 w-10 text-yellow-600" />
                            </div>
                            <h3 className="mb-2 text-lg font-bold text-amber-900">Select a Hive</h3>
                            <p className="max-w-sm text-sm text-amber-900/50">
                                Choose one of your hives from the list to review readiness, sensor averages, and live prediction details.
                            </p>
                        </motion.div>
                    )}
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
