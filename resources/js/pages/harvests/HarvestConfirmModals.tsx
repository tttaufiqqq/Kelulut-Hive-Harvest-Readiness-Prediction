import { ConfirmModal } from '@/components/core/confirm-modal';
import { fmtDate } from '@/lib/format';
import type { Harvest } from '@/types';

type ConfirmableModal =
    | { type: 'confirm-edit'; harvest: Harvest }
    | { type: 'delete'; harvest: Harvest }
    | null;

interface Props {
    activeModal: ConfirmableModal;
    deleting: boolean;
    editProcessing: boolean;
    onConfirmEdit: () => void;
    onConfirmDelete: () => void;
    onClose: () => void;
}

export function HarvestConfirmModals({ activeModal, deleting, editProcessing, onConfirmEdit, onConfirmDelete, onClose }: Props) {
    return (
        <>
            {activeModal?.type === 'delete' && (
                <ConfirmModal
                    isOpen
                    onClose={onClose}
                    onConfirm={onConfirmDelete}
                    title="Delete Harvest Record"
                    message={
                        <>
                            Delete the harvest record for{' '}
                            <span className="font-semibold text-amber-950">{activeModal.harvest.hive?.name}</span> on{' '}
                            <span className="font-semibold text-amber-950">{fmtDate(activeModal.harvest.harvest_date)}</span>? This cannot be undone.
                        </>
                    }
                    confirmLabel={deleting ? 'Deleting...' : 'Delete'}
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
                            Save changes to the harvest record for{' '}
                            <span className="font-semibold text-amber-950">{activeModal.harvest.hive?.name}</span>?
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
