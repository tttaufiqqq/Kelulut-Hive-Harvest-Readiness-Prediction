import { ConfirmModal } from '@/components/core/overlay/confirm-modal';
import type { SiteRow } from './SiteTableRow';

type ConfirmableModal =
    | { type: 'confirm-edit'; site: SiteRow }
    | { type: 'delete'; site: SiteRow }
    | null;

interface Props {
    activeModal: ConfirmableModal;
    deleting: boolean;
    editProcessing: boolean;
    onConfirmEdit: () => void;
    onConfirmDelete: () => void;
    onClose: () => void;
}

export function SiteConfirmModals({ activeModal, deleting, editProcessing, onConfirmEdit, onConfirmDelete, onClose }: Props) {
    return (
        <>
            {activeModal?.type === 'delete' && (
                <ConfirmModal
                    isOpen
                    onClose={onClose}
                    onConfirm={onConfirmDelete}
                    title="Delete Site"
                    message={
                        <>
                            Delete{' '}
                            <span className="font-semibold text-amber-950">
                                &ldquo;{activeModal.site.name}&rdquo;
                            </span>?
                            {activeModal.site.hive_count > 0 && (
                                <span className="mt-2 block font-medium text-rose-600">
                                    This site has {activeModal.site.hive_count} hive(s) assigned. Reassign them first.
                                </span>
                            )}
                            {activeModal.site.hive_count === 0 && (
                                <span> This cannot be undone.</span>
                            )}
                        </>
                    }
                    confirmLabel={deleting ? 'Deleting...' : 'Delete Site'}
                    variant="destructive"
                    loading={deleting}
                    confirmDisabled={activeModal.site.hive_count > 0}
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
                            Save changes to site{' '}
                            <span className="font-semibold text-amber-950">
                                {activeModal.site.name}
                            </span>?
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
