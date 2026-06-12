import { Link } from '@inertiajs/react';
import { useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';

const TABS = [
    { label: 'My Hives', href: '/dashboard' },
    { label: 'Harvests', href: '/harvests' },
    { label: 'Inspections', href: '/inspections' },
    { label: 'Reporting', href: '/reporting' },
];

export function BeekeeperTabs({
    active,
}: {
    active: 'dashboard' | 'harvests' | 'inspections' | 'reporting';
}) {
    const activeTabRef = useRef<HTMLAnchorElement>(null);

    useEffect(() => {
        activeTabRef.current?.scrollIntoView({
            behavior: 'smooth',
            inline: 'nearest',
            block: 'nearest',
        });
    }, []);

    return (
        <nav className="flex gap-1 overflow-x-auto rounded-2xl bg-yellow-100/50 p-1.5 [&::-webkit-scrollbar]:hidden">
            {TABS.map((tab) => {
                const isActive =
                    tab.href === `/${active}` ||
                    (active === 'dashboard' && tab.href === '/dashboard');

                return (
                    <Link
                        key={tab.href}
                        href={tab.href}
                        ref={isActive ? activeTabRef : undefined}
                        className={cn(
                            'rounded-xl px-4 py-2 text-sm whitespace-nowrap transition-all',
                            isActive
                                ? 'bg-white font-semibold text-amber-900 shadow-sm'
                                : 'text-amber-900/60 hover:bg-yellow-200/50',
                        )}
                    >
                        {tab.label}
                    </Link>
                );
            })}
        </nav>
    );
}
