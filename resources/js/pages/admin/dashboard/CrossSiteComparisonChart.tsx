import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Card } from '@/components/core/display/card';
import type { CrossSiteItem } from './constants';

export function CrossSiteComparisonChart({ items, productivityCount, mounted }: { items: CrossSiteItem[]; productivityCount: number; mounted: boolean }) {
    if (!mounted || items.length === 0) return null;

    return (
        <Card>
            <h3 className="mb-1 text-sm font-black tracking-widest text-amber-900/60 uppercase">Cross-Site Comparison</h3>
            <p className="mb-4 text-xs text-amber-800/50">
                Compares average readiness (HRI %) and total harvest yield per site — reveals which sites are consistently ready versus high volume.
            </p>
            <div className="rounded-[1.75rem] border border-amber-100/70 bg-amber-50/35 p-3 sm:p-4">
                <ResponsiveContainer width="100%" height={Math.max(320, productivityCount * 44)}>
                    <BarChart data={items} margin={{ left: 12, right: 20, top: 8, bottom: 18 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#fef3c7" />
                        <XAxis dataKey="site_name" tick={{ fontSize: 11, fill: '#92400e' }} axisLine={false} tickLine={false} tickMargin={8} dy={8} />
                        <YAxis yAxisId="hri" orientation="left" unit="%" tick={{ fontSize: 11, fill: '#92400e' }} axisLine={false} tickLine={false} width={36} tickMargin={8} />
                        <YAxis yAxisId="weight" orientation="right" unit=" kg" tickFormatter={(v) => (v / 1000).toFixed(0)} tick={{ fontSize: 11, fill: '#92400e' }} axisLine={false} tickLine={false} width={44} tickMargin={8} />
                        <Tooltip
                            contentStyle={{ borderRadius: 12, border: '1px solid #fef3c7', fontSize: 12 }}
                            formatter={(value, name) =>
                                name === 'Total Harvest (kg)'
                                    ? [`${((value as number) / 1000).toFixed(2)} kg`, name]
                                    : [`${value}%`, name]
                            }
                        />
                        <Legend wrapperStyle={{ fontSize: 12, paddingTop: 16, lineHeight: '20px' }} />
                        <Bar yAxisId="hri" dataKey="avg_hri_pct" name="Avg HRI (%)" fill="#F59E0B" radius={[4, 4, 0, 0]} />
                        <Bar yAxisId="weight" dataKey="total_weight" name="Total Harvest (kg)" fill="#6EE7B7" radius={[4, 4, 0, 0]} />
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </Card>
    );
}
