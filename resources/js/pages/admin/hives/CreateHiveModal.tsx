import type { useForm } from '@inertiajs/react';
import { Button } from '@/components/core/display/button';
import { Input } from '@/components/core/form/input';
import { SelectField } from '@/components/core/form/select-field';
import { Modal } from '@/components/core/overlay/modal';

export type HiveFormData = {
    name: string;
    beekeeper_id: string;
    species_id: string;
    site_id: string;
    status: string;
    image: File | null;
};

export type SelectOption = { value: string; label: string };

type HiveFormInstance = ReturnType<typeof useForm<HiveFormData>>;

interface Props {
    isOpen: boolean;
    beekeeperOptions: SelectOption[];
    speciesOptions: SelectOption[];
    siteOptions: SelectOption[];
    statusOptions: SelectOption[];
    form: HiveFormInstance;
    onSubmit: () => void;
    onClose: () => void;
}

export function CreateHiveModal({ isOpen, beekeeperOptions, speciesOptions, siteOptions, statusOptions, form, onSubmit, onClose }: Props) {
    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Register Hive" maxWidth="md">
            <form onSubmit={(e) => {
 e.preventDefault(); onSubmit(); 
}} className="space-y-4">
                <SelectField label="Beekeeper" value={form.data.beekeeper_id} onChange={(v) => form.setData('beekeeper_id', v)} options={beekeeperOptions} error={form.errors.beekeeper_id} />
                <Input label="Hive Name" value={form.data.name} onChange={(e) => form.setData('name', e.target.value)} placeholder="e.g. Hive Alpha" autoFocus error={form.errors.name} />
                <SelectField label="Species (optional)" value={form.data.species_id} onChange={(v) => form.setData('species_id', v)} options={speciesOptions} error={form.errors.species_id} />
                <SelectField label="Site (optional)" value={form.data.site_id} onChange={(v) => form.setData('site_id', v)} options={siteOptions} error={form.errors.site_id} />
                <SelectField label="Status" value={form.data.status} onChange={(v) => form.setData('status', v)} options={statusOptions} error={form.errors.status} />
                <div>
                    <label className="mb-1 block text-sm font-medium text-amber-900">Image (optional)</label>
                    <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => form.setData('image', e.target.files?.[0] ?? null)}
                        className="block w-full text-sm text-amber-900/70 file:mr-3 file:rounded-lg file:border-0 file:bg-amber-100 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-amber-800 hover:file:bg-amber-200"
                    />
                    {form.errors.image && <p className="mt-1 text-xs text-rose-500">{form.errors.image}</p>}
                </div>
                <div className="flex gap-3 pt-2">
                    <Button type="button" variant="ghost" onClick={onClose} className="flex-1">Cancel</Button>
                    <Button type="submit" variant="primary" disabled={form.processing} className="flex-1">
                        {form.processing ? 'Registering...' : 'Register Hive'}
                    </Button>
                </div>
            </form>
        </Modal>
    );
}
