import { Link } from '@inertiajs/react';
import { Bug as Bee } from 'lucide-react';
import type { AuthLayoutProps } from '@/types';

export function AuthLayout({ children, title, description }: AuthLayoutProps) {
    return (
        <div className="relative flex min-h-screen overflow-hidden bg-[#FFFBEB]">
            <div className="absolute top-0 right-0 z-0 hidden h-full w-1/2 translate-x-1/4 -skew-x-12 bg-amber-950 lg:block" />

            {/* Left Panel - Form */}
            <div className="relative z-10 flex w-full flex-col justify-center px-8 py-12 md:px-16 lg:w-1/2">
                {/* Logo */}
                <Link
                    href="/"
                    className="group mb-16 flex w-fit items-center gap-2"
                >
                    <div className="rounded-xl bg-yellow-400 p-2 transition-colors group-hover:bg-yellow-500">
                        <Bee className="h-5 w-5 text-yellow-950" />
                    </div>
                    <span className="text-lg font-black tracking-tighter text-amber-950 uppercase">
                        BuzzyHive <span className="text-yellow-500">2.0</span>
                    </span>
                </Link>

                <div>
                    <div className="mb-8">
                        <h1 className="text-5xl leading-none font-black tracking-tighter text-amber-950 uppercase">
                            {title}
                            <span className="text-yellow-500">.</span>
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

            {/* Right Panel - Decorative */}
            <div className="relative z-10 hidden w-1/2 items-center justify-center lg:flex">
                <div className="px-12 text-center">
                    <div className="mb-8 inline-block rotate-6 rounded-[2rem] bg-yellow-400 p-8 shadow-2xl">
                        <Bee className="h-16 w-16 text-yellow-950" />
                    </div>
                    <h2 className="mb-4 text-4xl leading-none font-black tracking-tighter text-white uppercase">
                        Harvest <br />
                        <span className="text-yellow-400">Intelligence.</span>
                    </h2>
                    <p className="mx-auto max-w-xs font-medium text-amber-200/60">
                        IoT-integrated harvest readiness prediction for
                        stingless bee farming.
                    </p>
                </div>
            </div>
        </div>
    );
}
