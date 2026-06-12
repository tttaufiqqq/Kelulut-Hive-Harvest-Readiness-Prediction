import type { useForm } from '@inertiajs/react';
import { Button } from '@/components/core/display/button';
import { Input } from '@/components/core/form/input';
import { Modal } from '@/components/core/overlay/modal';

type FormInstance = ReturnType<typeof useForm<{ name: string; email: string; phone: string }>>;

interface Props {
    isOpen: boolean;
    instant?: boolean;
    form: FormInstance;
    onSubmit: () => void;
    onClose: () => void;
}

export function EditBeekeeperModal({ isOpen, instant, form, onSubmit, onClose }: Props) {
    return (
        <Modal isOpen={isOpen} instant={instant} onClose={onClose} title="Edit Beekeeper" maxWidth="md">
            <form onSubmit={(e) => {
 e.preventDefault(); onSubmit(); 
}} className="space-y-4">
                <Input label="Name" value={form.data.name} onChange={(e) => form.setData('name', e.target.value)} autoFocus error={form.errors.name} />
                <Input label="Email" type="email" value={form.data.email} onChange={(e) => form.setData('email', e.target.value)} error={form.errors.email} />
                <Input label="Phone (optional)" type="tel" value={form.data.phone} onChange={(e) => form.setData('phone', e.target.value.replace(/[^\d+\-\s]/g, ''))} error={form.errors.phone} />
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
