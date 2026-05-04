import { Head, Link, useForm } from '@inertiajs/react';
import { ArrowRight, Lock, Mail } from 'lucide-react';
import React from 'react';
import { BeeIcon as Bee } from '@/components/core/bee-icon';
import { InputError } from '@/components/core/input-error';

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
        <div className="relative flex min-h-screen overflow-hidden bg-[#FFFBEB]">
            <Head title="Log in — BuzzyHive2.0" />

            <div className="absolute top-0 right-0 z-0 hidden h-full w-1/2 translate-x-1/4 -skew-x-12 bg-amber-950 lg:block" />

            {/* Left Panel - Form */}
            <div className="relative z-10 flex w-full flex-col justify-center px-8 py-12 md:px-16 lg:w-1/2">
                {/* Logo */}
                <Link
                    href="/"
                    className="group mb-16 flex w-fit items-center gap-2"
                >
                    <div className="rounded-xl bg-yellow-400 p-2 transition-colors group-hover:bg-yellow-500">
                        <Bee className="h-5 w-5 text-yellow-950" />
                    </div>
                    <span className="text-lg font-black tracking-tighter text-amber-950 uppercase">
                        BuzzyHive<span className="text-yellow-500">2.0</span>
                    </span>
                </Link>

                <div>
                    <div className="mb-8">
                        <span className="rounded-full bg-yellow-400 px-3 py-1 text-xs font-bold tracking-widest text-yellow-950 uppercase">
                            Welcome Back
                        </span>
                        <h1 className="mt-4 text-5xl leading-none font-black tracking-tighter text-amber-950 uppercase">
                            Sign <br />
                            <span className="text-yellow-500">In.</span>
                        </h1>
                        <p className="mt-3 font-medium text-amber-800/60">
                            Access your apiary dashboard and hive insights.
                        </p>
                    </div>

                    {status && (
                        <div className="mb-6 rounded-2xl bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
                            {status}
                        </div>
                    )}

                    <form onSubmit={submit} className="space-y-5">
                        {/* Email */}
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold tracking-widest text-amber-900/60 uppercase">
                                Email
                            </label>
                            <div className="relative">
                                <Mail className="absolute top-1/2 left-4 h-4 w-4 -translate-y-1/2 text-amber-400" />
                                <input
                                    id="email"
                                    type="email"
                                    value={data.email}
                                    autoComplete="username"
                                    autoFocus
                                    onChange={(e) =>
                                        setData('email', e.target.value)
                                    }
                                    placeholder="you@example.com"
                                    className="w-full rounded-2xl border-2 border-amber-100 bg-white py-3.5 pr-4 pl-11 font-medium text-amber-950 transition-colors placeholder:text-amber-300 focus:border-yellow-400 focus:outline-none"
                                />
                            </div>
                            <InputError message={errors.email} />
                        </div>

                        {/* Password */}
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold tracking-widest text-amber-900/60 uppercase">
                                Password
                            </label>
                            <div className="relative">
                                <Lock className="absolute top-1/2 left-4 h-4 w-4 -translate-y-1/2 text-amber-400" />
                                <input
                                    id="password"
                                    type="password"
                                    value={data.password}
                                    autoComplete="current-password"
                                    onChange={(e) =>
                                        setData('password', e.target.value)
                                    }
                                    placeholder="••••••••"
                                    className="w-full rounded-2xl border-2 border-amber-100 bg-white py-3.5 pr-4 pl-11 font-medium text-amber-950 transition-colors placeholder:text-amber-300 focus:border-yellow-400 focus:outline-none"
                                />
                            </div>
                            <InputError message={errors.password} />
                        </div>

                        {/* Remember & Forgot */}
                        <div className="flex items-center justify-between">
                            <label className="flex cursor-pointer items-center gap-2">
                                <input
                                    type="checkbox"
                                    name="remember"
                                    checked={data.remember}
                                    onChange={(e) =>
                                        setData('remember', e.target.checked)
                                    }
                                    className="rounded border-amber-300 text-yellow-500 focus:ring-yellow-400"
                                />
                                <span className="text-sm font-medium text-amber-800">
                                    Remember me
                                </span>
                            </label>
                            {canResetPassword && (
                                <Link
                                    href="/forgot-password"
                                    className="text-sm font-bold text-yellow-600 underline underline-offset-2 hover:text-yellow-700"
                                >
                                    Forgot password?
                                </Link>
                            )}
                        </div>

                        {/* Submit */}
                        <button
                            type="submit"
                            disabled={processing}
                            className="group flex w-full items-center justify-center gap-2 rounded-2xl bg-yellow-400 py-4 text-lg font-bold text-yellow-950 transition-colors hover:bg-yellow-500 disabled:opacity-50"
                        >
                            {processing ? 'Signing in...' : 'Sign In'}
                            <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
                        </button>
                    </form>
                </div>
            </div>

            {/* Right Panel - Decorative */}
            <div className="relative z-10 hidden w-1/2 items-center justify-center lg:flex">
                <div className="px-12 text-center">
                    <div className="mb-8 inline-block rotate-6 rounded-[2rem] bg-yellow-400 p-8 shadow-2xl">
                        <Bee className="h-16 w-16 text-yellow-950" />
                    </div>
                    <h2 className="mb-4 text-4xl leading-none font-black tracking-tighter text-white uppercase">
                        Harvest <br />
                        <span className="text-yellow-400">Intelligence.</span>
                    </h2>
                    <p className="mx-auto max-w-xs font-medium text-amber-200/60">
                        IoT-integrated harvest readiness prediction for
                        stingless bee farming.
                    </p>
                </div>
            </div>
        </div>
    );
}
