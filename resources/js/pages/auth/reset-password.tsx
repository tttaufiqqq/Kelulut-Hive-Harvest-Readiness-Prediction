import { Form, Head } from '@inertiajs/react';
import { ArrowRight } from 'lucide-react';
import { InputError } from '@/components/core/input-error';
import { PasswordInput } from '@/components/settings/password-input';
import { AuthLayout } from '@/layouts/auth-layout';
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
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold tracking-widest text-amber-900/60 uppercase">
                                Email
                            </label>
                            <input
                                type="email"
                                value={email}
                                readOnly
                                className="w-full cursor-not-allowed rounded-2xl border-2 border-amber-100 bg-amber-50 px-4 py-3.5 font-medium text-amber-900/60"
                            />
                            <InputError message={errors.email} />
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-xs font-bold tracking-widest text-amber-900/60 uppercase">
                                New Password
                            </label>
                            <PasswordInput
                                id="password"
                                name="password"
                                autoComplete="new-password"
                                autoFocus
                                placeholder="Create a new password"
                            />
                            <InputError message={errors.password} />
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-xs font-bold tracking-widest text-amber-900/60 uppercase">
                                Confirm Password
                            </label>
                            <PasswordInput
                                id="password_confirmation"
                                name="password_confirmation"
                                autoComplete="new-password"
                                placeholder="Confirm your new password"
                            />
                            <InputError
                                message={errors.password_confirmation}
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={processing}
                            className="group flex w-full items-center justify-center gap-2 rounded-2xl bg-yellow-400 py-4 text-lg font-bold text-yellow-950 transition-colors hover:bg-yellow-500 disabled:opacity-50"
                        >
                            {processing ? 'Resetting...' : 'Reset Password'}
                            {!processing && (
                                <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
                            )}
                        </button>
                    </>
                )}
            </Form>
        </AuthLayout>
    );
}
