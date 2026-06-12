import { ConfirmModal } from '@/components/core/overlay/confirm-modal';
import { fmtDate } from '@/lib/format';
import type { Inspection } from '@/types';

type ConfirmableModal =
    | { type: 'confirm-edit'; inspection: Inspection }
    | { type: 'delete'; inspection: Inspection }
    | null;

interface Props {
    activeModal: ConfirmableModal;
    deleting: boolean;
    editProcessing: boolean;
    instant?: boolean;
    onConfirmEdit: () => void;
    onConfirmDelete: () => void;
    onClose: () => void;
}

export function InspectionConfirmModals({ activeModal, deleting, editProcessing, instant, onConfirmEdit, onConfirmDelete, onClose }: Props) {
    return (
        <>
            {activeModal?.type === 'delete' && (
                <ConfirmModal isOpen onClose={onClose} onConfirm={onConfirmDelete}
                    title="Delete Inspection Record"
                    message={<>Delete the inspection record for{' '}
                        <span className="font-semibold text-amber-950">{activeModal.inspection.hive?.name}</span> on{' '}
                        <span className="font-semibold text-amber-950">{fmtDate(activeModal.inspection.inspection_date)}</span>? This cannot be undone.</>}
                    confirmLabel={deleting ? 'Deleting...' : 'Delete'}
                    variant="destructive" loading={deleting} />
            )}
            {activeModal?.type === 'confirm-edit' && (
                <ConfirmModal isOpen instant={instant} onClose={onClose} onConfirm={onConfirmEdit}
                    title="Save Changes"
                    message={<>Save changes to the inspection record for{' '}
                        <span className="font-semibold text-amber-950">{activeModal.inspection.hive?.name}</span>?</>}
                    confirmLabel={editProcessing ? 'Saving...' : 'Save Changes'}
                    loading={editProcessing} variant="warning" />
            )}
        </>
    );
}
