import { Form, Head } from '@inertiajs/react';
import { ArrowRight } from 'lucide-react';
import { AuthSplitShell } from '@/components/auth/auth-split-shell';
import { Button } from '@/components/core/button';
import { PasswordInput } from '@/components/settings/password-input';
import { store } from '@/routes/password/confirm';

export default function ConfirmPassword() {
    return (
        <AuthSplitShell
            badge={
                <span className="rounded-full bg-yellow-400 px-3 py-1 text-xs font-bold tracking-widest text-yellow-950 uppercase">
                    Secure Area
                </span>
            }
            title={
                <>
                    Confirm <br />
                    <span className="text-yellow-500">Password.</span>
                </>
            }
            description="Please confirm your password before continuing."
        >
            <Head title="Confirm Password — BuzzyHive 2.0" />

            <Form {...store()} resetOnSuccess={['password']}>
                {({ processing }) => (
                    <div className="space-y-5">
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold tracking-widest text-amber-900/60 uppercase">
                                Password
                            </label>
                            <PasswordInput
                                id="password"
                                name="password"
                                placeholder="••••••••"
                                autoComplete="current-password"
                                autoFocus
                                className="border-2 border-amber-100 bg-white py-3.5 pr-11 font-medium placeholder:text-amber-300 focus:border-yellow-400 focus:ring-0"
                            />
                        </div>

                        <Button
                            type="submit"
                            disabled={processing}
                            className="group w-full gap-2 rounded-2xl py-4 text-lg font-bold hover:bg-yellow-500"
                        >
                            {processing ? 'Confirming...' : 'Confirm Password'}
                            <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
                        </Button>
                    </div>
                )}
            </Form>
        </AuthSplitShell>
    );
}
