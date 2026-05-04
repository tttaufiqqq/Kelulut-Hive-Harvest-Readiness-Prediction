import { Form, Head } from '@inertiajs/react';
import { REGEXP_ONLY_DIGITS } from 'input-otp';
import { ArrowRight } from 'lucide-react';
import { useMemo, useState } from 'react';
import { InputError } from '@/components/core/input-error';
import {
    InputOTP,
    InputOTPGroup,
    InputOTPSlot,
} from '@/components/ui/input-otp';
import { OTP_MAX_LENGTH } from '@/hooks/use-two-factor-auth';
import { AuthLayout } from '@/layouts/auth-layout';
import { store } from '@/routes/two-factor/login';

export default function TwoFactorChallenge() {
    const [showRecoveryInput, setShowRecoveryInput] = useState<boolean>(false);
    const [code, setCode] = useState<string>('');

    const authConfigContent = useMemo<{
        title: string;
        description: string;
        toggleText: string;
    }>(() => {
        if (showRecoveryInput) {
            return {
                title: 'Recovery Code',
                description:
                    'Enter one of your emergency recovery codes to access your account.',
                toggleText: 'Use authentication code instead',
            };
        }

        return {
            title: 'Two-Factor Auth',
            description:
                'Enter the authentication code from your authenticator app.',
            toggleText: 'Use a recovery code instead',
        };
    }, [showRecoveryInput]);

    const toggleRecoveryMode = (clearErrors: () => void): void => {
        setShowRecoveryInput(!showRecoveryInput);
        clearErrors();
        setCode('');
    };

    return (
        <AuthLayout
            title={authConfigContent.title}
            description={authConfigContent.description}
        >
            <Head title="Two-Factor Authentication — BuzzyHive 2.0" />

            <Form
                {...store()}
                className="space-y-5"
                resetOnError
                resetOnSuccess={!showRecoveryInput}
            >
                {({ errors, processing, clearErrors }) => (
                    <>
                        {showRecoveryInput ? (
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold tracking-widest text-amber-900/60 uppercase">
                                    Recovery Code
                                </label>
                                <input
                                    name="recovery_code"
                                    type="text"
                                    placeholder="Enter recovery code"
                                    autoFocus={showRecoveryInput}
                                    required
                                    className="w-full rounded-2xl border-2 border-amber-100 bg-white px-4 py-3.5 font-medium text-amber-950 transition-colors placeholder:text-amber-300 focus:border-yellow-400 focus:outline-none"
                                />
                                <InputError message={errors.recovery_code} />
                            </div>
                        ) : (
                            <div className="space-y-3">
                                <label className="text-xs font-bold tracking-widest text-amber-900/60 uppercase">
                                    Authentication Code
                                </label>
                                <div className="flex justify-center">
                                    <InputOTP
                                        name="code"
                                        maxLength={OTP_MAX_LENGTH}
                                        value={code}
                                        onChange={(value) => setCode(value)}
                                        disabled={processing}
                                        pattern={REGEXP_ONLY_DIGITS}
                                    >
                                        <InputOTPGroup>
                                            {Array.from(
                                                { length: OTP_MAX_LENGTH },
                                                (_, index) => (
                                                    <InputOTPSlot
                                                        key={index}
                                                        index={index}
                                                    />
                                                ),
                                            )}
                                        </InputOTPGroup>
                                    </InputOTP>
                                </div>
                                <InputError message={errors.code} />
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={processing}
                            className="group flex w-full items-center justify-center gap-2 rounded-2xl bg-yellow-400 py-4 text-lg font-bold text-yellow-950 transition-colors hover:bg-yellow-500 disabled:opacity-50"
                        >
                            {processing ? 'Verifying...' : 'Continue'}
                            {!processing && (
                                <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
                            )}
                        </button>

                        <p className="text-center text-sm text-amber-800/50">
                            <button
                                type="button"
                                className="font-semibold text-amber-700 underline underline-offset-4 transition-colors hover:text-amber-950"
                                onClick={() => toggleRecoveryMode(clearErrors)}
                            >
                                {authConfigContent.toggleText}
                            </button>
                        </p>
                    </>
                )}
            </Form>
        </AuthLayout>
    );
}
