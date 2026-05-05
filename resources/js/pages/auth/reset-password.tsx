import { Form, Head } from '@inertiajs/react';
import { ArrowRight } from 'lucide-react';
import { AuthFormFieldBlock } from '@/components/auth/auth-form-field-block';
import { Button } from '@/components/core/button';
import { Input } from '@/components/core/input';
import { PasswordInput } from '@/components/settings/password-input';
import { AuthLayout } from '@/layouts/auth-layout';
import { cn } from '@/lib/utils';
import { update } from '@/routes/password';

type Props = {
    token: string;
    email: string;
};

export default function ResetPassword({ token, email }: Props) {
    return (
        <AuthLayout
            title="Reset Password"
            description="Enter your new password below."
        >
            <Head title="Reset Password — BuzzyHive 2.0" />

            <Form
                {...update()}
                transform={(data) => ({ ...data, token, email })}
                resetOnSuccess={['password', 'password_confirmation']}
                className="space-y-5"
            >
                {({ processing, errors }) => (
                    <>
                        <AuthFormFieldBlock label="Email">
                            <Input
                                type="email"
                                value={email}
                                readOnly
                                error={errors.email}
                                className="cursor-not-allowed border-2 border-amber-100 bg-amber-50 py-3.5 font-medium text-amber-900/60 focus:ring-0"
                            />
                        </AuthFormFieldBlock>

                        <AuthFormFieldBlock
                            label="New Password"
                            error={errors.password}
                        >
                            <PasswordInput
                                id="password"
                                name="password"
                                autoComplete="new-password"
                                autoFocus
                                placeholder="Create a new password"
                                className={cn(
                                    'border-2 border-amber-100 bg-white py-3.5 pr-11 font-medium placeholder:text-amber-300 focus:border-yellow-400 focus:ring-0',
                                    errors.password && 'border-red-400',
                                )}
                            />
                        </AuthFormFieldBlock>

                        <AuthFormFieldBlock
                            label="Confirm Password"
                            error={errors.password_confirmation}
                        >
                            <PasswordInput
                                id="password_confirmation"
                                name="password_confirmation"
                                autoComplete="new-password"
                                placeholder="Confirm your new password"
                                className={cn(
                                    'border-2 border-amber-100 bg-white py-3.5 pr-11 font-medium placeholder:text-amber-300 focus:border-yellow-400 focus:ring-0',
                                    errors.password_confirmation &&
                                        'border-red-400',
                                )}
                            />
                        </AuthFormFieldBlock>

                        <Button
                            type="submit"
                            disabled={processing}
                            className="group w-full gap-2 rounded-2xl py-4 text-lg font-bold hover:bg-yellow-500"
                        >
                            {processing ? 'Resetting...' : 'Reset Password'}
                            {!processing && (
                                <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
                            )}
                        </Button>
                    </>
                )}
            </Form>
        </AuthLayout>
    );
}
