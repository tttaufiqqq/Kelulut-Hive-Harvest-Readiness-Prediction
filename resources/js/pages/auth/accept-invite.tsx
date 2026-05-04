import { Head, Link, useForm } from '@inertiajs/react';
import { ArrowRight, ExternalLink } from 'lucide-react';
import { BeeIcon as Bee } from '@/components/core/bee-icon';
import { InputError } from '@/components/core/input-error';
import { PasswordInput } from '@/components/settings/password-input';

type Props = {
    email: string;
    userId: number;
    expires: string;
    signature: string;
};

export default function AcceptInvite({
    email,
    userId,
    expires,
    signature,
}: Props) {
    const { data, setData, post, processing, errors } = useForm({
        password: '',
        password_confirmation: '',
        telegram_id: '',
    });

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        post(
            route('invite.accept.store', { user: userId, expires, signature }),
        );
    };

    return (
        <div className="relative flex min-h-screen overflow-hidden bg-[#FFFBEB]">
            <Head title="Set Up Your Account — BuzzyHive 2.0" />

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
                            You're Invited
                        </span>
                        <h1 className="mt-4 text-5xl leading-none font-black tracking-tighter text-amber-950 uppercase">
                            Activate <br />
                            <span className="text-yellow-500">Account.</span>
                        </h1>
                        <p className="mt-3 font-medium text-amber-800/60">
                            Create your password to get started.
                        </p>
                    </div>

                    <form onSubmit={submit} className="space-y-5">
                        {/* Email — read-only */}
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
                        </div>

                        {/* Password */}
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold tracking-widest text-amber-900/60 uppercase">
                                Password
                            </label>
                            <PasswordInput
                                value={data.password}
                                onChange={(e) =>
                                    setData('password', e.target.value)
                                }
                                autoFocus
                                autoComplete="new-password"
                                placeholder="Create a password"
                            />
                            <InputError message={errors.password} />
                        </div>

                        {/* Confirm Password */}
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold tracking-widest text-amber-900/60 uppercase">
                                Confirm Password
                            </label>
                            <PasswordInput
                                value={data.password_confirmation}
                                onChange={(e) =>
                                    setData(
                                        'password_confirmation',
                                        e.target.value,
                                    )
                                }
                                autoComplete="new-password"
                                placeholder="Confirm your password"
                            />
                            <InputError
                                message={errors.password_confirmation}
                            />
                        </div>

                        {/* Telegram Chat ID */}
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold tracking-widest text-amber-900/60 uppercase">
                                Telegram Chat ID{' '}
                                <span className="font-normal text-amber-900/40 normal-case">
                                    (optional)
                                </span>
                            </label>
                            <input
                                type="text"
                                value={data.telegram_id}
                                onChange={(e) =>
                                    setData('telegram_id', e.target.value)
                                }
                                placeholder="e.g. 123456789"
                                className="w-full rounded-2xl border-2 border-amber-200 bg-amber-50/50 px-4 py-3.5 font-medium text-amber-900 focus:border-yellow-400 focus:outline-none"
                            />
                            <button
                                type="button"
                                onClick={() =>
                                    window.open(
                                        'https://t.me/raw_info_bot',
                                        '_blank',
                                    )
                                }
                                className="mt-1 flex items-center gap-1.5 text-xs font-bold text-amber-700 transition-colors hover:text-amber-900"
                            >
                                <ExternalLink className="h-3.5 w-3.5" />
                                Get My Telegram ID
                            </button>
                            <div className="mt-1 space-y-0.5 text-xs text-amber-900/40">
                                <p>1. Open the bot link above</p>
                                <p>2. Send any message to the bot</p>
                                <p>
                                    3. Copy the number shown and paste it here
                                </p>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={processing}
                            className="group flex w-full items-center justify-center gap-2 rounded-2xl bg-yellow-400 py-4 text-lg font-bold text-yellow-950 transition-colors hover:bg-yellow-500 disabled:opacity-50"
                        >
                            {processing ? 'Activating...' : 'Activate Account'}
                            {!processing && (
                                <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
                            )}
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
