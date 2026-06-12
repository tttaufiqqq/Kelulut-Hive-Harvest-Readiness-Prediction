import { useForm } from '@inertiajs/react';
import { Button } from '@/components/core/button';
import { Input } from '@/components/core/input';
import { Modal } from '@/components/core/modal';

export type SiteFormData = { name: string; description: string };

type SiteFormInstance = ReturnType<typeof useForm<SiteFormData>>;

interface Props {
    isOpen: boolean;
    isCreate: boolean;
    form: SiteFormInstance;
    onSubmit: () => void;
    onClose: () => void;
}

export function SiteFormModal({ isOpen, isCreate, form, onSubmit, onClose }: Props) {
    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={isCreate ? 'Add Site' : 'Edit Site'}
            maxWidth="sm"
        >
            <form
                onSubmit={(e) => { e.preventDefault(); onSubmit(); }}
                className="space-y-4"
            >
                <Input
                    label="Site Name"
                    value={form.data.name}
                    onChange={(e) => form.setData('name', e.target.value)}
                    placeholder={isCreate ? 'e.g. Field C' : undefined}
                    autoFocus
                    error={form.errors.name}
                />
                <Input
                    label="Description (optional)"
                    value={form.data.description}
                    onChange={(e) => form.setData('description', e.target.value)}
                    placeholder={isCreate ? 'e.g. Outdoor field near durian farm' : undefined}
                    error={form.errors.description}
                />
                <div className="flex gap-3 pt-2">
                    <Button type="button" variant="ghost" onClick={onClose} className="flex-1">
                        Cancel
                    </Button>
                    <Button
                        type="submit"
                        variant="primary"
                        disabled={form.processing}
                        className="flex-1"
                    >
                        {form.processing
                            ? (isCreate ? 'Adding...' : 'Saving...')
                            : (isCreate ? 'Add Site' : 'Save Changes')}
                    </Button>
                </div>
            </form>
        </Modal>
    );
}
