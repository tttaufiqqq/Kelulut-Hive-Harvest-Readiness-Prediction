import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/core/display/button';
import { Modal } from '@/components/core/overlay/modal';
import { HiveStatusBadge } from './HiveStatusBadge';
import type { HiveRow } from './HiveTableRow';

interface Props {
    hive: HiveRow;
    hiveIndex: number;
    totalHives: number;
    hasPrev: boolean;
    hasNext: boolean;
    onPrev: () => void;
    onNext: () => void;
    onEdit: () => void;
    onClose: () => void;
}

export function ViewHiveModal({ hive, hiveIndex, totalHives, hasPrev, hasNext, onPrev, onNext, onEdit, onClose }: Props) {
    return (
        <Modal isOpen onClose={onClose} title="Hive Details" maxWidth="md">
            <div className="space-y-4">
                <div className="-mt-1 mb-1 flex items-center justify-end gap-1">
                    <button onClick={onPrev} disabled={!hasPrev} className="rounded-xl p-1.5 transition-colors hover:bg-yellow-100 disabled:cursor-not-allowed disabled:opacity-20">
                        <ChevronLeft className="h-4 w-4 text-amber-900" />
                    </button>
                    <span className="min-w-[3rem] text-center text-xs font-bold text-amber-900/40 tabular-nums">
                        {hiveIndex + 1} / {totalHives}
                    </span>
                    <button onClick={onNext} disabled={!hasNext} className="rounded-xl p-1.5 transition-colors hover:bg-yellow-100 disabled:cursor-not-allowed disabled:opacity-20">
                        <ChevronRight className="h-4 w-4 text-amber-900" />
                    </button>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <p className="mb-1 text-xs font-bold tracking-widest text-amber-900/40 uppercase">Name</p>
                        <p className="font-medium text-amber-950">{hive.name}</p>
                    </div>
                    <div>
                        <p className="mb-1 text-xs font-bold tracking-widest text-amber-900/40 uppercase">Status</p>
                        <HiveStatusBadge status={hive.status} />
                    </div>
                    <div>
                        <p className="mb-1 text-xs font-bold tracking-widest text-amber-900/40 uppercase">Beekeeper</p>
                        <p className="font-medium text-amber-950">{hive.beekeeper_name ?? '—'}</p>
                    </div>
                    <div>
                        <p className="mb-1 text-xs font-bold tracking-widest text-amber-900/40 uppercase">Species</p>
                        <p className="font-medium italic text-amber-950">{hive.species ?? '—'}</p>
                    </div>
                    <div>
                        <p className="mb-1 text-xs font-bold tracking-widest text-amber-900/40 uppercase">Site</p>
                        <p className="font-medium text-amber-950">{hive.site ?? '—'}</p>
                    </div>
                    <div>
                        <p className="mb-1 text-xs font-bold tracking-widest text-amber-900/40 uppercase">Age</p>
                        <p className="font-medium text-amber-950">{hive.age_months}m</p>
                    </div>
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
