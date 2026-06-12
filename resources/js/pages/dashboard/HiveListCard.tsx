import { MapPin } from 'lucide-react';
import { motion } from 'motion/react';
import { Card } from '@/components/core/card';
import { Progress } from '@/components/core/feedback';
import { cn } from '@/lib/utils';

export type HiveCard = {
    id: number;
    name: string;
    species: string | null;
    location: string | null;
    status: 'active' | 'inactive';
    age_months: number;
    harvest_count: number;
    readiness_level: string | null;
    hri_value: number;
    avg_temperature: number | null;
    avg_humidity: number | null;
    avg_mq2: number | null;
    avg_mq3: number | null;
    avg_mq5: number | null;
    avg_mq135: number | null;
};

const READINESS_BAR_COLOR: Record<string, string> = {
    not_ready: 'bg-rose-400',
    approaching: 'bg-amber-400',
    nearly_ready: 'bg-yellow-400',
    ready: 'bg-emerald-400',
};

interface Props {
    hive: HiveCard;
    isSelected: boolean;
    onClick: () => void;
}

export function HiveListCard({ hive, isSelected, onClick }: Props) {
    const readinessPercent = Math.round(hive.hri_value * 100);

    return (
        <motion.div whileHover={{ y: -3 }} whileTap={{ scale: 0.995 }} className="h-full">
            <Card
                className={cn(
                    'group flex h-full cursor-pointer flex-col gap-4 border border-l-4 border-transparent bg-white/90 shadow-[0_16px_35px_-34px_rgba(120,53,15,0.9)] transition-all duration-200 lg:min-h-[188px]',
                    isSelected
                        ? 'border-l-yellow-400 bg-amber-50/80 shadow-[0_22px_44px_-34px_rgba(120,53,15,0.8)] ring-1 ring-amber-200/80'
                        : 'border-l-transparent shadow-none hover:bg-white hover:shadow-[0_20px_40px_-34px_rgba(120,53,15,0.65)] hover:ring-1 hover:ring-amber-100',
                )}
                onClick={onClick}
            >
                <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                        <h3 className="text-lg font-bold text-amber-900">{hive.name}</h3>
                        <p className="mt-1 text-sm text-amber-900/50">{hive.species ?? 'Unknown species'}</p>
                    </div>
                    {hive.location && (
                        <div className="flex shrink-0 items-center gap-1.5 rounded-full bg-white/80 px-3 py-1.5 text-xs font-medium text-amber-900/70 shadow-sm">
                            <MapPin className="h-3.5 w-3.5" />
                            {hive.location}
                        </div>
                    )}
                </div>

                <div className="grid grid-cols-3 gap-4 text-sm">
                    {[
                        { label: 'Age', value: `${hive.age_months}m` },
                        { label: 'Harvests', value: hive.harvest_count },
                        {
                            label: 'Status',
                            value: hive.status === 'active' ? 'Active' : 'Inactive',
                            className: hive.status === 'active' ? 'text-emerald-700' : 'text-rose-600',
                        },
                    ].map((col) => (
                        <div key={col.label} className="flex flex-col gap-1">
                            <span className="text-xs font-bold tracking-widest text-amber-900/40 uppercase">{col.label}</span>
                            <span className={cn('font-medium text-amber-950', col.className)}>{col.value}</span>
                        </div>
                    ))}
                </div>

                <div className="mt-auto space-y-2">
                    <div className="flex items-center justify-between text-xs font-bold tracking-widest text-amber-900/40 uppercase">
                        <span>Readiness</span>
                        <span>{readinessPercent}%</span>
                    </div>
                    <Progress
                        value={hive.hri_value * 100}
                        barColor={READINESS_BAR_COLOR[hive.readiness_level ?? ''] ?? 'bg-yellow-400'}
                        showZeroPlaceholder
                    />
                </div>
            </Card>
        </motion.div>
    );
}
