import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Card } from '@/components/core/card';
import type { ProductivityItem } from './constants';

export function ProductivityRankingTable({ items, mounted }: { items: ProductivityItem[]; mounted: boolean }) {
    if (!mounted || items.length === 0) return null;

    return (
        <Card>
            <h3 className="mb-1 text-sm font-black tracking-widest text-amber-900/60 uppercase">Productivity Ranking</h3>
            <p className="mb-4 text-xs text-amber-800/50">
                Ranked by total yield × harvest frequency — hives that produce more <em>and</em> harvest more often rank higher.
            </p>
            <div className="rounded-[1.75rem] border border-amber-100/70 bg-amber-50/35 p-3 sm:p-4">
                <ResponsiveContainer width="100%" height={Math.max(320, items.length * 44)}>
                    <BarChart layout="vertical" data={items} margin={{ left: 20, right: 32, top: 8, bottom: 18 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#fef3c7" horizontal={false} />
                        <XAxis type="number" unit=" kg" tickFormatter={(v) => (v / 1000).toFixed(0)} tick={{ fontSize: 11, fill: '#92400e' }} axisLine={false} tickLine={false} tickMargin={8} />
                        <YAxis dataKey="hive_name" type="category" width={110} tick={{ fontSize: 11, fill: '#92400e' }} axisLine={false} tickLine={false} tickMargin={8} />
                        <Tooltip
                            contentStyle={{ borderRadius: 12, border: '1px solid #fef3c7', fontSize: 12 }}
                            formatter={(value, _name, props) => {
                                const count = (props as { payload?: { harvest_count?: number } }).payload?.harvest_count ?? 0;
                                return [`${((value as number) / 1000).toFixed(2)} kg · ${count} harvest${count !== 1 ? 's' : ''}`, 'Total Yield'];
                            }}
                        />
                        <Bar dataKey="total_weight" fill="#F59E0B" radius={[0, 6, 6, 0]} />
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </Card>
    );
}
