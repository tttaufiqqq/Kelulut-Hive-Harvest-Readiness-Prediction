import { Link } from '@inertiajs/react';
import { motion } from 'motion/react';
import { type PropsWithChildren, useEffect, useRef } from 'react';
import { Breadcrumbs } from '@/components/core/navigation';
import { useCurrentUrl } from '@/hooks/use-current-url';
import { AuthenticatedLayout } from '@/layouts/authenticated-layout';
import { cn, toUrl } from '@/lib/utils';
import type { NavItem } from '@/types';

// ── Nav items ──────────────────────────────────────────────────────────
// Add new admin sections here. Icon is unused (horizontal tabs don't show icons).
const NAV_ITEMS: NavItem[] = [
    { title: 'Dashboard',  href: '/admin',            icon: null, exact: true },
    { title: 'Sensors',    href: '/admin/sensors',    icon: null },
    { title: 'Devices',    href: '/admin/devices',    icon: null },
    { title: 'Beekeepers', href: '/admin/beekeepers', icon: null },
    { title: 'Hives',      href: '/admin/hives',      icon: null },
    { title: 'Sites',      href: '/admin/sites',      icon: null },
    { title: 'Harvests',     href: '/admin/harvests',     icon: null },
    { title: 'Inspections', href: '/admin/inspections', icon: null },
    { title: 'Thesis',      href: '/admin/thesis',      icon: null },
];

export function AdminLayout({ children }: PropsWithChildren) {
    const { isCurrentUrl, isCurrentOrParentUrl } = useCurrentUrl();
    const isActive = (item: NavItem) =>
        item.exact ? isCurrentUrl(item.href) : isCurrentOrParentUrl(item.href);

    const navRef = useRef<HTMLElement>(null);

    useEffect(() => {
        const nav = navRef.current;
        const activeEl = nav?.querySelector('[data-active="true"]') as HTMLElement | null;
        if (!nav || !activeEl) return;
        const navRect = nav.getBoundingClientRect();
        const elRect = activeEl.getBoundingClientRect();
        nav.scrollTo({
            left: nav.scrollLeft + elRect.left - navRect.left - navRect.width / 2 + elRect.width / 2,
            behavior: 'instant',
        });
    }, []);

    if (typeof window === 'undefined') {
return null;
}

    return (
        <AuthenticatedLayout>
            <div className="p-6 md:p-10 max-w-6xl mx-auto space-y-6">

                {/* ── Top bar: breadcrumb + tabs ── */}
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <Breadcrumbs items={[{ label: 'Home', href: '/' }, { label: 'Admin' }]} />

                    <nav ref={navRef} className="flex gap-1 bg-yellow-100/50 rounded-2xl p-1.5 overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]" aria-label="Admin">
                        {NAV_ITEMS.map((item, index) => (
                            <Link
                                key={`${toUrl(item.href)}-${index}`}
                                href={item.href}
                                {...(isActive(item) ? { 'data-active': 'true' } : {})}
                                className={cn(
                                    'px-4 py-2 text-sm rounded-xl transition-all whitespace-nowrap flex-shrink-0',
                                    isActive(item)
                                        ? 'bg-white shadow-sm font-semibold text-amber-900'
                                        : 'text-amber-900/60 hover:bg-yellow-200/50'
                                )}
                            >
                                {item.title}
                            </Link>
                        ))}
                    </nav>
                </div>

                {/* ── Page content (full width) ── */}
                <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, ease: 'easeOut' }}
                >
                    {children}
                </motion.div>

            </div>
        </AuthenticatedLayout>
    );
}
