import { Form } from '@inertiajs/react';
import { AnimatePresence, motion } from 'motion/react';
import SecurityController from '@/actions/App/Http/Controllers/Settings/SecurityController';
import { Button } from '@/components/core/button';
import { Card } from '@/components/core/card';
import { InputError } from '@/components/core/input-error';
import { Heading } from '@/components/settings/heading';
import { PasswordInput } from '@/components/settings/password-input';
import { Label } from '@/components/ui/label';

interface Props {
    passwordInputRef: React.RefObject<HTMLInputElement | null>;
    currentPasswordInputRef: React.RefObject<HTMLInputElement | null>;
}

export function PasswordSection({ passwordInputRef, currentPasswordInputRef }: Props) {
    return (
        <Card>
            <div className="space-y-6">
                <Heading
                    variant="small"
                    title="Update password"
                    description="Ensure your account is using a long, random password to stay secure"
                />

                <Form
                    action={SecurityController.update()}
                    options={{ preserveScroll: true }}
                    resetOnError={['password', 'password_confirmation', 'current_password']}
                    resetOnSuccess
                    onError={(errors) => {
                        if (errors.password) passwordInputRef.current?.focus();
                        if (errors.current_password) currentPasswordInputRef.current?.focus();
                    }}
                    className="space-y-6"
                >
                    {({ errors, processing, recentlySuccessful }) => (
                        <>
                            <div className="space-y-1.5">
                                <Label htmlFor="current_password" className="ml-1 text-amber-900">
                                    Current password
                                </Label>
                                <PasswordInput
                                    id="current_password"
                                    ref={currentPasswordInputRef}
                                    name="current_password"
                                    autoComplete="current-password"
                                    placeholder="Current password"
                                />
                                <InputError
                                    message={errors.current_password}
                                    className="ml-1 text-xs text-red-500"
                                />
                            </div>

                            <div className="space-y-1.5">
                                <Label htmlFor="password" className="ml-1 text-amber-900">
                                    New password
                                </Label>
                                <PasswordInput
                                    id="password"
                                    ref={passwordInputRef}
                                    name="password"
                                    autoComplete="new-password"
                                    placeholder="New password"
                                />
                                <InputError
                                    message={errors.password}
                                    className="ml-1 text-xs text-red-500"
                                />
                            </div>

                            <div className="space-y-1.5">
                                <Label
                                    htmlFor="password_confirmation"
                                    className="ml-1 text-amber-900"
                                >
                                    Confirm password
                                </Label>
                                <PasswordInput
                                    id="password_confirmation"
                                    name="password_confirmation"
                                    autoComplete="new-password"
                                    placeholder="Confirm password"
                                />
                                <InputError
                                    message={errors.password_confirmation}
                                    className="ml-1 text-xs text-red-500"
                                />
                            </div>

                            <div className="flex items-center gap-4">
                                <Button
                                    variant="primary"
                                    disabled={processing}
                                    data-test="update-password-button"
                                >
                                    Save password
                                </Button>

                                <AnimatePresence>
                                    {recentlySuccessful && (
                                        <motion.p
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            exit={{ opacity: 0 }}
                                            transition={{ duration: 0.3 }}
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
    );
}
