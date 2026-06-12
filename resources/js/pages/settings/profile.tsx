import { Form, Head, usePage } from '@inertiajs/react';
import { AnimatePresence, motion } from 'motion/react';
import ProfileController from '@/actions/App/Http/Controllers/Settings/ProfileController';
import { Button } from '@/components/core/display/button';
import { Card } from '@/components/core/display/card';
import { Input } from '@/components/core/form/input';
import { TextLink } from '@/components/core/navigation/text-link';
import { DeleteUser } from '@/components/settings/delete-user';
import { Heading } from '@/components/settings/heading';
import { Alert, AlertDescription } from '@/components/ui/alert';
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
                            action={ProfileController.update()}
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
                                        id="phone"
                                        type="tel"
                                        label="Phone (optional)"
                                        defaultValue={
                                            (auth.user as any).phone ?? ''
                                        }
                                        name="phone"
                                        placeholder="+60 12-345 6789"
                                        error={(errors as any).phone}
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
                                            <div className="space-y-3">
                                                <Alert className="-mt-4 rounded-2xl border-yellow-100 bg-yellow-50 text-amber-900">
                                                    <AlertDescription className="text-sm text-amber-600/60">
                                                        <p>
                                                            Your email address
                                                            is unverified.{' '}
                                                            <TextLink
                                                                href={send()}
                                                                as="button"
                                                                className="font-medium text-yellow-700 decoration-current underline-offset-4 hover:text-yellow-900"
                                                            >
                                                                Click here to
                                                                resend the
                                                                verification
                                                                email.
                                                            </TextLink>
                                                        </p>
                                                    </AlertDescription>
                                                </Alert>

                                                {status ===
                                                    'verification-link-sent' && (
                                                    <Alert className="rounded-2xl border-green-200 bg-green-50 text-green-700">
                                                        <AlertDescription className="text-sm font-medium text-green-700">
                                                            <p>
                                                                A new
                                                                verification
                                                                link has been
                                                                sent to your
                                                                email address.
                                                            </p>
                                                        </AlertDescription>
                                                    </Alert>
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
