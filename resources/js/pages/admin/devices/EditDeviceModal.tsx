import { useForm } from '@inertiajs/react';
import { Button } from '@/components/core/button';
import { DatePickerField } from '@/components/core/date-picker';
import { Modal } from '@/components/core/modal';
import { SelectField } from '@/components/core/select-field';
import { STATUS_OPTIONS } from './CreateDeviceModal';
import type { DeviceFormData, SelectOption } from './CreateDeviceModal';

type DeviceFormInstance = ReturnType<typeof useForm<DeviceFormData>>;

interface Props {
    isOpen: boolean;
    instant?: boolean;
    deviceIdentifier: string;
    hiveOptions: SelectOption[];
    form: DeviceFormInstance;
    onSubmit: () => void;
    onClose: () => void;
}

export function EditDeviceModal({ isOpen, instant, deviceIdentifier, hiveOptions, form, onSubmit, onClose }: Props) {
    return (
        <Modal isOpen={isOpen} instant={instant} onClose={onClose} title="Edit Device" maxWidth="sm">
            <form onSubmit={(e) => { e.preventDefault(); onSubmit(); }} className="space-y-4">
                <div>
                    <p className="mb-1 text-xs font-bold tracking-widest text-amber-900/40 uppercase">Device ID</p>
                    <p className="rounded-xl border border-amber-200 bg-amber-50/60 px-3 py-2 font-mono text-sm font-semibold text-amber-900">
                        {deviceIdentifier}
                    </p>
                </div>
                <SelectField label="Hive" value={form.data.hive_id} onChange={(v) => form.setData('hive_id', v)} options={hiveOptions} error={form.errors.hive_id} />
                <SelectField label="Status" value={form.data.device_status} onChange={(v) => form.setData('device_status', v)} options={STATUS_OPTIONS} error={form.errors.device_status} />
                <DatePickerField label="Installation Date" value={form.data.installation_date || null} onChange={(v) => form.setData('installation_date', v ?? '')} maxDate="today" error={form.errors.installation_date} />
                <DatePickerField label="Last Maintenance Date (optional)" value={form.data.last_maintenance_date || null} onChange={(v) => form.setData('last_maintenance_date', v ?? '')} maxDate="today" error={form.errors.last_maintenance_date} />
                <div className="grid grid-cols-1 gap-3 pt-2 sm:grid-cols-2">
                    <Button type="button" variant="ghost" onClick={onClose} className="w-full">Cancel</Button>
                    <Button type="button" variant="primary" disabled={form.processing} onClick={onSubmit} className="w-full">
                        {form.processing ? 'Saving...' : 'Save Changes'}
                    </Button>
                </div>
            </form>
        </Modal>
    );
}
