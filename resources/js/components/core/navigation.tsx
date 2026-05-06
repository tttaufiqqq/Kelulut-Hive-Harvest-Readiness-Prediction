import { Link } from '@inertiajs/react';
import { motion } from 'motion/react';
import React, { useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';

interface TabProps {
    tabs: { id: string; label: string; icon?: React.ReactNode }[];
    activeTab: string;
    onChange: (id: string) => void;
    className?: string;
}

export const Tabs = ({ tabs, activeTab, onChange, className }: TabProps) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const buttonRefs = useRef<Map<string, HTMLButtonElement>>(new Map());

    useEffect(() => {
        const container = containerRef.current;
        const btn = buttonRefs.current.get(activeTab);

        if (!container || !btn) {
            return;
        }

        const containerRect = container.getBoundingClientRect();
        const btnRect = btn.getBoundingClientRect();
        container.scrollTo({
            left:
                container.scrollLeft +
                btnRect.left -
                containerRect.left -
                containerRect.width / 2 +
                btnRect.width / 2,
            behavior: 'smooth',
        });
    }, [activeTab]);

    return (
        <div ref={containerRef} className={cn('overflow-x-auto', className)}>
            <div className="flex w-fit rounded-2xl bg-yellow-100/50 p-1">
                {tabs.map((tab) => (
                    <button
                        key={tab.id}
                        ref={(el) => {
                            if (el) {
                                buttonRefs.current.set(tab.id, el);
                            }
                        }}
                        onClick={() => onChange(tab.id)}
                        className={cn(
                            'relative flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-bold transition-all',
                            activeTab === tab.id
                                ? 'text-yellow-950'
                                : 'text-amber-900/50 hover:text-amber-900',
                        )}
                    >
                        {activeTab === tab.id && (
                            <motion.div
                                layoutId="activeTab"
                                className="absolute inset-0 rounded-xl bg-white shadow-sm"
                                transition={{
                                    type: 'spring',
                                    bounce: 0.2,
                                    duration: 0.6,
                                }}
                            />
                        )}
                        <span className="relative z-10 flex items-center gap-2">
                            {tab.icon}
                            {tab.label}
                        </span>
                    </button>
                ))}
            </div>
        </div>
    );
};

interface BreadcrumbsProps {
    items: { label: string; href?: string }[];
    className?: string;
}

export const Breadcrumbs = ({ items, className }: BreadcrumbsProps) => {
    return (
        <nav
            className={cn(
                'flex flex-wrap items-center gap-2 text-xs font-bold tracking-widest text-amber-900/40 uppercase',
                className,
            )}
        >
            {items.map((item, i) => (
                <React.Fragment key={i}>
                    {i > 0 && <span>/</span>}
                    {item.href ? (
                        <Link
                            href={item.href}
                            className="transition-colors hover:text-yellow-600"
                        >
                            {item.label}
                        </Link>
                    ) : (
                        <span className="text-amber-900/80">{item.label}</span>
                    )}
                </React.Fragment>
            ))}
        </nav>
    );
};
