import { Link } from '@inertiajs/react';
import { BeeIcon as Bee } from '@/components/core/bee-icon';
import { Button } from '@/components/core/button';

interface Props {
    dashboardHref: string;
    hasThesis: boolean;
    onReadResearch: () => void;
}

export function FooterSection({ dashboardHref, hasThesis, onReadResearch }: Props) {
    return (
        <footer className="bg-yellow-400 px-6 py-20 text-yellow-950 md:px-20">
            <div className="mx-auto max-w-7xl">
                <div className="mb-16 grid grid-cols-1 gap-12 md:grid-cols-5">
                    <div className="md:col-span-2">
                        <div className="mb-4 flex items-center gap-2">
                            <Bee className="h-7 w-7" />
                            <span className="text-xl font-black tracking-tighter uppercase">
                                BuzzyHive 2.0
                            </span>
                        </div>
                        <p className="mb-6 max-w-xs text-sm leading-relaxed text-yellow-900/70">
                            IoT-integrated harvest intelligence for stingless bee farmers. Know
                            exactly when to harvest, every time.
                        </p>
                        <Link href={dashboardHref}>
                            <Button className="bg-yellow-950 text-xs font-bold tracking-tight text-yellow-400 uppercase hover:bg-black">
                                Launch App
                            </Button>
                        </Link>
                    </div>

                    <div>
                        <h4 className="mb-5 text-[10px] font-bold tracking-widest uppercase opacity-60">
                            Product
                        </h4>
                        <ul className="space-y-3 text-sm font-medium">
                            <li>
                                <a href="#hri-analytics" className="transition-opacity hover:opacity-60">
                                    HRI Analytics
                                </a>
                            </li>
                            <li>
                                <a href="#hive-management" className="transition-opacity hover:opacity-60">
                                    Hive Management
                                </a>
                            </li>
                            <li>
                                <a href="#floral-context" className="transition-opacity hover:opacity-60">
                                    Floral Context
                                </a>
                            </li>
                            <li>
                                <a href="#sensor-health" className="transition-opacity hover:opacity-60">
                                    Sensor Health
                                </a>
                            </li>
                        </ul>
                    </div>

                    <div>
                        <h4 className="mb-5 text-[10px] font-bold tracking-widest uppercase opacity-60">
                            Resources
                        </h4>
                        <ul className="space-y-3 text-sm font-medium">
                            <li>
                                <button
                                    onClick={onReadResearch}
                                    disabled={!hasThesis}
                                    className="transition-opacity hover:opacity-60 disabled:cursor-not-allowed disabled:opacity-30"
                                >
                                    Documentation
                                </button>
                            </li>
                            <li>
                                <button
                                    onClick={onReadResearch}
                                    disabled={!hasThesis}
                                    className="transition-opacity hover:opacity-60 disabled:cursor-not-allowed disabled:opacity-30"
                                >
                                    Research
                                </button>
                            </li>
                            <li>
                                <Link href={dashboardHref} className="transition-opacity hover:opacity-60">
                                    Support
                                </Link>
                            </li>
                        </ul>
                    </div>

                    <div>
                        <h4 className="mb-5 text-[10px] font-bold tracking-widest uppercase opacity-60">
                            Company
                        </h4>
                        <ul className="space-y-3 text-sm font-medium">
                            <li>
                                <Link href={dashboardHref} className="transition-opacity hover:opacity-60">
                                    About
                                </Link>
                            </li>
                            <li>
                                <Link href={dashboardHref} className="transition-opacity hover:opacity-60">
                                    Contact
                                </Link>
                            </li>
                        </ul>
                    </div>
                </div>

                <div className="flex flex-col items-center justify-between gap-4 border-t border-yellow-900/10 pt-8 text-[10px] font-black tracking-widest uppercase opacity-40 md:flex-row">
                    <div>© 2026 BuzzyHive 2.0. All rights reserved.</div>
                    <div>FYP · Universiti Teknikal Malaysia Melaka</div>
                </div>
            </div>
        </footer>
    );
}
