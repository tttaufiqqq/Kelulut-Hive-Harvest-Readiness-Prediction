import { Head, Link, usePage } from '@inertiajs/react';
import { ArrowLeft, Home, LayoutDashboard } from 'lucide-react';
import { motion } from 'motion/react';
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
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    className="h-6 w-6"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="#1a1200"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                >
                                    <path d="M12 2a7 7 0 0 1 7 7c0 4-3.5 8-7 11C8.5 17 5 13 5 9a7 7 0 0 1 7-7z" />
                                    <circle
                                        cx="12"
                                        cy="9"
                                        r="2.5"
                                        fill="#1a1200"
                                        stroke="none"
                                    />
                                    <path
                                        d="M8.5 14.5 Q12 12 15.5 14.5"
                                        strokeWidth="1.5"
                                    />
                                </svg>
                            </div>
                            <span className="hidden text-xl font-bold tracking-tight text-amber-900 sm:block">
                                BuzzyHive2.0
                            </span>
                        </Link>
                    </div>
                </header>

                {/* ── Error content ─────────────────────────────────────────── */}
                <main className="flex flex-1 items-center justify-center p-6">
                    <div className="w-full max-w-md text-center">
                        {/* Hex bee icon */}
                        <div className="mb-6 flex justify-center">
                            <motion.div
                                className="flex h-24 w-24 items-center justify-center"
                                style={{
                                    clipPath:
                                        'polygon(50% 0%, 95% 25%, 95% 75%, 50% 100%, 5% 75%, 5% 25%)',
                                    backgroundColor: '#FBBF24',
                                    boxShadow:
                                        '0 8px 24px rgba(251,191,36,0.30)',
                                }}
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ duration: 0.4, ease: 'easeOut' }}
                            >
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    className="h-10 w-10"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="#1a1200"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                >
                                    <path d="M12 2a7 7 0 0 1 7 7c0 4-3.5 8-7 11C8.5 17 5 13 5 9a7 7 0 0 1 7-7z" />
                                    <circle
                                        cx="12"
                                        cy="9"
                                        r="2.5"
                                        fill="#1a1200"
                                        stroke="none"
                                    />
                                    <path
                                        d="M8.5 14.5 Q12 12 15.5 14.5"
                                        strokeWidth="1.5"
                                    />
                                </svg>
                            </motion.div>
                        </div>

                        {/* Error code */}
                        <motion.p
                            className="mb-2 font-light tracking-tighter text-amber-400"
                            style={{ fontSize: '96px', lineHeight: 1 }}
                            initial={{ opacity: 0, y: 12 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.4, delay: 0.1 }}
                        >
                            {status}
                        </motion.p>

                        {/* Heading */}
                        <motion.h1
                            className="mb-4 text-2xl font-semibold text-amber-950"
                            initial={{ opacity: 0, y: 12 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.4, delay: 0.15 }}
                        >
                            {title}
                        </motion.h1>

                        {/* Message */}
                        <motion.p
                            className="mb-8 leading-relaxed text-amber-800/70"
                            initial={{ opacity: 0, y: 12 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.4, delay: 0.2 }}
                        >
                            {description}
                        </motion.p>

                        {/* CTA buttons */}
                        <motion.div
                            className="mb-10 flex flex-wrap justify-center gap-3"
                            initial={{ opacity: 0, y: 12 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.4, delay: 0.25 }}
                        >
                            <Link
                                href="/"
                                className="inline-flex items-center gap-2 rounded-xl bg-yellow-400 px-6 py-3 text-sm font-semibold text-amber-950 transition-colors hover:bg-yellow-300"
                            >
                                <Home className="h-4 w-4" />
                                Go Home
                            </Link>

                            {isAuthenticated && (
                                <Link
                                    href={route('dashboard')}
                                    className="inline-flex items-center gap-2 rounded-xl border border-yellow-300 px-6 py-3 text-sm font-semibold text-amber-800 transition-colors hover:bg-yellow-100"
                                >
                                    <LayoutDashboard className="h-4 w-4" />
                                    Dashboard
                                </Link>
                            )}

                            <button
                                onClick={() => history.back()}
                                className="inline-flex items-center gap-2 rounded-xl border border-yellow-300 px-6 py-3 text-sm font-semibold text-amber-800 transition-colors hover:bg-yellow-100"
                            >
                                <ArrowLeft className="h-4 w-4" />
                                Go Back
                            </button>
                        </motion.div>

                        {/* Divider + links */}
                        <div className="flex flex-wrap justify-center gap-4 border-t border-amber-100 pt-6">
                            <Link
                                href="/dashboard"
                                className="text-sm text-amber-800/50 transition-colors hover:text-amber-800"
                            >
                                My Hives
                            </Link>
                            <Link
                                href="/harvests"
                                className="text-sm text-amber-800/50 transition-colors hover:text-amber-800"
                            >
                                Harvests
                            </Link>
                            <a
                                href="mailto:support@buzzyhive.com"
                                className="text-sm text-amber-800/50 transition-colors hover:text-amber-800"
                            >
                                Support
                            </a>
                        </div>
                    </div>
                </main>
            </div>
        </>
    );
}
