import { useCallback, useEffect, useMemo, useState } from 'react';
import { Modal } from '@/components/core/modal';
import type { UiError } from '@/types';
import { GridScanIcon } from './two-factor-setup-modal/GridScanIcon';
import { SetupStep } from './two-factor-setup-modal/SetupStep';
import { VerificationStep } from './two-factor-setup-modal/VerificationStep';

type Props = {
    isOpen: boolean;
    onClose: () => void;
    requiresConfirmation: boolean;
    twoFactorEnabled: boolean;
    qrCodeSvg: string | null;
    manualSetupKey: string | null;
    clearSetupData: () => void;
    fetchSetupData: () => Promise<void>;
    errors: UiError[];
};

export function TwoFactorSetupModal({ isOpen, onClose, requiresConfirmation, twoFactorEnabled, qrCodeSvg, manualSetupKey, clearSetupData, fetchSetupData, errors }: Props) {
    const [showVerificationStep, setShowVerificationStep] = useState<boolean>(false);

    const modalConfig = useMemo<{ title: string; description: string; buttonText: string }>(() => {
        if (twoFactorEnabled) {
            return { title: 'Two-factor authentication enabled', description: 'Two-factor authentication is now enabled. Scan the QR code or enter the setup key in your authenticator app.', buttonText: 'Close' };
        }
        if (showVerificationStep) {
            return { title: 'Verify authentication code', description: 'Enter the 6-digit code from your authenticator app', buttonText: 'Continue' };
        }
        return { title: 'Enable two-factor authentication', description: 'To finish enabling two-factor authentication, scan the QR code or enter the setup key in your authenticator app', buttonText: 'Continue' };
    }, [twoFactorEnabled, showVerificationStep]);

    const handleModalNextStep = useCallback(() => {
        if (requiresConfirmation) { setShowVerificationStep(true); return; }
        clearSetupData();
        onClose();
    }, [requiresConfirmation, clearSetupData, onClose]);

    const resetModalState = useCallback(() => {
        setShowVerificationStep(false);
        if (twoFactorEnabled) { clearSetupData(); }
    }, [twoFactorEnabled, clearSetupData]);

    useEffect(() => {
        if (isOpen && !qrCodeSvg) { fetchSetupData(); }
    }, [isOpen, qrCodeSvg, fetchSetupData]);

    const handleClose = useCallback(() => { resetModalState(); onClose(); }, [onClose, resetModalState]);

    return (
        <Modal isOpen={isOpen} onClose={handleClose} title={modalConfig.title}>
            <div className="flex flex-col items-center space-y-5">
                <GridScanIcon />
                <p className="-mt-2 text-center text-sm text-amber-900/60">{modalConfig.description}</p>
                {showVerificationStep ? (
                    <VerificationStep onClose={onClose} onBack={() => setShowVerificationStep(false)} />
                ) : (
                    <SetupStep qrCodeSvg={qrCodeSvg} manualSetupKey={manualSetupKey} buttonText={modalConfig.buttonText} onNextStep={handleModalNextStep} errors={errors} />
                )}
            </div>
        </Modal>
    );
}
