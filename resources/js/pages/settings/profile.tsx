import { Form, Head, Link, usePage } from '@inertiajs/react';
import { AnimatePresence, motion } from 'motion/react';
import ProfileController from '@/actions/App/Http/Controllers/Settings/ProfileController';
import { Button } from '@/components/core/button';
import { Card } from '@/components/core/card';
import { Input } from '@/components/core/input';
import { DeleteUser } from '@/components/settings/delete-user';
import { Heading } from '@/components/settings/heading';
import { AuthenticatedLayout } from '@/layouts/authenticated-layout';
import { SettingsLayout } from '@/layouts/settings/layout';
import { send } from '@/routes/verification';

export default function Profile({
    mustVerifyEmail,
    status,
}: {
    mustVerifyEmail: boolean;
    status?: string;
}) {
    const { auth } = usePage().props;

    return (
        <AuthenticatedLayout>
            <Head title="Profile settings" />

            <h1 className="sr-only">Profile settings</h1>

            <SettingsLayout>
                <Card>
                    <div className="space-y-6">
                        <Heading
                            variant="small"
                            title="Profile information"
                            description="Update your name and email address"
                        />

                        <Form
                            {...ProfileController.update()}
                            options={{
                                preserveScroll: true,
                            }}
                            className="space-y-6"
                        >
                            {({ processing, recentlySuccessful, errors }) => (
                                <>
                                    <Input
                                        id="name"
                                        label="Name"
                                        defaultValue={auth.user.name}
                                        name="name"
                                        required
                                        autoComplete="name"
                                        placeholder="Full name"
                                        error={errors.name}
                                    />

                                    <Input
                                        id="email"
                                        type="email"
                                        label="Email address"
                                        defaultValue={auth.user.email}
                                        name="email"
                                        required
                                        autoComplete="username"
                                        placeholder="Email address"
                                        error={errors.email}
                                    />

                                    <Input
                                        id="telegram_id"
                                        label="Telegram Chat ID"
                                        defaultValue={
                                            (auth.user as any).telegram_id ?? ''
                                        }
                                        name="telegram_id"
                                        placeholder="e.g. 123456789"
                                        error={(errors as any).telegram_id}
                                    />

                                    {mustVerifyEmail &&
                                        auth.user.email_verified_at ===
                                            null && (
                                            <div>
                                                <p className="-mt-4 text-sm text-amber-600/60">
                                                    Your email address is
                                                    unverified.{' '}
                                                    <Link
                                                        href={send()}
                                                        as="button"
                                                        className="text-yellow-700 underline underline-offset-4 transition-colors hover:text-yellow-900"
                                                    >
                                                        Click here to resend the
                                                        verification email.
                                                    </Link>
                                                </p>

                                                {status ===
                                                    'verification-link-sent' && (
                                                    <div className="mt-2 text-sm font-medium text-emerald-600">
                                                        A new verification link
                                                        has been sent to your
                                                        email address.
                                                    </div>
                                                )}
                                            </div>
                                        )}

                                    <div className="flex items-center gap-4">
                                        <Button
                                            variant="primary"
                                            disabled={processing}
                                            data-test="update-profile-button"
                                        >
                                            Save
                                        </Button>

                                        <AnimatePresence>
                                            {recentlySuccessful && (
                                                <motion.p
                                                    initial={{ opacity: 0 }}
                                                    animate={{ opacity: 1 }}
                                                    exit={{ opacity: 0 }}
                                                    transition={{
                                                        duration: 0.3,
                                                    }}
                                                    className="text-sm text-amber-600/60"
                                                >
                                                    Saved
                                                </motion.p>
                                            )}
                                        </AnimatePresence>
                                    </div>
                                </>
                            )}
                        </Form>
                    </div>
                </Card>

                <DeleteUser />
            </SettingsLayout>
        </AuthenticatedLayout>
    );
}
