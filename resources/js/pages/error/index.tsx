import { Head, Link, router, usePage } from '@inertiajs/react';
import { ArrowLeft, Home, LayoutDashboard } from 'lucide-react';
import { BeeIcon } from '@/components/core/brand/bee-icon';
import { Button } from '@/components/core/display/button';
import { TextLink } from '@/components/core/navigation/text-link';
import type { Auth } from '@/types/auth';
import { EmptyStateShell } from './EmptyStateShell';
import { errorConfigs } from './error-configs';

interface Props {
    status: number;
    title?: string;
    message?: string | null;
    reason?: string | null;
    requestId?: string | null;
}

export default function ErrorPage({ status, title, message, reason, requestId = null }: Props) {
    const { auth } = usePage<{ auth: Auth }>().props;
    const isAuthenticated = !!auth?.user;

    const fallback = errorConfigs[status] ?? {
        title: 'An Error Occurred',
        message: 'We could not complete your request.',
        reason: 'An unexpected application error occurred.',
    };

    const resolvedReason = requestId
        ? `${reason ?? fallback.reason} Reference ID: ${requestId}`
        : (reason ?? fallback.reason);

    return (
        <>
            <Head title={`${status} — ${title ?? fallback.title}`} />

            <div className="flex min-h-screen flex-col bg-[#FFFBEB] font-sans text-amber-950">
                <header className="border-b border-yellow-100 bg-white/80 px-6 py-4 backdrop-blur-md">
                    <div className="mx-auto flex max-w-6xl items-center">
                        <Link href="/" className="flex items-center gap-2">
                            <div className="rounded-xl bg-yellow-400 p-2">
                                <BeeIcon className="h-6 w-6 text-yellow-950" />
                            </div>
                            <span className="hidden text-xl font-bold tracking-tight text-amber-900 sm:block">
                                BuzzyHive 2.0
                            </span>
                        </Link>
                    </div>
                </header>

                <main className="flex flex-1 items-center justify-center p-6">
                    <EmptyStateShell
                        status={status}
                        title={title ?? fallback.title}
                        message={message ?? fallback.message}
                        reason={resolvedReason}
                        actions={
                            <>
                                <Button
                                    type="button"
                                    variant="primary"
                                    onClick={() => router.visit('/')}
                                    className="gap-2 rounded-xl px-6 py-3 text-sm font-semibold hover:bg-yellow-300"
                                >
                                    <Home className="h-4 w-4" />
                                    Go Home
                                </Button>

                                {isAuthenticated && (
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        onClick={() => router.visit(route('dashboard'))}
                                        className="gap-2 rounded-xl border border-yellow-300 px-6 py-3 text-sm font-semibold text-amber-800 hover:bg-yellow-100 hover:text-amber-800"
                                    >
                                        <LayoutDashboard className="h-4 w-4" />
                                        Dashboard
                                    </Button>
                                )}

                                <Button
                                    type="button"
                                    variant="ghost"
                                    onClick={() => history.back()}
                                    className="gap-2 rounded-xl border border-yellow-300 px-6 py-3 text-sm font-semibold text-amber-800 hover:bg-yellow-100 hover:text-amber-800"
                                >
                                    <ArrowLeft className="h-4 w-4" />
                                    Go Back
                                </Button>
                            </>
                        }
                        footer={
                            <>
                                <TextLink
                                    href="/dashboard"
                                    className="text-sm text-amber-800/50 no-underline transition-colors hover:text-amber-800"
                                >
                                    My Hives
                                </TextLink>
                                <TextLink
                                    href="/harvests"
                                    className="text-sm text-amber-800/50 no-underline transition-colors hover:text-amber-800"
                                >
                                    Harvests
                                </TextLink>
                                <TextLink
                                    href="mailto:support@buzzyhive.com"
                                    className="text-sm text-amber-800/50 no-underline transition-colors hover:text-amber-800"
                                >
                                    Support
                                </TextLink>
                            </>
                        }
                    />
                </main>
            </div>
        </>
    );
}
