import { Form, Head } from '@inertiajs/react';
import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/core/button';
import { TextLink } from '@/components/core/text-link';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AuthLayout } from '@/layouts/auth-layout';
import { logout } from '@/routes';
import { send } from '@/routes/verification';

export default function VerifyEmail({ status }: { status?: string }) {
    return (
        <AuthLayout
            title="Verify Email"
            description="Please verify your email address by clicking the link we sent you."
        >
            <Head title="Email Verification" />

            {status === 'verification-link-sent' && (
                <Alert className="mb-6 rounded-2xl border-green-200 bg-green-50 text-green-700">
                    <AlertDescription className="text-sm font-medium text-green-700">
                        <p>
                            A new verification link has been sent to your email
                            address.
                        </p>
                    </AlertDescription>
                </Alert>
            )}

            <Form action={send()} className="space-y-4">
                {({ processing }) => (
                    <>
                        <Button
                            type="submit"
                            disabled={processing}
                            className="group w-full gap-2 rounded-2xl py-4 text-lg font-bold hover:bg-yellow-500"
                        >
                            {processing
                                ? 'Sending...'
                                : 'Resend Verification Email'}
                            {!processing && (
                                <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
                            )}
                        </Button>

                        <p className="text-center text-sm text-amber-800/50">
                            <TextLink href={logout()}>Log out</TextLink>
                        </p>
                    </>
                )}
            </Form>
        </AuthLayout>
    );
}
