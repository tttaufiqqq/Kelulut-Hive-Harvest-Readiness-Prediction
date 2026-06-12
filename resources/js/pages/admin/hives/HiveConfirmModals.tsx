import { ConfirmModal } from '@/components/core/confirm-modal';
import type { HiveRow } from './HiveTableRow';

type ConfirmableModal =
    | { type: 'confirm-edit'; hive: HiveRow }
    | { type: 'toggle'; hive: HiveRow }
    | { type: 'delete'; hive: HiveRow }
    | null;

interface Props {
    activeModal: ConfirmableModal;
    deleting: boolean;
    editProcessing: boolean;
    onConfirmEdit: () => void;
    onConfirmToggle: () => void;
    onConfirmDelete: () => void;
    onClose: () => void;
}

export function HiveConfirmModals({ activeModal, deleting, editProcessing, onConfirmEdit, onConfirmToggle, onConfirmDelete, onClose }: Props) {
    return (
        <>
            {activeModal?.type === 'toggle' && (
                <ConfirmModal
                    isOpen
                    onClose={onClose}
                    onConfirm={onConfirmToggle}
                    title={activeModal.hive.status === 'active' ? 'Set Hive Inactive' : 'Set Hive Active'}
                    message={
                        activeModal.hive.status === 'active'
                            ? `Setting "${activeModal.hive.name}" to inactive will stop it from receiving sensor data.`
                            : `Setting "${activeModal.hive.name}" to active will allow it to receive sensor data again.`
                    }
                    confirmLabel={activeModal.hive.status === 'active' ? 'Set Inactive' : 'Set Active'}
                    variant={activeModal.hive.status === 'active' ? 'destructive' : 'warning'}
                />
            )}
            {activeModal?.type === 'delete' && (
                <ConfirmModal
                    isOpen
                    onClose={onClose}
                    onConfirm={onConfirmDelete}
                    title="Delete Hive"
                    message={
                        <>
                            Delete{' '}
                            <span className="font-semibold text-amber-950">
                                &ldquo;{activeModal.hive.name}&rdquo;
                            </span>? This will permanently remove the hive and all its data. This cannot be undone.
                        </>
                    }
                    confirmLabel={deleting ? 'Deleting...' : 'Delete Hive'}
                    variant="destructive"
                    loading={deleting}
                />
            )}
            {activeModal?.type === 'confirm-edit' && (
                <ConfirmModal
                    isOpen
                    onClose={onClose}
                    onConfirm={onConfirmEdit}
                    title="Save Changes"
                    message={
                        <>
                            Save changes to hive{' '}
                            <span className="font-semibold text-amber-950">{activeModal.hive.name}</span>?
                        </>
                    }
                    confirmLabel={editProcessing ? 'Saving...' : 'Save Changes'}
                    loading={editProcessing}
                    variant="warning"
                />
            )}
        </>
    );
}
