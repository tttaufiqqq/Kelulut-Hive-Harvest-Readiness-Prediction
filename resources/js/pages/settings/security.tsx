import { Form, Head } from '@inertiajs/react';
import { ShieldCheck } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { useRef, useState } from 'react';
import SecurityController from '@/actions/App/Http/Controllers/Settings/SecurityController';
import { Button } from '@/components/core/button';
import { Card } from '@/components/core/card';
import { Heading } from '@/components/settings/heading';
import { PasswordInput } from '@/components/settings/password-input';
import { TwoFactorRecoveryCodes } from '@/components/settings/two-factor-recovery-codes';
import { TwoFactorSetupModal } from '@/components/settings/two-factor-setup-modal';
import { useTwoFactorAuth } from '@/hooks/use-two-factor-auth';
import { AuthenticatedLayout } from '@/layouts/authenticated-layout';
import { SettingsLayout } from '@/layouts/settings/layout';
import { disable, enable } from '@/routes/two-factor';

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
    const passwordInput = useRef<HTMLInputElement>(null);
    const currentPasswordInput = useRef<HTMLInputElement>(null);

    const {
        qrCodeSvg,
        hasSetupData,
        manualSetupKey,
        clearSetupData,
        fetchSetupData,
        recoveryCodesList,
        fetchRecoveryCodes,
        errors,
    } = useTwoFactorAuth();
    const [showSetupModal, setShowSetupModal] = useState<boolean>(false);

    return (
        <AuthenticatedLayout>
            <Head title="Security settings" />

            <h1 className="sr-only">Security settings</h1>

            <SettingsLayout>
                <Card>
                    <div className="space-y-6">
                        <Heading
                            variant="small"
                            title="Update password"
                            description="Ensure your account is using a long, random password to stay secure"
                        />

                        <Form
                            {...SecurityController.update()}
                            options={{
                                preserveScroll: true,
                            }}
                            resetOnError={[
                                'password',
                                'password_confirmation',
                                'current_password',
                            ]}
                            resetOnSuccess
                            onError={(errors) => {
                                if (errors.password) {
                                    passwordInput.current?.focus();
                                }

                                if (errors.current_password) {
                                    currentPasswordInput.current?.focus();
                                }
                            }}
                            className="space-y-6"
                        >
                            {({ errors, processing, recentlySuccessful }) => (
                                <>
                                    <div className="space-y-1.5">
                                        <label className="ml-1 text-sm font-medium text-amber-900">
                                            Current password
                                        </label>
                                        <PasswordInput
                                            id="current_password"
                                            ref={currentPasswordInput}
                                            name="current_password"
                                            autoComplete="current-password"
                                            placeholder="Current password"
                                        />
                                        {errors.current_password && (
                                            <p className="ml-1 text-xs text-red-500">
                                                {errors.current_password}
                                            </p>
                                        )}
                                    </div>

                                    <div className="space-y-1.5">
                                        <label className="ml-1 text-sm font-medium text-amber-900">
                                            New password
                                        </label>
                                        <PasswordInput
                                            id="password"
                                            ref={passwordInput}
                                            name="password"
                                            autoComplete="new-password"
                                            placeholder="New password"
                                        />
                                        {errors.password && (
                                            <p className="ml-1 text-xs text-red-500">
                                                {errors.password}
                                            </p>
                                        )}
                                    </div>

                                    <div className="space-y-1.5">
                                        <label className="ml-1 text-sm font-medium text-amber-900">
                                            Confirm password
                                        </label>
                                        <PasswordInput
                                            id="password_confirmation"
                                            name="password_confirmation"
                                            autoComplete="new-password"
                                            placeholder="Confirm password"
                                        />
                                        {errors.password_confirmation && (
                                            <p className="ml-1 text-xs text-red-500">
                                                {errors.password_confirmation}
                                            </p>
                                        )}
                                    </div>

                                    <div className="flex items-center gap-4">
                                        <Button
                                            variant="primary"
                                            disabled={processing}
                                            data-test="update-password-button"
                                        >
                                            Save password
                                        </Button>

                                        <AnimatePresence>
                                            {recentlySuccessful && (
                                                <motion.p
                                                    initial={{ opacity: 0 }}
                                                    animate={{ opacity: 1 }}
                                                    exit={{ opacity: 0 }}
                                                    transition={{
                                                        duration: 0.3,
                                                    }}
                                                    className="text-sm text-amber-600/60"
                                                >
                                                    Saved
                                                </motion.p>
                                            )}
                                        </AnimatePresence>
                                    </div>
                                </>
                            )}
                        </Form>
                    </div>
                </Card>

                {canManageTwoFactor && (
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
                                        You will be prompted for a secure,
                                        random pin during login, which you can
                                        retrieve from the TOTP-supported
                                        application on your phone.
                                    </p>

                                    <div className="relative inline">
                                        <Form {...disable()}>
                                            {({ processing }) => (
                                                <Button
                                                    variant="destructive"
                                                    type="submit"
                                                    disabled={processing}
                                                >
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
                                        When you enable two-factor
                                        authentication, you will be prompted for
                                        a secure pin during login. This pin can
                                        be retrieved from a TOTP-supported
                                        application on your phone.
                                    </p>

                                    <div>
                                        {hasSetupData ? (
                                            <Button
                                                variant="primary"
                                                onClick={() =>
                                                    setShowSetupModal(true)
                                                }
                                            >
                                                <ShieldCheck />
                                                Continue setup
                                            </Button>
                                        ) : (
                                            <Form
                                                {...enable()}
                                                onSuccess={() =>
                                                    setShowSetupModal(true)
                                                }
                                            >
                                                {({ processing }) => (
                                                    <Button
                                                        variant="primary"
                                                        type="submit"
                                                        disabled={processing}
                                                    >
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
                            onClose={() => setShowSetupModal(false)}
                            requiresConfirmation={requiresConfirmation}
                            twoFactorEnabled={twoFactorEnabled}
                            qrCodeSvg={qrCodeSvg}
                            manualSetupKey={manualSetupKey}
                            clearSetupData={clearSetupData}
                            fetchSetupData={fetchSetupData}
                            errors={errors}
                        />
                    </Card>
                )}
            </SettingsLayout>
        </AuthenticatedLayout>
    );
}
