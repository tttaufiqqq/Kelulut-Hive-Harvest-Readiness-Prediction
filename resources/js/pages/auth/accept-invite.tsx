import { Head, useForm } from '@inertiajs/react';
import { ArrowRight, ExternalLink } from 'lucide-react';
import { AuthFormFieldBlock } from '@/components/auth/auth-form-field-block';
import { AuthSplitShell } from '@/components/auth/auth-split-shell';
import { Button } from '@/components/core/button';
import { Input } from '@/components/core/input';
import { InputError } from '@/components/core/input-error';
import { TextLink } from '@/components/core/text-link';
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
        <AuthSplitShell
            badge={
                <span className="rounded-full bg-yellow-400 px-3 py-1 text-xs font-bold tracking-widest text-yellow-950 uppercase">
                    You're Invited
                </span>
            }
            title={
                <>
                    Activate <br />
                    <span className="text-yellow-500">Account.</span>
                </>
            }
            description="Create your password to get started."
        >
            <Head title="Set Up Your Account — BuzzyHive 2.0" />

            <form onSubmit={submit} className="space-y-5">
                <AuthFormFieldBlock label="Email">
                    <Input
                        type="email"
                        value={email}
                        readOnly
                        className="cursor-not-allowed border-2 border-amber-100 bg-amber-50 py-3.5 font-medium text-amber-900/60 focus:ring-0"
                    />
                </AuthFormFieldBlock>

                <div className="space-y-1.5">
                    <label className="text-xs font-bold tracking-widest text-amber-900/60 uppercase">
                        Password
                    </label>
                    <PasswordInput
                        value={data.password}
                        onChange={(e) => setData('password', e.target.value)}
                        autoFocus
                        autoComplete="new-password"
                        placeholder="Create a password"
                        className="border-2 border-amber-100 bg-white py-3.5 pr-11 font-medium placeholder:text-amber-300 focus:border-yellow-400 focus:ring-0"
                    />
                    <InputError message={errors.password} />
                </div>

                <div className="space-y-1.5">
                    <label className="text-xs font-bold tracking-widest text-amber-900/60 uppercase">
                        Confirm Password
                    </label>
                    <PasswordInput
                        value={data.password_confirmation}
                        onChange={(e) =>
                            setData('password_confirmation', e.target.value)
                        }
                        autoComplete="new-password"
                        placeholder="Confirm your password"
                        className="border-2 border-amber-100 bg-white py-3.5 pr-11 font-medium placeholder:text-amber-300 focus:border-yellow-400 focus:ring-0"
                    />
                    <InputError message={errors.password_confirmation} />
                </div>

                <AuthFormFieldBlock
                    label="Telegram Chat ID"
                    labelSuffix="(optional)"
                    error={errors.telegram_id}
                    helperText={
                        <div className="mt-1 space-y-0.5">
                            <p>1. Open the bot link above</p>
                            <p>2. Send any message to the bot</p>
                            <p>3. Copy the number shown and paste it here</p>
                        </div>
                    }
                >
                    <Input
                        type="text"
                        value={data.telegram_id}
                        onChange={(e) => setData('telegram_id', e.target.value)}
                        placeholder="e.g. 123456789"
                        className="border-2 border-amber-200 bg-amber-50/50 py-3.5 font-medium text-amber-900 focus:border-yellow-400 focus:ring-0"
                    />
                    <TextLink
                        href="https://t.me/raw_info_bot"
                        target="_blank"
                        rel="noreferrer"
                        className="mt-1 inline-flex items-center gap-1.5 text-xs font-bold text-amber-700 no-underline hover:text-amber-900"
                    >
                        <ExternalLink className="h-3.5 w-3.5" />
                        Get My Telegram ID
                    </TextLink>
                </AuthFormFieldBlock>

                <Button
                    type="submit"
                    disabled={processing}
                    className="group w-full gap-2 rounded-2xl py-4 text-lg font-bold hover:bg-yellow-500"
                >
                    {processing ? 'Activating...' : 'Activate Account'}
                    {!processing && (
                        <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
                    )}
                </Button>
            </form>
        </AuthSplitShell>
    );
}
