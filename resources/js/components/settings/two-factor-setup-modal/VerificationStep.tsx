import { Form } from '@inertiajs/react';
import { REGEXP_ONLY_DIGITS } from 'input-otp';
import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/core/button';
import { InputError } from '@/components/core/input-error';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import { OTP_MAX_LENGTH } from '@/hooks/use-two-factor-auth';
import { confirm } from '@/routes/two-factor';

export interface VerificationStepProps {
    onClose: () => void;
    onBack: () => void;
}

export function VerificationStep({ onClose, onBack }: VerificationStepProps) {
    const [code, setCode] = useState<string>('');
    const pinInputContainerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        setTimeout(() => {
            pinInputContainerRef.current?.querySelector('input')?.focus();
        }, 0);
    }, []);

    return (
        <Form action={confirm()} onSuccess={() => onClose()} resetOnError resetOnSuccess>
            {({ processing, errors }: { processing: boolean; errors?: { confirmTwoFactorAuthentication?: { code?: string } } }) => (
                <>
                    <div ref={pinInputContainerRef} className="relative w-full space-y-3">
                        <div className="flex w-full flex-col items-center space-y-3 py-2">
                            <InputOTP id="otp" name="code" maxLength={OTP_MAX_LENGTH} onChange={setCode} disabled={processing} pattern={REGEXP_ONLY_DIGITS}>
                                <InputOTPGroup>
                                    {Array.from({ length: OTP_MAX_LENGTH }, (_, index) => (
                                        <InputOTPSlot key={index} index={index} />
                                    ))}
                                </InputOTPGroup>
                            </InputOTP>
                            <InputError message={errors?.confirmTwoFactorAuthentication?.code} />
                        </div>

                        <div className="flex w-full space-x-5">
                            <Button type="button" variant="outline" className="flex-1" onClick={onBack} disabled={processing}>
                                Back
                            </Button>
                            <Button type="submit" variant="primary" className="flex-1" disabled={processing || code.length < OTP_MAX_LENGTH}>
                                Confirm
                            </Button>
                        </div>
                    </div>
                </>
            )}
        </Form>
    );
}
