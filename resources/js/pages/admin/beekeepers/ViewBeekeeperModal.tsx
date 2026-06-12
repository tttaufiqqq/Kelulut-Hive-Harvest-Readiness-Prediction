import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/core/button';
import { Modal } from '@/components/core/modal';
import { fmtDate } from '@/lib/format';
import type { User } from '@/types';
import { BeekeeperStatusBadge } from './BeekeeperStatusBadge';

export type HarvestRow = {
    hive_id: number;
    hive_name: string;
    total_weight: number;
    harvest_count: number;
};

interface Props {
    beekeeper: User;
    beekeeperIndex: number;
    totalBeekeepers: number;
    hasPrev: boolean;
    hasNext: boolean;
    harvestRows: HarvestRow[] | null;
    harvestLoading: boolean;
    onPrev: () => void;
    onNext: () => void;
    onEdit: () => void;
    onClose: () => void;
}

export function ViewBeekeeperModal({ beekeeper, beekeeperIndex, totalBeekeepers, hasPrev, hasNext, harvestRows, harvestLoading, onPrev, onNext, onEdit, onClose }: Props) {
    return (
        <Modal isOpen onClose={onClose} title="Beekeeper Details" maxWidth="lg">
            <div className="space-y-4">
                <div className="-mt-1 mb-1 flex items-center justify-end gap-1">
                    <button onClick={onPrev} disabled={!hasPrev} className="rounded-xl p-1.5 transition-colors hover:bg-yellow-100 disabled:cursor-not-allowed disabled:opacity-20">
                        <ChevronLeft className="h-4 w-4 text-amber-900" />
                    </button>
                    <span className="min-w-[3rem] text-center text-xs font-bold text-amber-900/40 tabular-nums">{beekeeperIndex + 1} / {totalBeekeepers}</span>
                    <button onClick={onNext} disabled={!hasNext} className="rounded-xl p-1.5 transition-colors hover:bg-yellow-100 disabled:cursor-not-allowed disabled:opacity-20">
                        <ChevronRight className="h-4 w-4 text-amber-900" />
                    </button>
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <p className="mb-1 text-xs font-bold tracking-widest text-amber-900/40 uppercase">Name</p>
                        <p className="font-medium text-amber-950">{beekeeper.name}</p>
                    </div>
                    <div>
                        <p className="mb-1 text-xs font-bold tracking-widest text-amber-900/40 uppercase">Status</p>
                        <BeekeeperStatusBadge status={beekeeper.status ?? 'active'} />
                    </div>
                    <div className="min-w-0">
                        <p className="mb-1 text-xs font-bold tracking-widest text-amber-900/40 uppercase">Email</p>
                        <p className="font-medium break-all text-amber-950">{beekeeper.email}</p>
                    </div>
                    <div className="min-w-0">
                        <p className="mb-1 text-xs font-bold tracking-widest text-amber-900/40 uppercase">Phone</p>
                        <p className="font-medium text-amber-950">{beekeeper.phone ?? '—'}</p>
                    </div>
                    <div>
                        <p className="mb-1 text-xs font-bold tracking-widest text-amber-900/40 uppercase">Member Since</p>
                        <p className="font-medium text-amber-950">{fmtDate(beekeeper.created_at)}</p>
                    </div>
                </div>
                <div>
                    <p className="mb-2 text-xs font-bold tracking-widest text-amber-900/60 uppercase">Harvest by Hive</p>
                    {harvestLoading ? (
                        <div className="flex h-14 items-center justify-center text-xs text-amber-900/40">Loading…</div>
                    ) : !harvestRows || harvestRows.length === 0 ? (
                        <p className="py-3 text-center text-xs text-amber-900/40">No harvests recorded yet.</p>
                    ) : (
                        <div className="overflow-hidden rounded-2xl border border-yellow-100">
                            <table className="w-full text-xs">
                                <thead>
                                    <tr className="border-b border-yellow-100 bg-yellow-50/50">
                                        <th className="px-3 py-2 text-left font-bold tracking-widest text-amber-900/50 uppercase">Hive</th>
                                        <th className="px-3 py-2 text-right font-bold tracking-widest text-amber-900/50 uppercase">Total</th>
                                        <th className="px-3 py-2 text-right font-bold tracking-widest text-amber-900/50 uppercase">Harvests</th>
                                        <th className="px-3 py-2 text-right font-bold tracking-widest text-amber-900/50 uppercase">Avg</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-yellow-50">
                                    {harvestRows.map((row) => (
                                        <tr key={row.hive_id}>
                                            <td className="px-3 py-2 font-medium text-amber-950">{row.hive_name}</td>
                                            <td className="px-3 py-2 text-right tabular-nums text-amber-800">{row.total_weight} kg</td>
                                            <td className="px-3 py-2 text-right tabular-nums text-amber-800">{row.harvest_count}</td>
                                            <td className="px-3 py-2 text-right tabular-nums text-amber-800">{(row.total_weight / row.harvest_count).toFixed(1)} kg</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
                <p className="text-center text-[10px] tracking-widest text-amber-900/25 uppercase">Use arrow keys to navigate</p>
                <div className="flex gap-3 pt-2">
                    <Button type="button" variant="ghost" onClick={onClose} className="flex-1">Close</Button>
                    <Button type="button" variant="outline" onClick={onEdit} className="flex-1">Edit</Button>
                </div>
            </div>
        </Modal>
    );
}
