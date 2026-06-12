import type { useForm } from '@inertiajs/react';
import { DatePickerField } from '@/components/core/date-picker';
import { Button } from '@/components/core/display/button';
import { MultiSelectField } from '@/components/core/form/multi-select-field';
import { SelectField } from '@/components/core/form/select-field';
import { TextareaField } from '@/components/core/form/textarea-field';
import { Modal } from '@/components/core/overlay/modal';
import type { MasterFloraType, MasterWeatherCondition } from '@/types';
import { BLOOMING_OPTIONS, DAMAGE_OPTIONS, NECTAR_OPTIONS, VEGETATION_OPTIONS, masterToOptions } from './constants';
import type { InspectionEditFormData } from './constants';

type FormInstance = ReturnType<typeof useForm<InspectionEditFormData>>;

interface Props {
    isOpen: boolean;
    instant?: boolean;
    hiveName: string | undefined;
    weatherConditions: MasterWeatherCondition[];
    floraTypes: MasterFloraType[];
    form: FormInstance;
    editWeatherIds: number[];
    editFloraIds: number[];
    onWeatherChange: (ids: number[]) => void;
    onFloraChange: (ids: number[]) => void;
    onSubmit: () => void;
    onClose: () => void;
}

export function EditInspectionModal({ isOpen, instant, hiveName, weatherConditions, floraTypes, form, editWeatherIds, editFloraIds, onWeatherChange, onFloraChange, onSubmit, onClose }: Props) {
    return (
        <Modal isOpen={isOpen} instant={instant} onClose={onClose} title="Edit Inspection Record" maxWidth="2xl">
            <form onSubmit={(e) => {
 e.preventDefault(); onSubmit(); 
}} className="space-y-4">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div className="space-y-1.5">
                        <label className="ml-1 text-sm font-medium text-amber-900">Hive</label>
                        <p className="rounded-2xl border border-yellow-100 bg-yellow-50/30 px-4 py-2.5 text-sm text-amber-950/60">{hiveName}</p>
                    </div>
                    <DatePickerField label="Inspection Date" value={form.data.inspection_date || null} onChange={(v) => form.setData('inspection_date', v ?? '')} maxDate="today" error={form.errors.inspection_date} />
                </div>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                    <SelectField label="Blooming Status" value={form.data.blooming_status} onChange={(v) => form.setData('blooming_status', v)} options={BLOOMING_OPTIONS} error={form.errors.blooming_status} />
                    <SelectField label="Vegetation Density" value={form.data.vegetation_density} onChange={(v) => form.setData('vegetation_density', v)} options={VEGETATION_OPTIONS} error={form.errors.vegetation_density} />
                    <SelectField label="Nectar Availability" value={form.data.nectar_source_availability} onChange={(v) => form.setData('nectar_source_availability', v)} options={NECTAR_OPTIONS} error={form.errors.nectar_source_availability} />
                </div>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                    <SelectField label="Structural Damage" value={form.data.structural_damage} onChange={(v) => form.setData('structural_damage', v)} options={DAMAGE_OPTIONS} error={form.errors.structural_damage} />
                    <MultiSelectField label="Weather Conditions" value={editWeatherIds} onChange={onWeatherChange} options={masterToOptions(weatherConditions)} placeholder="Select..." error={form.errors.weather_ids} />
                    <MultiSelectField label="Flora Types" value={editFloraIds} onChange={onFloraChange} options={masterToOptions(floraTypes)} placeholder="Select..." error={form.errors.flora_ids} />
                </div>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <TextareaField label="Food Source Observation" value={form.data.food_source_observation} onChange={(e) => form.setData('food_source_observation', e.target.value)} rows={3} error={form.errors.food_source_observation} />
                    <TextareaField label="Notes" value={form.data.notes} onChange={(e) => form.setData('notes', e.target.value)} rows={3} error={form.errors.notes} />
                </div>
                <div className="flex gap-3 pt-2">
                    <Button type="button" variant="ghost" onClick={onClose} className="flex-1">Cancel</Button>
                    <Button type="button" variant="primary" disabled={form.processing} onClick={onSubmit} className="flex-1">
                        {form.processing ? 'Saving...' : 'Save Changes'}
                    </Button>
                </div>
            </form>
        </Modal>
    );
}
