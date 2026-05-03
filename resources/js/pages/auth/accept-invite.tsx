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

export default function AcceptInvite({ email, userId, expires, signature }: Props) {
    const { data, setData, post, processing, errors } = useForm({
        password: '',
        password_confirmation: '',
        telegram_id: '',
    });

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        post(route('invite.accept.store', { user: userId, expires, signature }));
    };

    return (
        <div className="min-h-screen bg-[#FFFBEB] relative flex overflow-hidden">
            <Head title="Set Up Your Account — BuzzyHive 2.0" />

            <div className="absolute top-0 right-0 w-1/2 h-full bg-amber-950 -skew-x-12 translate-x-1/4 z-0 hidden lg:block" />

            {/* Left Panel - Form */}
            <div className="w-full lg:w-1/2 flex flex-col justify-center px-8 md:px-16 py-12 relative z-10">
                {/* Logo */}
                <Link href="/" className="flex items-center gap-2 mb-16 group w-fit">
                    <div className="bg-yellow-400 p-2 rounded-xl group-hover:bg-yellow-500 transition-colors">
                        <Bee className="w-5 h-5 text-yellow-950" />
                    </div>
                    <span className="text-lg font-black tracking-tighter uppercase text-amber-950">
                        BuzzyHive<span className="text-yellow-500">2.0</span>
                    </span>
                </Link>

                <div>
                    <div className="mb-8">
                        <span className="bg-yellow-400 text-yellow-950 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest">
                            You're Invited
                        </span>
                        <h1 className="text-5xl font-black uppercase tracking-tighter text-amber-950 mt-4 leading-none">
                            Activate <br />
                            <span className="text-yellow-500">Account.</span>
                        </h1>
                        <p className="text-amber-800/60 mt-3 font-medium">
                            Create your password to get started.
                        </p>
                    </div>

                    <form onSubmit={submit} className="space-y-5">
                        {/* Email — read-only */}
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold uppercase tracking-widest text-amber-900/60">
                                Email
                            </label>
                            <input
                                type="email"
                                value={email}
                                readOnly
                                className="w-full px-4 py-3.5 rounded-2xl border-2 border-amber-100 bg-amber-50 text-amber-900/60 font-medium cursor-not-allowed"
                            />
                        </div>

                        {/* Password */}
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold uppercase tracking-widest text-amber-900/60">
                                Password
                            </label>
                            <PasswordInput
                                value={data.password}
                                onChange={(e) => setData('password', e.target.value)}
                                autoFocus
                                autoComplete="new-password"
                                placeholder="Create a password"
                            />
                            <InputError message={errors.password} />
                        </div>

                        {/* Confirm Password */}
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold uppercase tracking-widest text-amber-900/60">
                                Confirm Password
                            </label>
                            <PasswordInput
                                value={data.password_confirmation}
                                onChange={(e) => setData('password_confirmation', e.target.value)}
                                autoComplete="new-password"
                                placeholder="Confirm your password"
                            />
                            <InputError message={errors.password_confirmation} />
                        </div>

                        {/* Telegram Chat ID */}
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold uppercase tracking-widest text-amber-900/60">
                                Telegram Chat ID <span className="text-amber-900/40 normal-case font-normal">(optional)</span>
                            </label>
                            <input
                                type="text"
                                value={data.telegram_id}
                                onChange={(e) => setData('telegram_id', e.target.value)}
                                placeholder="e.g. 123456789"
                                className="w-full px-4 py-3.5 rounded-2xl border-2 border-amber-200 bg-amber-50/50 text-amber-900 font-medium focus:outline-none focus:border-yellow-400"
                            />
                            <button
                                type="button"
                                onClick={() => window.open('https://t.me/raw_info_bot', '_blank')}
                                className="flex items-center gap-1.5 text-xs font-bold text-amber-700 hover:text-amber-900 transition-colors mt-1"
                            >
                                <ExternalLink className="w-3.5 h-3.5" />
                                Get My Telegram ID
                            </button>
                            <div className="text-xs text-amber-900/40 space-y-0.5 mt-1">
                                <p>1. Open the bot link above</p>
                                <p>2. Send any message to the bot</p>
                                <p>3. Copy the number shown and paste it here</p>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={processing}
                            className="w-full bg-yellow-400 hover:bg-yellow-500 disabled:opacity-50 text-yellow-950 font-bold py-4 rounded-2xl flex items-center justify-center gap-2 group transition-colors text-lg"
                        >
                            {processing ? 'Activating...' : 'Activate Account'}
                            {!processing && <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />}
                        </button>
                    </form>
                </div>
            </div>

            {/* Right Panel - Decorative */}
            <div className="hidden lg:flex w-1/2 relative z-10 items-center justify-center">
                <div className="text-center px-12">
                    <div className="inline-block bg-yellow-400 p-8 rounded-[2rem] shadow-2xl mb-8 rotate-6">
                        <Bee className="w-16 h-16 text-yellow-950" />
                    </div>

                    <h2 className="text-4xl font-black uppercase tracking-tighter text-white leading-none mb-4">
                        Harvest <br />
                        <span className="text-yellow-400">Intelligence.</span>
                    </h2>
                    <p className="text-amber-200/60 font-medium max-w-xs mx-auto">
                        IoT-integrated harvest readiness prediction for stingless bee farming.
                    </p>
                </div>
            </div>
        </div>
    );
}
