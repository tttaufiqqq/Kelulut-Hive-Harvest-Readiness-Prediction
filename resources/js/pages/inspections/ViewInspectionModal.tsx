import { ChevronLeft, ChevronRight } from 'lucide-react';
import { BloomingBadge } from '@/components/core/blooming-badge';
import { Button } from '@/components/core/button';
import { Modal } from '@/components/core/modal';
import { WeatherPills } from '@/components/core/weather-pills';
import { fmtDate } from '@/lib/format';
import type { Inspection } from '@/types';

interface Props {
    inspection: Inspection;
    inspectionIndex: number;
    totalInspections: number;
    hasPrev: boolean;
    hasNext: boolean;
    onPrev: () => void;
    onNext: () => void;
    onEdit: () => void;
    onClose: () => void;
}

export function ViewInspectionModal({ inspection, inspectionIndex, totalInspections, hasPrev, hasNext, onPrev, onNext, onEdit, onClose }: Props) {
    return (
        <Modal isOpen onClose={onClose} title="Inspection Details" maxWidth="md">
            <div className="space-y-4">
                <div className="-mt-1 mb-1 flex items-center justify-end gap-1">
                    <Button type="button" variant="ghost" onClick={onPrev} disabled={!hasPrev} className="h-auto rounded-xl p-1.5 text-amber-900 hover:bg-yellow-100 disabled:cursor-not-allowed disabled:opacity-20">
                        <ChevronLeft className="h-4 w-4 text-amber-900" />
                    </Button>
                    <span className="min-w-[3rem] text-center text-xs font-bold text-amber-900/40 tabular-nums">{inspectionIndex + 1} / {totalInspections}</span>
                    <Button type="button" variant="ghost" onClick={onNext} disabled={!hasNext} className="h-auto rounded-xl p-1.5 text-amber-900 hover:bg-yellow-100 disabled:cursor-not-allowed disabled:opacity-20">
                        <ChevronRight className="h-4 w-4 text-amber-900" />
                    </Button>
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <p className="mb-1 text-xs font-bold tracking-widest text-amber-900/40 uppercase">Hive</p>
                        <p className="font-medium text-amber-950">{inspection.hive?.name ?? '—'}</p>
                    </div>
                    <div>
                        <p className="mb-1 text-xs font-bold tracking-widest text-amber-900/40 uppercase">Date</p>
                        <p className="font-medium text-amber-950">{fmtDate(inspection.inspection_date)}</p>
                    </div>
                    <div>
                        <p className="mb-1 text-xs font-bold tracking-widest text-amber-900/40 uppercase">Blooming Status</p>
                        <BloomingBadge status={inspection.blooming_status} />
                    </div>
                    <div>
                        <p className="mb-1 text-xs font-bold tracking-widest text-amber-900/40 uppercase">Structural Damage</p>
                        <p className="font-medium text-amber-950 capitalize">{inspection.structural_damage ?? '—'}</p>
                    </div>
                    <div>
                        <p className="mb-1 text-xs font-bold tracking-widest text-amber-900/40 uppercase">Vegetation Density</p>
                        <p className="font-medium text-amber-950 capitalize">{inspection.vegetation_density ?? '—'}</p>
                    </div>
                    <div>
                        <p className="mb-1 text-xs font-bold tracking-widest text-amber-900/40 uppercase">Nectar Availability</p>
                        <p className="font-medium text-amber-950 capitalize">{inspection.nectar_source_availability ?? '—'}</p>
                    </div>
                </div>
                <div>
                    <p className="mb-1 text-xs font-bold tracking-widest text-amber-900/40 uppercase">Weather Conditions</p>
                    <WeatherPills conditions={inspection.weather_conditions} />
                </div>
                {inspection.flora_types && inspection.flora_types.length > 0 && (
                    <div>
                        <p className="mb-1 text-xs font-bold tracking-widest text-amber-900/40 uppercase">Flora Types</p>
                        <div className="flex flex-wrap gap-1">
                            {inspection.flora_types.map((f) => (
                                <span key={f.id} className="inline-flex items-center rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700">{f.name}</span>
                            ))}
                        </div>
                    </div>
                )}
                {inspection.food_source_observation && (
                    <div>
                        <p className="mb-1 text-xs font-bold tracking-widest text-amber-900/40 uppercase">Food Source Observation</p>
                        <p className="text-sm whitespace-pre-wrap text-amber-900/70">{inspection.food_source_observation}</p>
                    </div>
                )}
                {inspection.notes && (
                    <div>
                        <p className="mb-1 text-xs font-bold tracking-widest text-amber-900/40 uppercase">Notes</p>
                        <p className="text-sm whitespace-pre-wrap text-amber-900/70">{inspection.notes}</p>
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
