import { useForm } from '@inertiajs/react';
import { Button } from '@/components/core/display/button';
import { DatePickerField } from '@/components/core/date-picker';
import { Modal } from '@/components/core/overlay/modal';
import { MultiSelectField } from '@/components/core/form/multi-select-field';
import { SelectField } from '@/components/core/form/select-field';
import { TextareaField } from '@/components/core/form/textarea-field';
import type { MasterFloraType, MasterWeatherCondition } from '@/types';
import { BLOOMING_OPTIONS, DAMAGE_OPTIONS, NECTAR_OPTIONS, VEGETATION_OPTIONS, hiveFormOptions, masterToOptions } from './constants';
import type { InspectionCreateFormData } from './constants';

type FormInstance = ReturnType<typeof useForm<InspectionCreateFormData>>;

interface Props {
    isOpen: boolean;
    hives: { id: number; name: string }[];
    weatherConditions: MasterWeatherCondition[];
    floraTypes: MasterFloraType[];
    form: FormInstance;
    createWeatherIds: number[];
    createFloraIds: number[];
    onWeatherChange: (ids: number[]) => void;
    onFloraChange: (ids: number[]) => void;
    onSubmit: (e: React.FormEvent) => void;
    onClose: () => void;
}

export function CreateInspectionModal({ isOpen, hives, weatherConditions, floraTypes, form, createWeatherIds, createFloraIds, onWeatherChange, onFloraChange, onSubmit, onClose }: Props) {
    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Add Inspection Record" maxWidth="2xl">
            <form onSubmit={onSubmit} className="space-y-4">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <SelectField label="Hive" value={form.data.hive_id} onChange={(v) => form.setData('hive_id', v)} options={hiveFormOptions(hives)} error={form.errors.hive_id} />
                    <DatePickerField label="Inspection Date" value={form.data.inspection_date || null} onChange={(v) => form.setData('inspection_date', v ?? '')} maxDate="today" error={form.errors.inspection_date} />
                </div>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                    <SelectField label="Blooming Status" value={form.data.blooming_status} onChange={(v) => form.setData('blooming_status', v)} options={BLOOMING_OPTIONS} error={form.errors.blooming_status} />
                    <SelectField label="Vegetation Density" value={form.data.vegetation_density} onChange={(v) => form.setData('vegetation_density', v)} options={VEGETATION_OPTIONS} error={form.errors.vegetation_density} />
                    <SelectField label="Nectar Availability" value={form.data.nectar_source_availability} onChange={(v) => form.setData('nectar_source_availability', v)} options={NECTAR_OPTIONS} error={form.errors.nectar_source_availability} />
                </div>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                    <SelectField label="Structural Damage" value={form.data.structural_damage} onChange={(v) => form.setData('structural_damage', v)} options={DAMAGE_OPTIONS} error={form.errors.structural_damage} />
                    <MultiSelectField label="Weather Conditions" value={createWeatherIds} onChange={onWeatherChange} options={masterToOptions(weatherConditions)} placeholder="Select..." error={form.errors.weather_ids} />
                    <MultiSelectField label="Flora Types" value={createFloraIds} onChange={onFloraChange} options={masterToOptions(floraTypes)} placeholder="Select..." error={form.errors.flora_ids} />
                </div>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <TextareaField label="Food Source Observation" value={form.data.food_source_observation} onChange={(e) => form.setData('food_source_observation', e.target.value)} placeholder="Describe food source observations..." rows={3} error={form.errors.food_source_observation} />
                    <TextareaField label="Notes" value={form.data.notes} onChange={(e) => form.setData('notes', e.target.value)} placeholder="Any additional observations..." rows={3} error={form.errors.notes} />
                </div>
                <div className="flex gap-3 pt-2">
                    <Button type="button" variant="ghost" onClick={onClose} className="flex-1">Cancel</Button>
                    <Button type="submit" variant="primary" disabled={form.processing} className="flex-1">
                        {form.processing ? 'Saving...' : 'Save Inspection'}
                    </Button>
                </div>
            </form>
        </Modal>
    );
}
