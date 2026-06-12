import { useForm } from '@inertiajs/react';
import { Button } from '@/components/core/display/button';
import { DatePickerField } from '@/components/core/date-picker';
import { Modal } from '@/components/core/overlay/modal';
import { NumberInput } from '@/components/core/form/number-input';
import { SelectField } from '@/components/core/form/select-field';
import { TextareaField } from '@/components/core/form/textarea-field';
import type { MasterHoneyColor, MasterHoneyFlavor } from '@/types';
import { PRODUCTIVITY_OPTIONS, hiveOptions, colorOptions, flavorOptions } from './constants';

export type HarvestCreateFormData = {
    hive_id: string;
    harvest_date: string;
    weight: string;
    productivity_level: string;
    color_id: string;
    flavor_id: string;
    notes: string;
};

type FormInstance = ReturnType<typeof useForm<HarvestCreateFormData>>;

interface Props {
    isOpen: boolean;
    hives: { id: number; name: string }[];
    colors: MasterHoneyColor[];
    flavors: MasterHoneyFlavor[];
    form: FormInstance;
    onSubmit: (e: React.FormEvent) => void;
    onClose: () => void;
}

export function CreateHarvestModal({ isOpen, hives, colors, flavors, form, onSubmit, onClose }: Props) {
    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Add Harvest Record" maxWidth="md">
            <form onSubmit={onSubmit} className="space-y-4">
                <SelectField label="Hive" value={form.data.hive_id} onChange={(v) => form.setData('hive_id', v)} options={hiveOptions(hives)} error={form.errors.hive_id} />
                <DatePickerField label="Harvest Date" value={form.data.harvest_date || null} onChange={(v) => form.setData('harvest_date', v ?? '')} maxDate="today" error={form.errors.harvest_date} />
                <NumberInput label="Weight (kg)" value={form.data.weight} onChange={(v) => form.setData('weight', v)} min={0.01} max={9999.99} step={0.01} placeholder="e.g. 1.50" unit="kg" error={form.errors.weight} />
                <SelectField label="Productivity Level (optional)" value={form.data.productivity_level} onChange={(v) => form.setData('productivity_level', v)} options={PRODUCTIVITY_OPTIONS} error={form.errors.productivity_level} />
                <div className="grid grid-cols-2 gap-4">
                    <SelectField label="Honey Color (optional)" value={form.data.color_id} onChange={(v) => form.setData('color_id', v)} options={colorOptions(colors)} error={form.errors.color_id} />
                    <SelectField label="Honey Flavor (optional)" value={form.data.flavor_id} onChange={(v) => form.setData('flavor_id', v)} options={flavorOptions(flavors)} error={form.errors.flavor_id} />
                </div>
                <TextareaField label="Notes (optional)" value={form.data.notes} onChange={(e) => form.setData('notes', e.target.value)} placeholder="Any observations about this harvest..." rows={3} error={form.errors.notes} />
                <div className="flex gap-3 pt-2">
                    <Button type="button" variant="ghost" onClick={onClose} className="flex-1">Cancel</Button>
                    <Button type="submit" variant="primary" disabled={form.processing} className="flex-1">
                        {form.processing ? 'Saving...' : 'Save Harvest'}
                    </Button>
                </div>
            </form>
        </Modal>
    );
}
