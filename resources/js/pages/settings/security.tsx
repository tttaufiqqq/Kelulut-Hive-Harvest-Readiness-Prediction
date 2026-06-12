import { Head } from '@inertiajs/react';
import { useRef, useState } from 'react';
import { useTwoFactorAuth } from '@/hooks/use-two-factor-auth';
import { AuthenticatedLayout } from '@/layouts/authenticated-layout';
import { SettingsLayout } from '@/layouts/settings/layout';
import { PasswordSection } from './security/PasswordSection';
import { TwoFactorSection } from './security/TwoFactorSection';

type Props = {
    canManageTwoFactor?: boolean;
    requiresConfirmation?: boolean;
    twoFactorEnabled?: boolean;
};

export default function Security({
    canManageTwoFactor = false,
    requiresConfirmation = false,
    twoFactorEnabled = false,
}: Props) {
    const passwordInputRef = useRef<HTMLInputElement>(null);
    const currentPasswordInputRef = useRef<HTMLInputElement>(null);
    const twoFactor = useTwoFactorAuth();
    const [showSetupModal, setShowSetupModal] = useState(false);

    return (
        <AuthenticatedLayout>
            <Head title="Security settings" />
            <h1 className="sr-only">Security settings</h1>

            <SettingsLayout>
                <PasswordSection
                    passwordInputRef={passwordInputRef}
                    currentPasswordInputRef={currentPasswordInputRef}
                />

                <TwoFactorSection
                    canManageTwoFactor={canManageTwoFactor}
                    twoFactorEnabled={twoFactorEnabled}
                    requiresConfirmation={requiresConfirmation}
                    showSetupModal={showSetupModal}
                    onToggleSetup={() => setShowSetupModal((prev) => !prev)}
                    twoFactor={twoFactor}
                />
            </SettingsLayout>
        </AuthenticatedLayout>
    );
}
