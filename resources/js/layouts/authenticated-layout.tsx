import { Link, router, usePage } from '@inertiajs/react';
import {
    LayoutDashboard,
    Settings,
    User,
    LogOut,
    Home,
    Leaf,
    ClipboardList,
    BarChart2,
} from 'lucide-react';
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

export function AuthenticatedLayout({
    header = null,
    children,
}: AuthenticatedLayoutProps) {
    const { auth } = usePage<PageProps>().props;
    const user = auth.user;
    const isAdmin = user?.role === 'admin';

    const navItems = isAdmin
        ? [
              { icon: Home, label: 'Home', routeName: 'home' },
              {
                  icon: LayoutDashboard,
                  label: 'Admin',
                  routeName: 'admin.dashboard',
              },
              { icon: Settings, label: 'Settings', routeName: 'profile.edit' },
          ]
        : [
              { icon: Home, label: 'Home', routeName: 'home' },
              {
                  icon: LayoutDashboard,
                  label: 'My Hives',
                  routeName: 'dashboard',
              },
              { icon: Leaf, label: 'Harvests', routeName: 'harvests.index' },
              {
                  icon: ClipboardList,
                  label: 'Inspections',
                  routeName: 'inspections.index',
              },
              {
                  icon: BarChart2,
                  label: 'Reporting',
                  routeName: 'reporting.index',
              },
              { icon: Settings, label: 'Settings', routeName: 'profile.edit' },
          ];

    const userMenuItems = [
        {
            id: 'profile',
            label: 'My Profile',
            icon: <User className="h-4 w-4" />,
            onClick: () => router.visit(route('profile.edit')),
        },
        {
            id: 'logout',
            label: 'Sign Out',
            icon: <LogOut className="h-4 w-4" />,
            variant: 'danger' as const,
            onClick: () => router.post(route('logout')),
        },
    ];

    return (
        <div className="flex min-h-screen flex-col bg-[#FFFBEB] pb-20 font-sans text-amber-950 selection:bg-yellow-200 md:pb-0">
            {/* ── Top App Bar ─────────────────────────────────────────────── */}
            <header className="sticky top-0 z-50 border-b border-yellow-200/80 bg-white/88 px-5 py-4 shadow-[0_1px_0_rgba(120,53,15,0.08),0_18px_32px_-28px_rgba(120,53,15,0.6)] backdrop-blur-md sm:px-8">
                <div className="mx-auto flex max-w-7xl items-center justify-between">
                    {/* Logo */}
                    <Link href="/" className="flex items-center gap-3">
                        <div className="rounded-2xl bg-yellow-400 p-2.5">
                            <BeeIcon className="h-6 w-6 text-yellow-950" />
                        </div>
                        <h1 className="hidden text-xl font-bold tracking-tight text-amber-900 sm:block">
                            BuzzyHive 2.0
                        </h1>
                    </Link>

                    {/* Right actions */}
                    <div className="flex items-center gap-4">
                        <Dropdown
                            trigger={
                                <button className="flex h-11 w-11 items-center justify-center rounded-full border border-yellow-100 p-1 transition-colors hover:bg-yellow-100 sm:h-auto sm:w-auto sm:justify-start sm:gap-2 sm:pr-3">
                                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-yellow-400">
                                        <User className="h-4 w-4 text-yellow-950" />
                                    </div>
                                    <span className="hidden text-sm font-bold text-amber-900 sm:block">
                                        {user.name}
                                    </span>
                                </button>
                            }
                            items={userMenuItems}
                        />
                    </div>
                </div>
            </header>

            {/* ── Optional page header ─────────────────────────────────────── */}
            {header && (
                <div className="border-b border-yellow-100 bg-white">
                    <div className="mx-auto max-w-7xl px-6 py-4">{header}</div>
                </div>
            )}

            {/* ── Main content ─────────────────────────────────────────────── */}
            <main className="relative z-10 min-h-0 flex-1">{children}</main>

            {/* ── Bottom Navigation (mobile only) ──────────────────────────── */}
            <nav className="fixed right-0 bottom-0 left-0 z-50 flex items-center border-t border-yellow-100 bg-white/90 px-2 py-2.5 backdrop-blur-lg sm:px-4 md:hidden">
                {navItems.map((item) => {
                    const isActive = route().current(item.routeName);

                    return (
                        <Link
                            key={item.routeName}
                            href={route(item.routeName)}
                            className={cn(
                                'flex min-w-0 flex-1 flex-col items-center gap-1 px-1 text-center transition-colors',
                                isActive
                                    ? 'text-amber-800'
                                    : 'text-amber-900/40',
                            )}
                        >
                            <div
                                className={cn(
                                    'rounded-xl p-1.5 transition-colors',
                                    isActive ? 'bg-amber-100' : '',
                                )}
                            >
                                <item.icon className="h-5 w-5" />
                            </div>
                            <span
                                className={cn(
                                    'w-full truncate text-[9px] leading-tight sm:text-[10px]',
                                    isActive ? 'font-semibold' : 'font-medium',
                                )}
                            >
                                {item.label}
                            </span>
                        </Link>
                    );
                })}
            </nav>
        </div>
    );
}
