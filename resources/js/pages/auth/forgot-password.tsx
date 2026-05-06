import { Form, Head } from '@inertiajs/react';
import { ArrowRight, Mail } from 'lucide-react';
import { AuthFormFieldBlock } from '@/components/auth/auth-form-field-block';
import { Button } from '@/components/core/button';
import { Input } from '@/components/core/input';
import { TextLink } from '@/components/core/text-link';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AuthLayout } from '@/layouts/auth-layout';
import { login } from '@/routes';
import { email } from '@/routes/password';

export default function ForgotPassword({ status }: { status?: string }) {
    return (
        <AuthLayout
            title="Forgot Password"
            description="Enter your email to receive a password reset link."
        >
            <Head title="Forgot Password" />

            {status && (
                <Alert className="mb-6 rounded-2xl border-green-200 bg-green-50 text-green-700">
                    <AlertDescription className="text-sm font-medium text-green-700">
                        <p>{status}</p>
                    </AlertDescription>
                </Alert>
            )}

            <Form {...email()} className="space-y-5">
                {({ processing, errors }) => (
                    <>
                        <AuthFormFieldBlock label="Email Address">
                            <div className="relative">
                                <Mail className="pointer-events-none absolute top-[1.05rem] left-4 z-10 h-4 w-4 text-amber-400" />
                                <Input
                                    id="email"
                                    type="email"
                                    name="email"
                                    autoComplete="email"
                                    autoFocus
                                    placeholder="you@example.com"
                                    error={errors.email}
                                    className="border-2 border-amber-100 bg-white py-3.5 pr-4 pl-11 font-medium placeholder:text-amber-300 focus:border-yellow-400 focus:ring-0"
                                />
                            </div>
                        </AuthFormFieldBlock>

                        <Button
                            type="submit"
                            disabled={processing}
                            className="group w-full gap-2 rounded-2xl py-4 text-lg font-bold hover:bg-yellow-500"
                        >
                            {processing ? 'Sending...' : 'Send Reset Link'}
                            {!processing && (
                                <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
                            )}
                        </Button>

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
