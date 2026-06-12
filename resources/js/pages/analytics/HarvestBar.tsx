import { useEffect, useState } from 'react';
import {
    Bar,
    BarChart,
    CartesianGrid,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from 'recharts';
import { ChartCard } from '@/components/core/readiness-chart-cards';

export interface HarvestRecord {
    date: string;
    weight: number;
    color: string | null;
    flavor: string | null;
}

const TOOLTIP_STYLE = {
    backgroundColor: '#FFFBEB',
    border: '1px solid #FEF3C7',
    borderRadius: '12px',
    fontSize: '12px',
    fontWeight: 'bold',
    color: '#78350F',
};

function HarvestTooltip({ active, payload }: { active?: boolean; payload?: Array<{ payload: HarvestRecord }> }) {
    if (!active || !payload?.length) return null;
    const record = payload[0].payload;
    return (
        <div style={TOOLTIP_STYLE} className="px-3 py-2">
            <p className="font-bold">{record.date}</p>
            <p>{record.weight} kg</p>
            {record.color && <p>Color: {record.color}</p>}
            {record.flavor && <p>Flavor: {record.flavor}</p>}
        </div>
    );
}

interface Props {
    data: HarvestRecord[];
}

export function HarvestBar({ data }: Props) {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setMounted(true);
    }, []);

    if (data.length === 0) {
        return (
            <ChartCard
                eyebrow="Harvest History"
                title="Weight records"
                description="Recent harvest outcomes will appear here once a harvest has been logged."
            >
                <p className="py-10 text-center text-sm text-amber-700/60">No harvest records yet.</p>
            </ChartCard>
        );
    }

    return (
        <ChartCard
            eyebrow="Harvest History"
            title="Weight trend"
            description="Recorded harvest weights across previous visits."
        >
            <div className="w-full">
                {mounted && (
                    <ResponsiveContainer width="100%" height={200}>
                        <BarChart data={data} margin={{ top: 8, right: 8, left: 8, bottom: 18 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#FEF3C7" />
                            <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: '#78350F', fontSize: 11, fontWeight: 600 }} dy={8} tickMargin={8} />
                            <YAxis axisLine={false} tickLine={false} width={36} tick={{ fill: '#78350F', fontSize: 11, fontWeight: 600 }} tickMargin={8} />
                            <Tooltip content={<HarvestTooltip />} />
                            <Bar dataKey="weight" name="Weight (kg)" fill="#F59E0B" radius={[6, 6, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                )}
            </div>
        </ChartCard>
    );
}
