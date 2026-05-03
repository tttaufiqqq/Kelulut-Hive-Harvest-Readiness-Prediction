import { Link, router, usePage } from '@inertiajs/react';
import { LayoutDashboard, Settings, User, LogOut, Home, Leaf, ClipboardList, BarChart2 } from 'lucide-react';
import React from 'react';
import { BeeIcon } from '@/components/core/bee-icon';
import { Dropdown } from '@/components/core/dropdown';
import { cn } from '@/lib/utils';

interface AuthenticatedLayoutProps {
    header?: React.ReactNode;
    children: React.ReactNode;
}

interface PageProps {
    auth: {
        user: {
            name: string;
            role?: string;
        };
    };
    [key: string]: unknown;
}

export function AuthenticatedLayout({ header = null, children }: AuthenticatedLayoutProps) {
    const { auth } = usePage<PageProps>().props;
    const user = auth.user;
    const isAdmin = user?.role === 'admin';

    const navItems = isAdmin
        ? [
            { icon: Home,            label: 'Home',      routeName: 'home' },
            { icon: LayoutDashboard, label: 'Admin',     routeName: 'admin.dashboard' },
            { icon: Settings,        label: 'Settings',  routeName: 'profile.edit' },
        ]
        : [
            { icon: Home,            label: 'Home',      routeName: 'home' },
            { icon: LayoutDashboard, label: 'My Hives',  routeName: 'dashboard' },
            { icon: Leaf,          label: 'Harvests',    routeName: 'harvests.index' },
            { icon: ClipboardList, label: 'Inspections', routeName: 'inspections.index' },
            { icon: BarChart2,     label: 'Reporting',   routeName: 'reporting.index' },
            { icon: Settings,      label: 'Settings',    routeName: 'profile.edit' },
        ];

    const userMenuItems = [
        { id: 'profile', label: 'My Profile', icon: <User className="w-4 h-4" />,   onClick: () => router.visit(route('profile.edit')) },
        { id: 'logout',  label: 'Sign Out',  icon: <LogOut className="w-4 h-4" />, variant: 'danger' as const, onClick: () => router.post(route('logout')) },
    ];

    return (
        <div className="min-h-screen bg-[#FFFBEB] text-amber-950 font-sans selection:bg-yellow-200 pb-20 md:pb-0">

            {/* ── Top App Bar ─────────────────────────────────────────────── */}
            <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-yellow-100 px-6 py-4">
                <div className="max-w-6xl mx-auto flex justify-between items-center">

                    {/* Logo */}
                    <Link href="/" className="flex items-center gap-2">
                        <div className="bg-yellow-400 p-2 rounded-xl">
                            <BeeIcon className="w-6 h-6 text-yellow-950" />
                        </div>
                        <h1 className="text-xl font-bold tracking-tight text-amber-900 hidden sm:block">
                            BuzzyHive2.0
                        </h1>
                    </Link>

                    {/* Right actions */}
                    <div className="flex items-center gap-4">
                        <Dropdown
                            trigger={
                                <button className="flex items-center gap-2 p-1 pr-3 hover:bg-yellow-100 rounded-full transition-colors border border-yellow-100">
                                    <div className="w-8 h-8 bg-yellow-400 rounded-full flex items-center justify-center">
                                        <User className="w-4 h-4 text-yellow-950" />
                                    </div>
                                    <span className="text-sm font-bold text-amber-900 hidden sm:block">
                                        {user.name}
                                    </span>
                                </button>
                            }
                            items={userMenuItems}
                        />
                    </div>
                </div>
            </header>

            {/* ── Desktop Tab Bar (beekeeper, md+ only) ────────────────────── */}
            {!isAdmin && (
                <div className="hidden md:block bg-white border-b border-yellow-100">
                    <div className="max-w-6xl mx-auto px-6">
                        <nav className="flex gap-1 py-2 overflow-x-auto">
                            {navItems.map((item) => {
                                const isActive = route().current(item.routeName);
                                return (
                                    <Link
                                        key={item.routeName}
                                        href={route(item.routeName)}
                                        className={cn(
                                            'px-4 py-2 text-sm rounded-xl transition-all whitespace-nowrap flex-shrink-0',
                                            isActive
                                                ? 'bg-white shadow-sm font-semibold text-amber-900'
                                                : 'text-amber-900/60 hover:bg-yellow-200/50'
                                        )}
                                    >
                                        {item.label}
                                    </Link>
                                );
                            })}
                        </nav>
                    </div>
                </div>
            )}

            {/* ── Optional page header ─────────────────────────────────────── */}
            {header && (
                <div className="bg-white border-b border-yellow-100">
                    <div className="max-w-6xl mx-auto px-6 py-4">
                        {header}
                    </div>
                </div>
            )}

            {/* ── Main content ─────────────────────────────────────────────── */}
            <main className="relative z-10">
                {children}
            </main>

            {/* ── Bottom Navigation (mobile only) ──────────────────────────── */}
            <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-lg border-t border-yellow-100 px-6 py-3 flex justify-around items-center md:hidden">
                {navItems.map((item) => {
                    const isActive = route().current(item.routeName);

                    return (
                        <Link
                            key={item.routeName}
                            href={route(item.routeName)}
                            className={cn(
                                'flex flex-col items-center gap-1 transition-colors',
                                isActive ? 'text-amber-800' : 'text-amber-900/40'
                            )}
                        >
                            <div className={cn(
                                'rounded-xl p-1.5 transition-colors',
                                isActive ? 'bg-amber-100' : ''
                            )}>
                                <item.icon className="w-5 h-5" />
                            </div>
                            <span className={cn(
                                'text-[10px]',
                                isActive ? 'font-semibold' : 'font-medium'
                            )}>
                                {item.label}
                            </span>
                        </Link>
                    );
                })}
            </nav>

        </div>
    );
}
