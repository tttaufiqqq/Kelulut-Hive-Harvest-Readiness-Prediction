import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/core/display/button';
import { ProductivityBadge } from '@/components/core/display/productivity-badge';
import { Modal } from '@/components/core/overlay/modal';
import { fmtDate } from '@/lib/format';
import type { Harvest } from '@/types';

interface Props {
    harvest: Harvest;
    harvestIndex: number;
    totalHarvests: number;
    hasPrev: boolean;
    hasNext: boolean;
    onPrev: () => void;
    onNext: () => void;
    onEdit: () => void;
    onClose: () => void;
}

export function ViewHarvestModal({ harvest, harvestIndex, totalHarvests, hasPrev, hasNext, onPrev, onNext, onEdit, onClose }: Props) {
    return (
        <Modal isOpen onClose={onClose} title="Harvest Details" maxWidth="md">
            <div className="space-y-4">
                <div className="-mt-1 mb-1 flex items-center justify-end gap-1">
                    <Button type="button" variant="ghost" onClick={onPrev} disabled={!hasPrev}
                        className="h-auto rounded-xl p-1.5 text-amber-900 hover:bg-yellow-100 disabled:cursor-not-allowed disabled:opacity-20">
                        <ChevronLeft className="h-4 w-4 text-amber-900" />
                    </Button>
                    <span className="min-w-[3rem] text-center text-xs font-bold text-amber-900/40 tabular-nums">
                        {harvestIndex + 1} / {totalHarvests}
                    </span>
                    <Button type="button" variant="ghost" onClick={onNext} disabled={!hasNext}
                        className="h-auto rounded-xl p-1.5 text-amber-900 hover:bg-yellow-100 disabled:cursor-not-allowed disabled:opacity-20">
                        <ChevronRight className="h-4 w-4 text-amber-900" />
                    </Button>
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <p className="mb-1 text-xs font-bold tracking-widest text-amber-900/40 uppercase">Hive</p>
                        <p className="font-medium text-amber-950">{harvest.hive?.name ?? '—'}</p>
                    </div>
                    <div>
                        <p className="mb-1 text-xs font-bold tracking-widest text-amber-900/40 uppercase">Date</p>
                        <p className="font-medium text-amber-950">{fmtDate(harvest.harvest_date)}</p>
                    </div>
                    <div>
                        <p className="mb-1 text-xs font-bold tracking-widest text-amber-900/40 uppercase">Weight</p>
                        <p className="font-medium text-amber-950">{Math.round(harvest.weight * 1000)} g</p>
                    </div>
                    <div>
                        <p className="mb-1 text-xs font-bold tracking-widest text-amber-900/40 uppercase">Productivity</p>
                        <ProductivityBadge level={harvest.productivity_level} />
                    </div>
                    <div>
                        <p className="mb-1 text-xs font-bold tracking-widest text-amber-900/40 uppercase">Color</p>
                        <p className="font-medium text-amber-950">{harvest.color?.name ?? '—'}</p>
                    </div>
                    <div>
                        <p className="mb-1 text-xs font-bold tracking-widest text-amber-900/40 uppercase">Flavor</p>
                        <p className="font-medium text-amber-950">{harvest.flavor?.name ?? '—'}</p>
                    </div>
                </div>
                {harvest.notes && (
                    <div>
                        <p className="mb-1 text-xs font-bold tracking-widest text-amber-900/40 uppercase">Notes</p>
                        <p className="text-sm whitespace-pre-wrap text-amber-900/70">{harvest.notes}</p>
                    </div>
                )}
                <p className="text-center text-[10px] tracking-widest text-amber-900/25 uppercase">Use arrow keys to navigate</p>
                <div className="flex gap-3 pt-2">
                    <Button type="button" variant="ghost" onClick={onClose} className="flex-1">Close</Button>
                    <Button type="button" variant="outline" onClick={onEdit} className="flex-1">Edit</Button>
                </div>
            </div>
        </Modal>
    );
}
