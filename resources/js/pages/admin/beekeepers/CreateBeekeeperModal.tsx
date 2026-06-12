import type { useForm } from '@inertiajs/react';
import { Button } from '@/components/core/display/button';
import { Input } from '@/components/core/form/input';
import { Modal } from '@/components/core/overlay/modal';

type FormInstance = ReturnType<typeof useForm<{ name: string; email: string; phone: string }>>;

interface Props {
    isOpen: boolean;
    form: FormInstance;
    onSubmit: (e: React.FormEvent) => void;
    onClose: () => void;
}

export function CreateBeekeeperModal({ isOpen, form, onSubmit, onClose }: Props) {
    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Add Beekeeper" maxWidth="md">
            <form onSubmit={onSubmit} className="space-y-4">
                <Input label="Name" value={form.data.name} onChange={(e) => form.setData('name', e.target.value)} placeholder="Full name" autoFocus error={form.errors.name} />
                <Input label="Email" type="email" value={form.data.email} onChange={(e) => form.setData('email', e.target.value)} placeholder="email@example.com" error={form.errors.email} />
                <Input label="Phone (optional)" type="tel" value={form.data.phone} onChange={(e) => form.setData('phone', e.target.value.replace(/[^\d+\-\s]/g, ''))} placeholder="+60 12-345 6789" error={form.errors.phone} />
                <div className="flex gap-3 pt-2">
                    <Button type="button" variant="ghost" onClick={onClose} className="flex-1">Cancel</Button>
                    <Button type="submit" variant="primary" loading={form.processing} disabled={form.processing} className="flex-1">
                        {form.processing ? 'Sending...' : 'Send Invite'}
                    </Button>
                </div>
            </form>
        </Modal>
    );
}
