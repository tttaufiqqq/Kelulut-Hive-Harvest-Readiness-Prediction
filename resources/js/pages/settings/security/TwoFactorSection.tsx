import { Form } from '@inertiajs/react';
import { ShieldCheck } from 'lucide-react';
import { Button } from '@/components/core/display/button';
import { Card } from '@/components/core/display/card';
import { Heading } from '@/components/settings/heading';
import { TwoFactorRecoveryCodes } from '@/components/settings/two-factor-recovery-codes';
import { TwoFactorSetupModal } from '@/components/settings/two-factor-setup-modal';
import type { useTwoFactorAuth } from '@/hooks/use-two-factor-auth';
import { disable, enable } from '@/routes/two-factor';

interface Props {
    canManageTwoFactor?: boolean;
    twoFactorEnabled?: boolean;
    requiresConfirmation?: boolean;
    showSetupModal: boolean;
    onToggleSetup: () => void;
    twoFactor: ReturnType<typeof useTwoFactorAuth>;
}

export function TwoFactorSection({
    canManageTwoFactor = false,
    twoFactorEnabled = false,
    requiresConfirmation = false,
    showSetupModal,
    onToggleSetup,
    twoFactor,
}: Props) {
    if (!canManageTwoFactor) {
return null;
}

    const { qrCodeSvg, hasSetupData, manualSetupKey, clearSetupData, fetchSetupData, recoveryCodesList, fetchRecoveryCodes, errors } = twoFactor;

    return (
        <Card>
            <div className="space-y-6">
                <Heading
                    variant="small"
                    title="Two-factor authentication"
                    description="Manage your two-factor authentication settings"
                />
                {twoFactorEnabled ? (
                    <div className="flex flex-col items-start justify-start space-y-4">
                        <p className="text-sm text-amber-900/50">
                            You will be prompted for a secure, random pin during login, which you
                            can retrieve from the TOTP-supported application on your phone.
                        </p>

                        <div className="relative inline">
                            <Form action={disable()}>
                                {({ processing }) => (
                                    <Button variant="destructive" type="submit" disabled={processing}>
                                        Disable 2FA
                                    </Button>
                                )}
                            </Form>
                        </div>

                        <TwoFactorRecoveryCodes
                            recoveryCodesList={recoveryCodesList}
                            fetchRecoveryCodes={fetchRecoveryCodes}
                            errors={errors}
                        />
                    </div>
                ) : (
                    <div className="flex flex-col items-start justify-start space-y-4">
                        <p className="text-sm text-amber-900/50">
                            When you enable two-factor authentication, you will be prompted for a
                            secure pin during login. This pin can be retrieved from a
                            TOTP-supported application on your phone.
                        </p>

                        <div>
                            {hasSetupData ? (
                                <Button variant="primary" onClick={onToggleSetup}>
                                    <ShieldCheck />
                                    Continue setup
                                </Button>
                            ) : (
                                <Form action={enable()} onSuccess={onToggleSetup}>
                                    {({ processing }) => (
                                        <Button variant="primary" type="submit" disabled={processing}>
                                            Enable 2FA
                                        </Button>
                                    )}
                                </Form>
                            )}
                        </div>
                    </div>
                )}
            </div>

            <TwoFactorSetupModal
                isOpen={showSetupModal}
                onClose={onToggleSetup}
                requiresConfirmation={requiresConfirmation}
                twoFactorEnabled={twoFactorEnabled}
                qrCodeSvg={qrCodeSvg}
                manualSetupKey={manualSetupKey}
                clearSetupData={clearSetupData}
                fetchSetupData={fetchSetupData}
                errors={errors}
            />
        </Card>
    );
}
