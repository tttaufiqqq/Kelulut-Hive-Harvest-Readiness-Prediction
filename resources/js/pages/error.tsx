import { Head, Link, router, usePage } from '@inertiajs/react';
import { ArrowLeft, Home, LayoutDashboard } from 'lucide-react';
import { motion } from 'motion/react';
import { BeeIcon } from '@/components/core/bee-icon';
import { Button } from '@/components/core/button';
import { TextLink } from '@/components/core/text-link';
import type { Auth } from '@/types/auth';

interface Props {
    status: number;
}

const errors: Record<number, { title: string; description: string }> = {
    403: {
        title: 'Access Restricted',
        description:
            "You don't have permission to access this area. If you think this is a mistake, contact your administrator.",
    },
    404: {
        title: 'Page Not Found',
        description:
            "The page you're looking for doesn't exist or has been moved.",
    },
    500: {
        title: 'Server Error',
        description: 'Something went wrong on our end. Please try again later.',
    },
    503: {
        title: 'Service Unavailable',
        description:
            'BuzzyHive is temporarily offline for maintenance. Please check back soon.',
    },
};

interface EmptyStateShellProps {
    status: number;
    title: string;
    description: string;
    actions: React.ReactNode;
    footer: React.ReactNode;
}

function EmptyStateShell({
    status,
    title,
    description,
    actions,
    footer,
}: EmptyStateShellProps) {
    return (
        <div className="w-full max-w-md text-center">
            <div className="mb-6 flex justify-center">
                <motion.div
                    className="flex h-24 w-24 items-center justify-center"
                    style={{
                        clipPath:
                            'polygon(50% 0%, 95% 25%, 95% 75%, 50% 100%, 5% 75%, 5% 25%)',
                        backgroundColor: '#FBBF24',
                        boxShadow: '0 8px 24px rgba(251,191,36,0.30)',
                    }}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.4, ease: 'easeOut' }}
                >
                    <BeeIcon className="h-10 w-10 text-yellow-950" />
                </motion.div>
            </div>

            <motion.p
                className="mb-2 font-light tracking-tighter text-amber-400"
                style={{ fontSize: '96px', lineHeight: 1 }}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.1 }}
            >
                {status}
            </motion.p>

            <motion.h1
                className="mb-4 text-2xl font-semibold text-amber-950"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.15 }}
            >
                {title}
            </motion.h1>

            <motion.p
                className="mb-8 leading-relaxed text-amber-800/70"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.2 }}
            >
                {description}
            </motion.p>

            <motion.div
                className="mb-10 flex flex-wrap justify-center gap-3"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.25 }}
            >
                {actions}
            </motion.div>

            <div className="flex flex-wrap justify-center gap-4 border-t border-amber-100 pt-6">
                {footer}
            </div>
        </div>
    );
}

export default function ErrorPage({ status }: Props) {
    const { auth } = usePage<{ auth: Auth }>().props;
    const isAuthenticated = !!auth?.user;

    const { title, description } = errors[status] ?? {
        title: 'An Error Occurred',
        description: 'Something unexpected happened.',
    };

    return (
        <>
            <Head title={`${status} — ${title}`} />

            <div className="flex min-h-screen flex-col bg-[#FFFBEB] font-sans text-amber-950">
                {/* ── Header — matches AuthenticatedLayout ─────────────────── */}
                <header className="border-b border-yellow-100 bg-white/80 px-6 py-4 backdrop-blur-md">
                    <div className="mx-auto flex max-w-6xl items-center">
                        <Link href="/" className="flex items-center gap-2">
                            <div className="rounded-xl bg-yellow-400 p-2">
                                <BeeIcon className="h-6 w-6 text-yellow-950" />
                            </div>
                            <span className="hidden text-xl font-bold tracking-tight text-amber-900 sm:block">
                                BuzzyHive2.0
                            </span>
                        </Link>
                    </div>
                </header>

                {/* ── Error content ─────────────────────────────────────────── */}
                <main className="flex flex-1 items-center justify-center p-6">
                    <EmptyStateShell
                        status={status}
                        title={title}
                        description={description}
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
                                        onClick={() =>
                                            router.visit(route('dashboard'))
                                        }
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
