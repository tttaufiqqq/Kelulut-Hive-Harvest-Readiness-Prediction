import { Form, Head } from '@inertiajs/react';
import { ArrowRight } from 'lucide-react';
import { TextLink } from '@/components/core/text-link';
import { AuthLayout } from '@/layouts/auth-layout';
import { logout } from '@/routes';
import { send } from '@/routes/verification';

export default function VerifyEmail({ status }: { status?: string }) {
    return (
        <AuthLayout
            title="Verify Email"
            description="Please verify your email address by clicking the link we sent you."
        >
            <Head title="Email Verification — BuzzyHive 2.0" />

            {status === 'verification-link-sent' && (
                <div className="mb-6 rounded-2xl border border-green-200 bg-green-50 px-4 py-3 text-sm font-medium text-green-700">
                    A new verification link has been sent to your email address.
                </div>
            )}

            <Form {...send()} className="space-y-4">
                {({ processing }) => (
                    <>
                        <button
                            type="submit"
                            disabled={processing}
                            className="group flex w-full items-center justify-center gap-2 rounded-2xl bg-yellow-400 py-4 text-lg font-bold text-yellow-950 transition-colors hover:bg-yellow-500 disabled:opacity-50"
                        >
                            {processing
                                ? 'Sending...'
                                : 'Resend Verification Email'}
                            {!processing && (
                                <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
                            )}
                        </button>

                        <p className="text-center text-sm text-amber-800/50">
                            <TextLink href={logout()}>Log out</TextLink>
                        </p>
                    </>
                )}
            </Form>
        </AuthLayout>
    );
}
