import { ConfirmModal } from '@/components/core/overlay/confirm-modal';
import type { DeviceRow } from './DeviceTableRow';

type ConfirmableModal =
    | { type: 'confirm-edit'; device: DeviceRow }
    | { type: 'delete'; device: DeviceRow }
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

export function DeviceConfirmModals({ activeModal, deleting, editProcessing, instant, onConfirmEdit, onConfirmDelete, onClose }: Props) {
    return (
        <>
            {activeModal?.type === 'delete' && (
                <ConfirmModal
                    isOpen
                    onClose={onClose}
                    onConfirm={onConfirmDelete}
                    title="Remove Device"
                    message={
                        <>
                            Remove{' '}
                            <span className="font-mono font-semibold text-amber-950">
                                &ldquo;{activeModal.device.node_identifier}&rdquo;
                            </span>?
                            {activeModal.device.sensor_log_count > 0 ? (
                                <span className="mt-2 block font-medium text-rose-600">
                                    This device has {activeModal.device.sensor_log_count} sensor log(s). Delete the logs first.
                                </span>
                            ) : (
                                <span> This cannot be undone.</span>
                            )}
                        </>
                    }
                    confirmLabel={deleting ? 'Removing...' : 'Remove Device'}
                    variant="destructive"
                    loading={deleting}
                    confirmDisabled={activeModal.device.sensor_log_count > 0}
                />
            )}
            {activeModal?.type === 'confirm-edit' && (
                <ConfirmModal
                    isOpen
                    instant={instant}
                    onClose={onClose}
                    onConfirm={onConfirmEdit}
                    title="Save Changes"
                    message={
                        <>
                            Save changes to device{' '}
                            <span className="font-mono font-semibold text-amber-950">
                                {activeModal.device.node_identifier}
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
