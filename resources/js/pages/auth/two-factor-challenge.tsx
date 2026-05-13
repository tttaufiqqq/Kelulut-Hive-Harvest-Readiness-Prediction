import { Form, Head } from '@inertiajs/react';
import { REGEXP_ONLY_DIGITS } from 'input-otp';
import { ArrowRight } from 'lucide-react';
import { useMemo, useState } from 'react';
import { AuthFormFieldBlock } from '@/components/auth/auth-form-field-block';
import { Button } from '@/components/core/button';
import { Input } from '@/components/core/input';
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
            <Head title="Two-Factor Authentication" />

            <Form
                action={store()}
                className="space-y-5"
                resetOnError
                resetOnSuccess={!showRecoveryInput}
            >
                {({ errors, processing, clearErrors }) => (
                    <>
                        {showRecoveryInput ? (
                            <AuthFormFieldBlock
                                label="Recovery Code"
                                error={errors.recovery_code}
                            >
                                <Input
                                    name="recovery_code"
                                    type="text"
                                    placeholder="Enter recovery code"
                                    autoFocus={showRecoveryInput}
                                    required
                                    error={errors.recovery_code}
                                    className="border-2 border-amber-100 bg-white py-3.5 font-medium placeholder:text-amber-300 focus:border-yellow-400 focus:ring-0"
                                />
                            </AuthFormFieldBlock>
                        ) : (
                            <AuthFormFieldBlock
                                label="Authentication Code"
                                error={errors.code}
                                className="space-y-3"
                            >
                                <div className="flex justify-center">
                                    <InputOTP
                                        name="code"
                                        maxLength={OTP_MAX_LENGTH}
                                        value={code}
                                        onChange={(value) => setCode(value)}
                                        disabled={processing}
                                        pattern={REGEXP_ONLY_DIGITS}
                                        containerClassName="gap-3"
                                        className="disabled:opacity-50"
                                    >
                                        <InputOTPGroup className="gap-3">
                                            {Array.from(
                                                { length: OTP_MAX_LENGTH },
                                                (_, index) => (
                                                    <InputOTPSlot
                                                        key={index}
                                                        index={index}
                                                        className="h-14 w-14 rounded-2xl border-2 border-amber-100 bg-white text-xl font-bold text-amber-950 shadow-none first:rounded-2xl first:border-l-2 last:rounded-2xl focus-within:border-yellow-400 data-[active=true]:border-yellow-400 data-[active=true]:ring-0"
                                                    />
                                                ),
                                            )}
                                        </InputOTPGroup>
                                    </InputOTP>
                                </div>
                            </AuthFormFieldBlock>
                        )}

                        <Button
                            type="submit"
                            disabled={processing}
                            className="group w-full gap-2 rounded-2xl py-4 text-lg font-bold hover:bg-yellow-500"
                        >
                            {processing ? 'Verifying...' : 'Continue'}
                            {!processing && (
                                <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
                            )}
                        </Button>

                        <p className="text-center text-sm text-amber-800/50">
                            <Button
                                type="button"
                                variant="ghost"
                                className="h-auto rounded-none p-0 text-sm font-semibold text-amber-700 underline underline-offset-4 transition-colors hover:bg-transparent hover:text-amber-950"
                                onClick={() => toggleRecoveryMode(clearErrors)}
                            >
                                {authConfigContent.toggleText}
                            </Button>
                        </p>
                    </>
                )}
            </Form>
        </AuthLayout>
    );
}
