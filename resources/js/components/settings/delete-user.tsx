import { Form } from '@inertiajs/react';
import { useRef, useState } from 'react';
import ProfileController from '@/actions/App/Http/Controllers/Settings/ProfileController';
import { Button } from '@/components/core/button';
import { Modal } from '@/components/core/modal';
import { Heading } from '@/components/settings/heading';
import { PasswordInput } from '@/components/settings/password-input';

export function DeleteUser() {
    const passwordInput = useRef<HTMLInputElement>(null);
    const [showModal, setShowModal] = useState(false);

    return (
        <div className="space-y-6">
            <Heading
                variant="small"
                title="Delete account"
                description="Delete your account and all of its resources"
            />
            <div className="space-y-4 rounded-2xl border border-red-100 bg-red-50 p-4 dark:border-red-200/10 dark:bg-red-700/10">
                <div className="relative space-y-0.5 text-red-700">
                    <p className="font-medium">Warning</p>
                    <p className="text-sm">
                        Please proceed with caution, this cannot be undone.
                    </p>
                </div>

                <Button
                    variant="destructive"
                    data-test="delete-user-button"
                    onClick={() => setShowModal(true)}
                >
                    Delete account
                </Button>
            </div>

            <Modal
                isOpen={showModal}
                onClose={() => setShowModal(false)}
                title="Delete your account?"
            >
                <p className="mb-6 text-sm text-amber-900/60">
                    Once your account is deleted, all of its resources and data
                    will also be permanently deleted. Please enter your password
                    to confirm.
                </p>

                <Form
                    action={ProfileController.destroy()}
                    options={{
                        preserveScroll: true,
                    }}
                    onError={() => passwordInput.current?.focus()}
                    resetOnSuccess
                    className="space-y-6"
                >
                    {({ resetAndClearErrors, processing, errors }) => (
                        <>
                            <div className="space-y-1.5">
                                <label className="ml-1 text-sm font-medium text-amber-900">
                                    Password
                                </label>
                                <PasswordInput
                                    id="password"
                                    name="password"
                                    ref={passwordInput}
                                    placeholder="Enter your password"
                                    autoComplete="current-password"
                                />
                                {errors.password && (
                                    <p className="ml-1 text-xs text-red-500">
                                        {errors.password}
                                    </p>
                                )}
                            </div>

                            <div className="flex gap-3">
                                <Button
                                    type="button"
                                    variant="secondary"
                                    onClick={() => {
                                        resetAndClearErrors();
                                        setShowModal(false);
                                    }}
                                >
                                    Cancel
                                </Button>

                                <Button
                                    variant="destructive"
                                    type="submit"
                                    disabled={processing}
                                    data-test="confirm-delete-user-button"
                                >
                                    Delete account
                                </Button>
                            </div>
                        </>
                    )}
                </Form>
            </Modal>
        </div>
    );
}
