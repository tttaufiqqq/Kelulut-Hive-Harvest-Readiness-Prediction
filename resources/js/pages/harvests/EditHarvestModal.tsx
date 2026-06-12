import type { useForm } from '@inertiajs/react';
import { DatePickerField } from '@/components/core/date-picker';
import { Button } from '@/components/core/display/button';
import { NumberInput } from '@/components/core/form/number-input';
import { SelectField } from '@/components/core/form/select-field';
import { TextareaField } from '@/components/core/form/textarea-field';
import { Modal } from '@/components/core/overlay/modal';
import type { MasterHoneyColor, MasterHoneyFlavor } from '@/types';
import { PRODUCTIVITY_OPTIONS, colorOptions, flavorOptions } from './constants';

export type HarvestEditFormData = {
    harvest_date: string;
    weight: string;
    productivity_level: string;
    color_id: string;
    flavor_id: string;
    notes: string;
};

type FormInstance = ReturnType<typeof useForm<HarvestEditFormData>>;

interface Props {
    isOpen: boolean;
    instant?: boolean;
    hiveName: string | undefined;
    colors: MasterHoneyColor[];
    flavors: MasterHoneyFlavor[];
    form: FormInstance;
    onSubmit: () => void;
    onClose: () => void;
}

export function EditHarvestModal({ isOpen, instant, hiveName, colors, flavors, form, onSubmit, onClose }: Props) {
    return (
        <Modal isOpen={isOpen} instant={instant} onClose={onClose} title="Edit Harvest Record" maxWidth="md">
            <form onSubmit={(e) => {
 e.preventDefault(); onSubmit(); 
}} className="space-y-4">
                <div className="space-y-1.5">
                    <label className="ml-1 text-sm font-medium text-amber-900">Hive</label>
                    <p className="rounded-2xl border border-yellow-100 bg-yellow-50/30 px-4 py-2.5 text-sm text-amber-950/60">{hiveName}</p>
                </div>
                <DatePickerField label="Harvest Date" value={form.data.harvest_date || null} onChange={(v) => form.setData('harvest_date', v ?? '')} maxDate="today" error={form.errors.harvest_date} />
                <NumberInput label="Weight (kg)" value={form.data.weight} onChange={(v) => form.setData('weight', v)} min={0.01} max={9999.99} step={0.01} unit="kg" error={form.errors.weight} />
                <SelectField label="Productivity Level (optional)" value={form.data.productivity_level} onChange={(v) => form.setData('productivity_level', v)} options={PRODUCTIVITY_OPTIONS} error={form.errors.productivity_level} />
                <div className="grid grid-cols-2 gap-4">
                    <SelectField label="Honey Color (optional)" value={form.data.color_id} onChange={(v) => form.setData('color_id', v)} options={colorOptions(colors)} error={form.errors.color_id} />
                    <SelectField label="Honey Flavor (optional)" value={form.data.flavor_id} onChange={(v) => form.setData('flavor_id', v)} options={flavorOptions(flavors)} error={form.errors.flavor_id} />
                </div>
                <TextareaField label="Notes (optional)" value={form.data.notes} onChange={(e) => form.setData('notes', e.target.value)} rows={3} error={form.errors.notes} />
                <div className="flex gap-3 pt-2">
                    <Button type="button" variant="ghost" onClick={onClose} className="flex-1">Cancel</Button>
                    <Button type="button" variant="primary" loading={form.processing} disabled={form.processing} onClick={onSubmit} className="flex-1">
                        {form.processing ? 'Saving...' : 'Save Changes'}
                    </Button>
                </div>
            </form>
        </Modal>
    );
}
