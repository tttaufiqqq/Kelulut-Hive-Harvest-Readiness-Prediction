import { Link } from '@inertiajs/react';
import { cn } from '@/lib/utils';

const TABS = [
    { label: 'My Hives',    href: '/dashboard'    },
    { label: 'Harvests',    href: '/harvests'     },
    { label: 'Inspections', href: '/inspections'  },
];

export function BeekeeperTabs({ active }: { active: 'dashboard' | 'harvests' | 'inspections' }) {
    return (
        <nav className="flex gap-1 bg-yellow-100/50 rounded-2xl p-1.5">
            {TABS.map(tab => (
                <Link
                    key={tab.href}
                    href={tab.href}
                    className={cn(
                        'px-4 py-2 text-sm rounded-xl transition-all whitespace-nowrap',
                        tab.href === `/${active}` || (active === 'dashboard' && tab.href === '/dashboard')
                            ? 'bg-white shadow-sm font-semibold text-amber-900'
                            : 'text-amber-900/60 hover:bg-yellow-200/50',
                    )}
                >
                    {tab.label}
                </Link>
            ))}
        </nav>
    );
}
