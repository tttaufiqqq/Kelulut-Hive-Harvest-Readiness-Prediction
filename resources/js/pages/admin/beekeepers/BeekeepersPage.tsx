import { Head, Link, router, useForm, usePage } from '@inertiajs/react';
import {
    MoreVertical,
    Plus,
    RefreshCw,
    Power,
    Edit2,
    Trash2,
    ChevronLeft,
    ChevronRight,
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { Button } from '@/components/core/button';
import { Card } from '@/components/core/card';
import { Dropdown } from '@/components/core/dropdown';
import { FlashAlerts } from '@/components/core/flash-alerts';
import type { FlashMessageBag } from '@/components/core/flash-alerts';
import { Input } from '@/components/core/input';
import { Modal } from '@/components/core/modal';
import { AdminLayout } from '@/layouts/admin-layout';
import type { PaginatedUsers, User } from '@/types';

type Props = {
    beekeepers: PaginatedUsers;
    stats: { total: number; pending: number; active: number };
};

type ActiveModal =
    | { type: 'create' }
    | { type: 'view'; index: number }
    | { type: 'edit'; user: User }
    | { type: 'toggle'; user: User }
    | { type: 'resend'; user: User }
    | { type: 'delete'; user: User }
    | null;

function StatusBadge({ status }: { status: string }) {
    if (status === 'pending') {
        return (
            <span className="inline-flex items-center rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-bold text-amber-700">
                Pending
            </span>
        );
    }

    if (status === 'active') {
        return (
            <span className="inline-flex items-center rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-bold text-emerald-700">
                Active
            </span>
        );
    }

    return (
        <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-bold text-gray-500">
            Deactivated
        </span>
    );
}

export default function BeekeepersIndex({ beekeepers, stats }: Props) {
    const { props } = usePage<{ flash?: FlashMessageBag }>();
    const flash = props.flash;

    const [activeModal, setActiveModal] = useState<ActiveModal>(null);
    const [deleting, setDeleting] = useState(false);
    const close = () => setActiveModal(null);

    const viewIndex = activeModal?.type === 'view' ? activeModal.index : null;
    const viewBeekeeper =
        viewIndex !== null ? beekeepers.data[viewIndex] : null;
    const hasPrev = viewIndex !== null && viewIndex > 0;
    const hasNext =
        viewIndex !== null && viewIndex < beekeepers.data.length - 1;

    useEffect(() => {
        if (viewIndex === null) {
            return;
        }

        const handler = (e: KeyboardEvent) => {
            if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
                e.preventDefault();
                setActiveModal((prev) =>
                    prev?.type === 'view' && prev.index > 0
                        ? { type: 'view', index: prev.index - 1 }
                        : prev,
                );
            }

            if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
                e.preventDefault();
                setActiveModal((prev) =>
                    prev?.type === 'view' &&
                    prev.index < beekeepers.data.length - 1
                        ? { type: 'view', index: prev.index + 1 }
                        : prev,
                );
            }
        };
        window.addEventListener('keydown', handler);

        return () => window.removeEventListener('keydown', handler);
    }, [viewIndex, beekeepers.data.length]);

    // Create form
    const createForm = useForm({ name: '', email: '', phone: '' });

    // Edit form
    const editForm = useForm({ name: '', email: '', phone: '' });

    const openEdit = (user: User) => {
        editForm.setData({
            name: user.name,
            email: user.email,
            phone: user.phone ?? '',
        });
        setActiveModal({ type: 'edit', user });
    };

    const submitCreate = (e: React.FormEvent) => {
        e.preventDefault();

        const errors: Record<string, string> = {};

        if (
            !createForm.data.name.trim() ||
            createForm.data.name.trim().length < 2
        ) {
            errors.name = 'Name must be at least 2 characters.';
        } else if (!/^[\p{L}\s'\-.]+$/u.test(createForm.data.name.trim())) {
            errors.name = 'Name must contain letters only.';
        }

        if (!/^[\w.%+-]+@[\w.-]+\.[a-zA-Z]{2,}$/.test(createForm.data.email)) {
            errors.email = 'Enter a valid email address.';
        }

        if (
            createForm.data.phone &&
            !/^(\+?60|0)[0-9\s-]{8,14}$/.test(createForm.data.phone)
        ) {
            errors.phone = 'Use Malaysian format e.g. 012-345 6789';
        }

        if (Object.keys(errors).length > 0) {
            createForm.setError(errors as never);

            return;
        }

        createForm.post(route('admin.beekeepers.store'), {
            onSuccess: () => {
                createForm.reset();
                close();
            },
        });
    };

    const submitEdit = (e: React.FormEvent) => {
        e.preventDefault();

        if (activeModal?.type !== 'edit') {
            return;
        }

        const errors: Record<string, string> = {};

        if (
            !editForm.data.name.trim() ||
            editForm.data.name.trim().length < 2
        ) {
            errors.name = 'Name must be at least 2 characters.';
        } else if (!/^[\p{L}\s'\-.]+$/u.test(editForm.data.name.trim())) {
            errors.name = 'Name must contain letters only.';
        }

        if (!/^[\w.%+-]+@[\w.-]+\.[a-zA-Z]{2,}$/.test(editForm.data.email)) {
            errors.email = 'Enter a valid email address.';
        }

        if (
            editForm.data.phone &&
            !/^(\+?60|0)[0-9\s-]{8,14}$/.test(editForm.data.phone)
        ) {
            errors.phone = 'Use Malaysian format e.g. 012-345 6789';
        }

        if (Object.keys(errors).length > 0) {
            editForm.setError(errors as never);

            return;
        }

        editForm.patch(
            route('admin.beekeepers.update', { user: activeModal.user.id }),
            {
                onSuccess: () => close(),
            },
        );
    };

    const confirmToggle = () => {
        if (activeModal?.type !== 'toggle') {
            return;
        }

        router.patch(
            route('admin.beekeepers.toggle-status', {
                user: activeModal.user.id,
            }),
            {},
            {
                onSuccess: () => close(),
            },
        );
    };

    const confirmResend = () => {
        if (activeModal?.type !== 'resend') {
            return;
        }

        router.post(
            route('admin.beekeepers.resend-invite', {
                user: activeModal.user.id,
            }),
            {},
            {
                onSuccess: () => close(),
            },
        );
    };

    const confirmDelete = () => {
        if (activeModal?.type !== 'delete') {
            return;
        }

        setDeleting(true);
        router.delete(
            route('admin.beekeepers.destroy', { user: activeModal.user.id }),
            {
                onFinish: () => {
                    setDeleting(false);
                    close();
                },
            },
        );
    };

    return (
        <AdminLayout>
            <Head title="Beekeepers — Admin" />

            <div className="space-y-6">
                {/* Flash messages */}
                <FlashAlerts
                    key={flash?.id ?? 'beekeeper-flash'}
                    flash={flash}
                />

                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h3 className="text-lg font-bold text-amber-900">
                            Beekeepers
                        </h3>
                        <p className="text-sm text-amber-900/50">
                            {stats.total} total · {stats.pending} pending ·{' '}
                            {stats.active} active
                        </p>
                    </div>
                    <Button
                        variant="primary"
                        size="sm"
                        onClick={() => setActiveModal({ type: 'create' })}
                    >
                        <Plus className="mr-1 h-4 w-4" />
                        Add Beekeeper
                    </Button>
                </div>

                {/* Table */}
                <Card className="overflow-hidden p-0">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-yellow-100 bg-yellow-50/50">
                                    <th className="px-6 py-3 text-left text-xs font-bold tracking-widest text-amber-900/50 uppercase">
                                        Name
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-bold tracking-widest text-amber-900/50 uppercase">
                                        Email
                                    </th>
                                    <th className="hidden px-6 py-3 text-left text-xs font-bold tracking-widest text-amber-900/50 uppercase md:table-cell">
                                        Phone
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-bold tracking-widest text-amber-900/50 uppercase">
                                        Status
                                    </th>
                                    <th className="hidden px-6 py-3 text-left text-xs font-bold tracking-widest text-amber-900/50 uppercase lg:table-cell">
                                        Joined
                                    </th>
                                    <th className="px-6 py-3" />
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-yellow-50">
                                {beekeepers.data.length === 0 && (
                                    <tr>
                                        <td
                                            colSpan={6}
                                            className="px-6 py-10 text-center text-sm text-amber-900/40"
                                        >
                                            No beekeepers yet. Add one to get
                                            started.
                                        </td>
                                    </tr>
                                )}
                                {beekeepers.data.map((user, index) => (
                                    <tr
                                        key={user.id}
                                        className="cursor-pointer transition-colors hover:bg-yellow-50/30"
                                        onClick={() =>
                                            setActiveModal({
                                                type: 'view',
                                                index,
                                            })
                                        }
                                    >
                                        <td className="px-6 py-4 font-medium text-amber-950">
                                            {user.name}
                                        </td>
                                        <td className="px-6 py-4 text-amber-900/70">
                                            {user.email}
                                        </td>
                                        <td className="hidden px-6 py-4 text-amber-900/70 md:table-cell">
                                            {user.phone ?? '—'}
                                        </td>
                                        <td className="px-6 py-4">
                                            <StatusBadge
                                                status={user.status ?? 'active'}
                                            />
                                        </td>
                                        <td className="hidden px-6 py-4 text-amber-900/50 lg:table-cell">
                                            {new Date(
                                                user.created_at,
                                            ).toLocaleDateString()}
                                        </td>
                                        <td
                                            className="px-6 py-4 text-right"
                                            onClick={(e) => e.stopPropagation()}
                                        >
                                            <Dropdown
                                                align="right"
                                                trigger={
                                                    <button className="rounded-xl p-1.5 transition-colors hover:bg-yellow-100">
                                                        <MoreVertical className="h-4 w-4 text-amber-900/50" />
                                                    </button>
                                                }
                                                items={[
                                                    {
                                                        id: 'edit',
                                                        label: 'Edit',
                                                        icon: (
                                                            <Edit2 className="h-4 w-4" />
                                                        ),
                                                        onClick: () =>
                                                            openEdit(user),
                                                    },
                                                    ...(user.status ===
                                                    'pending'
                                                        ? [
                                                              {
                                                                  id: 'resend',
                                                                  label: 'Resend Invite',
                                                                  icon: (
                                                                      <RefreshCw className="h-4 w-4" />
                                                                  ),
                                                                  onClick: () =>
                                                                      setActiveModal(
                                                                          {
                                                                              type: 'resend',
                                                                              user,
                                                                          },
                                                                      ),
                                                              },
                                                          ]
                                                        : []),
                                                    {
                                                        id: 'toggle',
                                                        label:
                                                            user.status ===
                                                            'active'
                                                                ? 'Deactivate'
                                                                : 'Reactivate',
                                                        icon: (
                                                            <Power className="h-4 w-4" />
                                                        ),
                                                        variant:
                                                            user.status ===
                                                            'active'
                                                                ? ('danger' as const)
                                                                : ('default' as const),
                                                        onClick: () =>
                                                            setActiveModal({
                                                                type: 'toggle',
                                                                user,
                                                            }),
                                                    },
                                                    {
                                                        id: 'delete',
                                                        label: 'Delete',
                                                        icon: (
                                                            <Trash2 className="h-4 w-4" />
                                                        ),
                                                        variant:
                                                            'danger' as const,
                                                        onClick: () =>
                                                            setActiveModal({
                                                                type: 'delete',
                                                                user,
                                                            }),
                                                    },
                                                ]}
                                            />
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </Card>

                {/* Pagination */}
                {beekeepers.last_page > 1 && (
                    <div className="flex items-center justify-center gap-1">
                        {beekeepers.links.map((link, i) =>
                            link.url ? (
                                <Link
                                    key={i}
                                    href={link.url}
                                    className={`rounded-lg px-3 py-1.5 text-sm transition-colors ${
                                        link.active
                                            ? 'bg-amber-500 font-semibold text-white'
                                            : 'text-amber-900/70 hover:bg-yellow-100'
                                    }`}
                                    dangerouslySetInnerHTML={{
                                        __html: link.label,
                                    }}
                                />
                            ) : (
                                <span
                                    key={i}
                                    className="px-3 py-1.5 text-sm text-amber-900/30"
                                    dangerouslySetInnerHTML={{
                                        __html: link.label,
                                    }}
                                />
                            ),
                        )}
                    </div>
                )}
            </div>

            {/* ── Create Modal ───────────────────────────────────────── */}
            <Modal
                isOpen={activeModal?.type === 'create'}
                onClose={close}
                title="Add Beekeeper"
                maxWidth="md"
            >
                <form onSubmit={submitCreate} className="space-y-4">
                    <Input
                        label="Name"
                        value={createForm.data.name}
                        onChange={(e) =>
                            createForm.setData('name', e.target.value)
                        }
                        placeholder="Full name"
                        autoFocus
                        error={createForm.errors.name}
                    />
                    <Input
                        label="Email"
                        type="email"
                        value={createForm.data.email}
                        onChange={(e) =>
                            createForm.setData('email', e.target.value)
                        }
                        placeholder="email@example.com"
                        error={createForm.errors.email}
                    />
                    <Input
                        label="Phone (optional)"
                        type="tel"
                        value={createForm.data.phone}
                        onChange={(e) =>
                            createForm.setData(
                                'phone',
                                e.target.value.replace(/[^\d+\-\s]/g, ''),
                            )
                        }
                        placeholder="+60 12-345 6789"
                        error={createForm.errors.phone}
                    />
                    <div className="flex gap-3 pt-2">
                        <Button
                            type="button"
                            variant="ghost"
                            onClick={close}
                            className="flex-1"
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            variant="primary"
                            disabled={createForm.processing}
                            className="flex-1"
                        >
                            {createForm.processing
                                ? 'Sending...'
                                : 'Send Invite'}
                        </Button>
                    </div>
                </form>
            </Modal>

            {/* ── View Modal ─────────────────────────────────────────── */}
            {activeModal?.type === 'view' && viewBeekeeper && (
                <Modal
                    isOpen
                    onClose={close}
                    title="Beekeeper Details"
                    maxWidth="lg"
                >
                    <div className="space-y-4">
                        <div className="-mt-1 mb-1 flex items-center justify-end gap-1">
                            <button
                                onClick={() =>
                                    setActiveModal((prev) =>
                                        prev?.type === 'view' && prev.index > 0
                                            ? {
                                                  type: 'view',
                                                  index: prev.index - 1,
                                              }
                                            : prev,
                                    )
                                }
                                disabled={!hasPrev}
                                className="rounded-xl p-1.5 transition-colors hover:bg-yellow-100 disabled:cursor-not-allowed disabled:opacity-20"
                            >
                                <ChevronLeft className="h-4 w-4 text-amber-900" />
                            </button>
                            <span className="min-w-[3rem] text-center text-xs font-bold text-amber-900/40 tabular-nums">
                                {viewIndex! + 1} / {beekeepers.data.length}
                            </span>
                            <button
                                onClick={() =>
                                    setActiveModal((prev) =>
                                        prev?.type === 'view' &&
                                        prev.index < beekeepers.data.length - 1
                                            ? {
                                                  type: 'view',
                                                  index: prev.index + 1,
                                              }
                                            : prev,
                                    )
                                }
                                disabled={!hasNext}
                                className="rounded-xl p-1.5 transition-colors hover:bg-yellow-100 disabled:cursor-not-allowed disabled:opacity-20"
                            >
                                <ChevronRight className="h-4 w-4 text-amber-900" />
                            </button>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <p className="mb-1 text-xs font-bold tracking-widest text-amber-900/40 uppercase">
                                    Name
                                </p>
                                <p className="font-medium text-amber-950">
                                    {viewBeekeeper.name}
                                </p>
                            </div>
                            <div>
                                <p className="mb-1 text-xs font-bold tracking-widest text-amber-900/40 uppercase">
                                    Status
                                </p>
                                <StatusBadge
                                    status={viewBeekeeper.status ?? 'active'}
                                />
                            </div>
                            <div className="min-w-0">
                                <p className="mb-1 text-xs font-bold tracking-widest text-amber-900/40 uppercase">
                                    Email
                                </p>
                                <p className="font-medium break-all text-amber-950">
                                    {viewBeekeeper.email}
                                </p>
                            </div>
                            <div className="min-w-0">
                                <p className="mb-1 text-xs font-bold tracking-widest text-amber-900/40 uppercase">
                                    Phone
                                </p>
                                <p className="font-medium text-amber-950">
                                    {viewBeekeeper.phone ?? '—'}
                                </p>
                            </div>
                            <div>
                                <p className="mb-1 text-xs font-bold tracking-widest text-amber-900/40 uppercase">
                                    Member Since
                                </p>
                                <p className="font-medium text-amber-950">
                                    {new Date(
                                        viewBeekeeper.created_at,
                                    ).toLocaleDateString()}
                                </p>
                            </div>
                        </div>
                        <p className="text-center text-[10px] tracking-widest text-amber-900/25 uppercase">
                            Use arrow keys to navigate
                        </p>
                        <div className="flex gap-3 pt-2">
                            <Button
                                type="button"
                                variant="ghost"
                                onClick={close}
                                className="flex-1"
                            >
                                Close
                            </Button>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => openEdit(viewBeekeeper!)}
                                className="flex-1"
                            >
                                Edit
                            </Button>
                        </div>
                    </div>
                </Modal>
            )}

            {/* ── Edit Modal ─────────────────────────────────────────── */}
            {activeModal?.type === 'edit' && (
                <Modal
                    isOpen
                    onClose={close}
                    title="Edit Beekeeper"
                    maxWidth="md"
                >
                    <form onSubmit={submitEdit} className="space-y-4">
                        <Input
                            label="Name"
                            value={editForm.data.name}
                            onChange={(e) =>
                                editForm.setData('name', e.target.value)
                            }
                            autoFocus
                            error={editForm.errors.name}
                        />
                        <Input
                            label="Email"
                            type="email"
                            value={editForm.data.email}
                            onChange={(e) =>
                                editForm.setData('email', e.target.value)
                            }
                            error={editForm.errors.email}
                        />
                        <Input
                            label="Phone (optional)"
                            type="tel"
                            value={editForm.data.phone}
                            onChange={(e) =>
                                editForm.setData(
                                    'phone',
                                    e.target.value.replace(/[^\d+\-\s]/g, ''),
                                )
                            }
                            error={editForm.errors.phone}
                        />
                        <div className="flex gap-3 pt-2">
                            <Button
                                type="button"
                                variant="ghost"
                                onClick={close}
                                className="flex-1"
                            >
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                variant="primary"
                                disabled={editForm.processing}
                                className="flex-1"
                            >
                                {editForm.processing
                                    ? 'Saving...'
                                    : 'Save Changes'}
                            </Button>
                        </div>
                    </form>
                </Modal>
            )}

            {/* ── Toggle Status Confirmation Modal ───────────────────── */}
            {activeModal?.type === 'toggle' && (
                <Modal
                    isOpen
                    onClose={close}
                    title={
                        activeModal.user.status === 'active'
                            ? 'Deactivate Beekeeper'
                            : 'Reactivate Beekeeper'
                    }
                    maxWidth="sm"
                >
                    <div className="space-y-4">
                        <p className="text-sm text-amber-900/70">
                            {activeModal.user.status === 'active'
                                ? `Deactivating ${activeModal.user.name} will prevent them from logging in. You can reactivate them at any time.`
                                : `Reactivating ${activeModal.user.name} will restore their access to BuzzyHive.`}
                        </p>
                        <div className="flex gap-3">
                            <Button
                                type="button"
                                variant="ghost"
                                onClick={close}
                                className="flex-1"
                            >
                                Cancel
                            </Button>
                            <Button
                                type="button"
                                variant={
                                    activeModal.user.status === 'active'
                                        ? 'destructive'
                                        : 'primary'
                                }
                                onClick={confirmToggle}
                                className="flex-1"
                            >
                                {activeModal.user.status === 'active'
                                    ? 'Deactivate'
                                    : 'Reactivate'}
                            </Button>
                        </div>
                    </div>
                </Modal>
            )}

            {/* ── Delete Confirmation Modal ───────────────────────────── */}
            {activeModal?.type === 'delete' && (
                <Modal
                    isOpen
                    onClose={close}
                    title="Delete Beekeeper"
                    maxWidth="sm"
                >
                    <div className="space-y-4">
                        <p className="text-sm text-amber-900/70">
                            Are you sure you want to delete{' '}
                            <span className="font-semibold text-amber-950">
                                {activeModal.user.name}
                            </span>
                            ? This action cannot be undone.
                        </p>
                        <div className="flex gap-3">
                            <Button
                                type="button"
                                variant="ghost"
                                onClick={close}
                                disabled={deleting}
                                className="flex-1"
                            >
                                Cancel
                            </Button>
                            <Button
                                type="button"
                                variant="destructive"
                                onClick={confirmDelete}
                                disabled={deleting}
                                className="flex-1"
                            >
                                {deleting ? 'Deleting...' : 'Delete'}
                            </Button>
                        </div>
                    </div>
                </Modal>
            )}

            {/* ── Resend Invite Confirmation Modal ───────────────────── */}
            {activeModal?.type === 'resend' && (
                <Modal
                    isOpen
                    onClose={close}
                    title="Resend Invite"
                    maxWidth="sm"
                >
                    <div className="space-y-4">
                        <p className="text-sm text-amber-900/70">
                            A new invite email will be sent to{' '}
                            <span className="font-semibold text-amber-950">
                                {activeModal.user.email}
                            </span>
                            . The previous link will be replaced.
                        </p>
                        <div className="flex gap-3">
                            <Button
                                type="button"
                                variant="ghost"
                                onClick={close}
                                className="flex-1"
                            >
                                Cancel
                            </Button>
                            <Button
                                type="button"
                                variant="primary"
                                onClick={confirmResend}
                                className="flex-1"
                            >
                                Resend
                            </Button>
                        </div>
                    </div>
                </Modal>
            )}
        </AdminLayout>
    );
}
