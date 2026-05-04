import { Form, Head, Link } from '@inertiajs/react';
import { ArrowRight, Lock } from 'lucide-react';
import { BeeIcon as Bee } from '@/components/core/bee-icon';
import { InputError } from '@/components/core/input-error';
import { store } from '@/routes/password/confirm';

export default function ConfirmPassword() {
    return (
        <div className="relative flex min-h-screen overflow-hidden bg-[#FFFBEB]">
            <Head title="Confirm Password — BuzzyHive2.0" />

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
                            Secure Area
                        </span>
                        <h1 className="mt-4 text-5xl leading-none font-black tracking-tighter text-amber-950 uppercase">
                            Confirm <br />
                            <span className="text-yellow-500">Password.</span>
                        </h1>
                        <p className="mt-3 font-medium text-amber-800/60">
                            Please confirm your password before continuing.
                        </p>
                    </div>

                    <Form {...store()} resetOnSuccess={['password']}>
                        {({ processing, errors }) => (
                            <div className="space-y-5">
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold tracking-widest text-amber-900/60 uppercase">
                                        Password
                                    </label>
                                    <div className="relative">
                                        <Lock className="absolute top-1/2 left-4 h-4 w-4 -translate-y-1/2 text-amber-400" />
                                        <input
                                            id="password"
                                            name="password"
                                            type="password"
                                            placeholder="••••••••"
                                            autoComplete="current-password"
                                            autoFocus
                                            className="w-full rounded-2xl border-2 border-amber-100 bg-white py-3.5 pr-4 pl-11 font-medium text-amber-950 transition-colors placeholder:text-amber-300 focus:border-yellow-400 focus:outline-none"
                                        />
                                    </div>
                                    <InputError message={errors.password} />
                                </div>

                                <button
                                    type="submit"
                                    disabled={processing}
                                    className="group flex w-full items-center justify-center gap-2 rounded-2xl bg-yellow-400 py-4 text-lg font-bold text-yellow-950 transition-colors hover:bg-yellow-500 disabled:opacity-50"
                                >
                                    {processing
                                        ? 'Confirming...'
                                        : 'Confirm Password'}
                                    <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
                                </button>
                            </div>
                        )}
                    </Form>
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
