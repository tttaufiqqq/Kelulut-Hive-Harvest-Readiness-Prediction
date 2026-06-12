import { Link } from '@inertiajs/react';
import { motion } from 'motion/react';
import type { PropsWithChildren } from 'react';
import { Breadcrumbs } from '@/components/core/navigation/navigation';
import { useCurrentUrl } from '@/hooks/use-current-url';
import { cn, toUrl } from '@/lib/utils';
import { edit } from '@/routes/profile';
import { edit as editSecurity } from '@/routes/security';
import type { NavItem } from '@/types';

const sidebarNavItems: NavItem[] = [
    {
        title: 'Profile',
        href: edit(),
        icon: null,
    },
    {
        title: 'Security',
        href: editSecurity(),
        icon: null,
    },
];

export function SettingsLayout({ children }: PropsWithChildren) {
    const { isCurrentOrParentUrl } = useCurrentUrl();

    // When server-side rendering, we only render the layout on the client...
    if (typeof window === 'undefined') {
        return null;
    }

    return (
        <div className="mx-auto max-w-7xl space-y-8 p-6 md:p-10 lg:px-10 lg:py-8">
            {/* Page header — matches dashboard pattern */}
            <Breadcrumbs
                items={[{ label: 'Home', href: '/' }, { label: 'Settings' }]}
            />

            <div className="flex flex-col lg:flex-row lg:gap-10">
                <aside className="mb-6 w-full lg:mb-0 lg:w-44">
                    {/* Mobile: horizontal tabs */}
                    <nav
                        className="flex gap-1 overflow-x-auto rounded-2xl bg-yellow-100/50 p-1.5 lg:hidden"
                        aria-label="Settings"
                    >
                        {sidebarNavItems.map((item, index) => (
                            <Link
                                key={`${toUrl(item.href)}-${index}`}
                                href={item.href}
                                className={cn(
                                    'flex-shrink-0 rounded-xl px-4 py-2 text-sm transition-all',
                                    isCurrentOrParentUrl(item.href)
                                        ? 'bg-white font-semibold text-amber-900 shadow-sm'
                                        : 'text-amber-900/60 hover:bg-yellow-200/50',
                                )}
                            >
                                {item.title}
                            </Link>
                        ))}
                    </nav>

                    {/* Desktop: vertical tabs */}
                    <nav
                        className="hidden flex-col gap-1 rounded-2xl bg-yellow-100/50 p-1.5 lg:flex"
                        aria-label="Settings"
                    >
                        {sidebarNavItems.map((item, index) => (
                            <Link
                                key={`${toUrl(item.href)}-${index}`}
                                href={item.href}
                                className={cn(
                                    'rounded-xl px-4 py-2 text-sm transition-all',
                                    isCurrentOrParentUrl(item.href)
                                        ? 'bg-white font-semibold text-amber-900 shadow-sm'
                                        : 'text-amber-900/60 hover:bg-yellow-200/50',
                                )}
                            >
                                {item.title}
                            </Link>
                        ))}
                    </nav>
                </aside>

                <motion.div
                    className="min-w-0 flex-1"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, ease: 'easeOut' }}
                >
                    <section className="max-w-3xl space-y-8">{children}</section>
                </motion.div>
            </div>
        </div>
    );
}
