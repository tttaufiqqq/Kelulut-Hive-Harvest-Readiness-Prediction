import { Link } from '@inertiajs/react';
import type { ReactNode } from 'react';
import { BeeIcon } from '@/components/core/bee-icon';
import { cn } from '@/lib/utils';

export interface AuthSplitShellProps {
    children: ReactNode;
    title: ReactNode;
    description?: ReactNode;
    badge?: ReactNode;
    className?: string;
    contentClassName?: string;
    formPanelClassName?: string;
    heroPanelClassName?: string;
    logoHref?: string;
    brandName?: ReactNode;
    logoIcon?: ReactNode;
    heroIcon?: ReactNode;
    heroTitle?: ReactNode;
    heroDescription?: ReactNode;
    showHero?: boolean;
}

export function AuthSplitShell({
    children,
    title,
    description,
    badge,
    className,
    contentClassName,
    formPanelClassName,
    heroPanelClassName,
    logoHref = '/',
    brandName = (
        <>
            BuzzyHive <span className="text-yellow-500">2.0</span>
        </>
    ),
    logoIcon = <BeeIcon className="h-5 w-5 text-yellow-950" />,
    heroIcon = <BeeIcon className="h-16 w-16 text-yellow-950" />,
    heroTitle = (
        <>
            Harvest <br />
            <span className="text-yellow-400">Intelligence.</span>
        </>
    ),
    heroDescription = (
        <>
            IoT-integrated harvest readiness prediction for stingless bee
            farming.
        </>
    ),
    showHero = true,
}: AuthSplitShellProps) {
    return (
        <div
            className={cn(
                'relative flex min-h-screen overflow-hidden bg-[#FFFBEB]',
                className,
            )}
        >
            <div className="absolute top-0 right-0 z-0 hidden h-full w-1/2 translate-x-1/4 -skew-x-12 bg-amber-950 lg:block" />

            <div
                className={cn(
                    'relative z-10 flex w-full flex-col justify-center px-8 py-12 md:px-16 lg:w-1/2',
                    formPanelClassName,
                )}
            >
                <Link
                    href={logoHref}
                    className="group mb-16 flex w-fit items-center gap-2"
                >
                    <div className="rounded-xl bg-yellow-400 p-2 transition-colors group-hover:bg-yellow-500">
                        {logoIcon}
                    </div>
                    <span className="text-lg font-black tracking-tighter text-amber-950 uppercase">
                        {brandName}
                    </span>
                </Link>

                <div className={cn(contentClassName)}>
                    <div className="mb-8">
                        {badge}
                        <h1 className="mt-4 text-5xl leading-none font-black tracking-tighter text-amber-950 uppercase">
                            {title}
                        </h1>
                        {description && (
                            <p className="mt-3 font-medium text-amber-800/60">
                                {description}
                            </p>
                        )}
                    </div>

                    {children}
                </div>
            </div>

            {showHero && (
                <div
                    className={cn(
                        'relative z-10 hidden w-1/2 items-center justify-center lg:flex',
                        heroPanelClassName,
                    )}
                >
                    <div className="px-12 text-center">
                        <div className="mb-8 inline-block rotate-6 rounded-[2rem] bg-yellow-400 p-8 shadow-2xl">
                            {heroIcon}
                        </div>
                        <h2 className="mb-4 text-4xl leading-none font-black tracking-tighter text-white uppercase">
                            {heroTitle}
                        </h2>
                        <p className="mx-auto max-w-xs font-medium text-amber-200/60">
                            {heroDescription}
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
}
