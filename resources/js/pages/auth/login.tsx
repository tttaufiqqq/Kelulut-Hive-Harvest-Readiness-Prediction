import { Head, useForm } from '@inertiajs/react';
import { ArrowRight, Check, Lock, Mail } from 'lucide-react';
import React from 'react';
import { AuthFormFieldBlock } from '@/components/auth/auth-form-field-block';
import { AuthSplitShell } from '@/components/auth/auth-split-shell';
import { Button } from '@/components/core/display/button';
import { Input } from '@/components/core/form/input';
import { TextLink } from '@/components/core/navigation/text-link';
import { PasswordInput } from '@/components/settings/password-input';

export default function Login({
    status,
    canResetPassword,
}: {
    status?: string;
    canResetPassword: boolean;
}) {
    const { data, setData, post, processing, errors, reset } = useForm({
        email: '',
        password: '',
        remember: false,
    });

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        post('/login', {
            onFinish: () => reset('password'),
        });
    };

    return (
        <AuthSplitShell
            badge={
                <span className="rounded-full bg-yellow-400 px-3 py-1 text-xs font-bold tracking-widest text-yellow-950 uppercase">
                    Welcome Back
                </span>
            }
            title={
                <>
                    Sign <br />
                    <span className="text-yellow-500">In.</span>
                </>
            }
            description="Access your apiary dashboard and hive insights."
        >
            <Head title="Log in" />

            {status && (
                <div className="mb-6 rounded-2xl bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
                    {status}
                </div>
            )}

            <form onSubmit={submit} className="space-y-5">
                <AuthFormFieldBlock label="Email">
                    <div className="relative">
                        <Mail className="pointer-events-none absolute top-[1.05rem] left-4 z-10 h-4 w-4 text-amber-400" />
                        <Input
                            id="email"
                            type="email"
                            value={data.email}
                            autoComplete="username"
                            autoFocus
                            onChange={(e) => setData('email', e.target.value)}
                            placeholder="you@example.com"
                            error={errors.email}
                            className="border-2 border-amber-100 bg-white py-3.5 pr-4 pl-11 font-medium placeholder:text-amber-300 focus:border-yellow-400 focus:ring-0"
                        />
                    </div>
                </AuthFormFieldBlock>

                <AuthFormFieldBlock label="Password" error={errors.password}>
                    <div className="relative">
                        <Lock className="pointer-events-none absolute top-1/2 left-4 z-10 h-4 w-4 -translate-y-1/2 text-amber-400" />
                        <PasswordInput
                            id="password"
                            value={data.password}
                            autoComplete="current-password"
                            onChange={(e) => setData('password', e.target.value)}
                            placeholder="••••••••"
                            className="border-2 border-amber-100 bg-white py-3.5 pr-11 pl-11 font-medium placeholder:text-amber-300 focus:border-yellow-400 focus:ring-0"
                        />
                    </div>
                </AuthFormFieldBlock>

                <div className="flex items-center justify-between">
                    <label className="flex cursor-pointer items-center gap-2.5">
                        <input
                            type="checkbox"
                            name="remember"
                            checked={data.remember}
                            onChange={(e) =>
                                setData('remember', e.target.checked)
                            }
                            className="sr-only"
                        />
                        <span
                            className={`flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-md border-2 transition-colors ${
                                data.remember
                                    ? 'border-yellow-400 bg-yellow-400'
                                    : 'border-amber-200 bg-white'
                            }`}
                        >
                            {data.remember && (
                                <Check className="h-3 w-3 text-yellow-950" strokeWidth={3} />
                            )}
                        </span>
                        <span className="text-sm font-medium text-amber-800">
                            Remember me
                        </span>
                    </label>
                    {canResetPassword && (
                        <TextLink
                            href="/forgot-password"
                            className="text-sm font-bold text-yellow-600 decoration-current underline-offset-2 hover:text-yellow-700"
                        >
                            Forgot password?
                        </TextLink>
                    )}
                </div>

                <Button
                    type="submit"
                    disabled={processing}
                    className="group w-full gap-2 rounded-2xl py-4 text-lg font-bold hover:bg-yellow-500"
                >
                    {processing ? 'Signing in...' : 'Sign In'}
                    <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
                </Button>
            </form>
        </AuthSplitShell>
    );
}
