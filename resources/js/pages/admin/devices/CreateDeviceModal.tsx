import type { useForm } from '@inertiajs/react';
import { DatePickerField } from '@/components/core/date-picker';
import { Button } from '@/components/core/display/button';
import { SelectField } from '@/components/core/form/select-field';
import { Modal } from '@/components/core/overlay/modal';

export type DeviceFormData = {
    hive_id: string;
    device_status: string;
    installation_date: string;
    last_maintenance_date: string;
};

export type SelectOption = { value: string; label: string };

export const STATUS_OPTIONS: SelectOption[] = [
    { value: 'active', label: 'Active' },
    { value: 'inactive', label: 'Inactive' },
];

type DeviceFormInstance = ReturnType<typeof useForm<DeviceFormData>>;

interface Props {
    isOpen: boolean;
    hiveOptions: SelectOption[];
    form: DeviceFormInstance;
    onSubmit: () => void;
    onClose: () => void;
}

export function CreateDeviceModal({ isOpen, hiveOptions, form, onSubmit, onClose }: Props) {
    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Register Device" maxWidth="sm">
            <form onSubmit={(e) => {
 e.preventDefault(); onSubmit(); 
}} className="space-y-4">
                <div>
                    <p className="mb-1 text-xs font-bold tracking-widest text-amber-900/40 uppercase">Device ID</p>
                    <p className="rounded-xl border border-dashed border-amber-200 bg-amber-50/60 px-3 py-2 font-mono text-sm text-amber-900/40">
                        Auto-assigned on register
                    </p>
                </div>
                <SelectField label="Hive" value={form.data.hive_id} onChange={(v) => form.setData('hive_id', v)} options={hiveOptions} error={form.errors.hive_id} />
                <SelectField label="Status" value={form.data.device_status} onChange={(v) => form.setData('device_status', v)} options={STATUS_OPTIONS} error={form.errors.device_status} />
                <DatePickerField label="Installation Date" value={form.data.installation_date || null} onChange={(v) => form.setData('installation_date', v ?? '')} maxDate="today" error={form.errors.installation_date} />
                <DatePickerField label="Last Maintenance Date (optional)" value={form.data.last_maintenance_date || null} onChange={(v) => form.setData('last_maintenance_date', v ?? '')} maxDate="today" error={form.errors.last_maintenance_date} />
                <div className="grid grid-cols-1 gap-3 pt-2 sm:grid-cols-2">
                    <Button type="button" variant="ghost" onClick={onClose} className="w-full">Cancel</Button>
                    <Button type="submit" variant="primary" disabled={form.processing} className="w-full">
                        {form.processing ? 'Registering...' : 'Register Device'}
                    </Button>
                </div>
            </form>
        </Modal>
    );
}
