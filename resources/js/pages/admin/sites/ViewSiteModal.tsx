import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/core/button';
import { Modal } from '@/components/core/modal';
import type { SiteRow } from './SiteTableRow';

interface Props {
    site: SiteRow;
    siteIndex: number;
    totalSites: number;
    hasPrev: boolean;
    hasNext: boolean;
    onPrev: () => void;
    onNext: () => void;
    onEdit: () => void;
    onClose: () => void;
}

export function ViewSiteModal({ site, siteIndex, totalSites, hasPrev, hasNext, onPrev, onNext, onEdit, onClose }: Props) {
    return (
        <Modal isOpen onClose={onClose} title="Site Details" maxWidth="sm">
            <div className="space-y-4">
                <div className="-mt-1 mb-1 flex items-center justify-end gap-1">
                    <button
                        onClick={onPrev}
                        disabled={!hasPrev}
                        className="rounded-xl p-1.5 transition-colors hover:bg-yellow-100 disabled:cursor-not-allowed disabled:opacity-20"
                    >
                        <ChevronLeft className="h-4 w-4 text-amber-900" />
                    </button>
                    <span className="min-w-[3rem] text-center text-xs font-bold text-amber-900/40 tabular-nums">
                        {siteIndex + 1} / {totalSites}
                    </span>
                    <button
                        onClick={onNext}
                        disabled={!hasNext}
                        className="rounded-xl p-1.5 transition-colors hover:bg-yellow-100 disabled:cursor-not-allowed disabled:opacity-20"
                    >
                        <ChevronRight className="h-4 w-4 text-amber-900" />
                    </button>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <p className="mb-1 text-xs font-bold tracking-widest text-amber-900/40 uppercase">Name</p>
                        <p className="font-medium text-amber-950">{site.name}</p>
                    </div>
                    <div>
                        <p className="mb-1 text-xs font-bold tracking-widest text-amber-900/40 uppercase">Hives</p>
                        <span className="inline-flex items-center rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-bold text-amber-700">
                            {site.hive_count}
                        </span>
                    </div>
                </div>

                {site.description && (
                    <div>
                        <p className="mb-1 text-xs font-bold tracking-widest text-amber-900/40 uppercase">Description</p>
                        <p className="text-sm text-amber-900/70">{site.description}</p>
                    </div>
                )}

                <p className="text-center text-[10px] tracking-widest text-amber-900/25 uppercase">
                    Use arrow keys to navigate
                </p>

                <div className="flex gap-3 pt-2">
                    <Button type="button" variant="ghost" onClick={onClose} className="flex-1">
                        Close
                    </Button>
                    <Button type="button" variant="outline" onClick={onEdit} className="flex-1">
                        Edit
                    </Button>
                </div>
            </div>
        </Modal>
    );
}
