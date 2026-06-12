import { ConfirmModal } from '@/components/core/confirm-modal';
import type { User } from '@/types';

type ConfirmableModal =
    | { type: 'confirm-edit'; user: User }
    | { type: 'toggle'; user: User }
    | { type: 'resend'; user: User }
    | { type: 'delete'; user: User }
    | null;

interface Props {
    activeModal: ConfirmableModal;
    deleting: boolean;
    editProcessing: boolean;
    onConfirmEdit: () => void;
    onConfirmToggle: () => void;
    onConfirmResend: () => void;
    onConfirmDelete: () => void;
    onClose: () => void;
}

export function BeekeeperConfirmModals({ activeModal, deleting, editProcessing, onConfirmEdit, onConfirmToggle, onConfirmResend, onConfirmDelete, onClose }: Props) {
    return (
        <>
            {activeModal?.type === 'toggle' && (
                <ConfirmModal isOpen onClose={onClose} onConfirm={onConfirmToggle}
                    title={activeModal.user.status === 'active' ? 'Deactivate Beekeeper' : 'Reactivate Beekeeper'}
                    message={activeModal.user.status === 'active'
                        ? `Deactivating ${activeModal.user.name} will prevent them from logging in. You can reactivate them at any time.`
                        : `Reactivating ${activeModal.user.name} will restore their access to BuzzyHive.`}
                    confirmLabel={activeModal.user.status === 'active' ? 'Deactivate' : 'Reactivate'}
                    variant={activeModal.user.status === 'active' ? 'destructive' : 'warning'} />
            )}
            {activeModal?.type === 'delete' && (
                <ConfirmModal isOpen onClose={onClose} onConfirm={onConfirmDelete}
                    title="Delete Beekeeper"
                    message={<>Are you sure you want to delete <span className="font-semibold text-amber-950">{activeModal.user.name}</span>? This action cannot be undone.</>}
                    confirmLabel={deleting ? 'Deleting...' : 'Delete'}
                    variant="destructive" loading={deleting} />
            )}
            {activeModal?.type === 'resend' && (
                <ConfirmModal isOpen onClose={onClose} onConfirm={onConfirmResend}
                    title="Resend Invite"
                    message={<>A new invite email will be sent to <span className="font-semibold text-amber-950">{activeModal.user.email}</span>. The previous link will be replaced.</>}
                    confirmLabel="Resend" variant="warning" />
            )}
            {activeModal?.type === 'confirm-edit' && (
                <ConfirmModal isOpen onClose={onClose} onConfirm={onConfirmEdit}
                    title="Save Changes"
                    message={<>Save changes to <span className="font-semibold text-amber-950">{activeModal.user.name}</span>?</>}
                    confirmLabel={editProcessing ? 'Saving...' : 'Save Changes'}
                    loading={editProcessing} variant="warning" />
            )}
        </>
    );
}
