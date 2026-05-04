import { Form, Head } from '@inertiajs/react';
import { ArrowRight, Mail } from 'lucide-react';
import { InputError } from '@/components/core/input-error';
import { TextLink } from '@/components/core/text-link';
import { AuthLayout } from '@/layouts/auth-layout';
import { login } from '@/routes';
import { email } from '@/routes/password';

export default function ForgotPassword({ status }: { status?: string }) {
    return (
        <AuthLayout
            title="Forgot Password"
            description="Enter your email to receive a password reset link."
        >
            <Head title="Forgot Password — BuzzyHive 2.0" />

            {status && (
                <div className="mb-6 rounded-2xl border border-green-200 bg-green-50 px-4 py-3 text-sm font-medium text-green-700">
                    {status}
                </div>
            )}

            <Form {...email()} className="space-y-5">
                {({ processing, errors }) => (
                    <>
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold tracking-widest text-amber-900/60 uppercase">
                                Email Address
                            </label>
                            <div className="relative">
                                <Mail className="absolute top-1/2 left-4 h-4 w-4 -translate-y-1/2 text-amber-400" />
                                <input
                                    id="email"
                                    type="email"
                                    name="email"
                                    autoComplete="email"
                                    autoFocus
                                    placeholder="you@example.com"
                                    className="w-full rounded-2xl border-2 border-amber-100 bg-white py-3.5 pr-4 pl-11 font-medium text-amber-950 transition-colors placeholder:text-amber-300 focus:border-yellow-400 focus:outline-none"
                                />
                            </div>
                            <InputError message={errors.email} />
                        </div>

                        <button
                            type="submit"
                            disabled={processing}
                            className="group flex w-full items-center justify-center gap-2 rounded-2xl bg-yellow-400 py-4 text-lg font-bold text-yellow-950 transition-colors hover:bg-yellow-500 disabled:opacity-50"
                        >
                            {processing ? 'Sending...' : 'Send Reset Link'}
                            {!processing && (
                                <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
                            )}
                        </button>

                        <p className="text-center text-sm text-amber-800/70">
                            Remember it?{' '}
                            <TextLink
                                href={login()}
                                className="font-semibold text-amber-700 decoration-amber-400 hover:text-amber-900"
                            >
                                Back to login
                            </TextLink>
                        </p>
                    </>
                )}
            </Form>
        </AuthLayout>
    );
}
