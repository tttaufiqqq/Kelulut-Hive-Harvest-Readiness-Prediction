import { motion, AnimatePresence } from 'motion/react';
import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { cn } from '@/lib/utils';

interface DropdownItem {
    id: string;
    label: string;
    icon?: React.ReactNode;
    onClick?: () => void;
    variant?: 'default' | 'danger';
}

interface DropdownProps {
    trigger: React.ReactNode;
    items: DropdownItem[];
    align?: 'left' | 'right';
    className?: string;
}

export const Dropdown = ({
    trigger,
    items,
    align = 'right',
    className,
}: DropdownProps) => {
    const [isOpen, setIsOpen] = useState(false);
    const [menuStyle, setMenuStyle] = useState<React.CSSProperties>({});
    const [openUpward, setOpenUpward] = useState(false);
    const triggerRef = useRef<HTMLDivElement>(null);
    const menuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            const target = event.target as Node;
            const insideTrigger = triggerRef.current?.contains(target);
            const insideMenu = menuRef.current?.contains(target);

            if (!insideTrigger && !insideMenu) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);

        return () =>
            document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleOpen = (e: React.MouseEvent) => {
        e.stopPropagation();

        if (!isOpen && triggerRef.current) {
            const rect = triggerRef.current.getBoundingClientRect();
            const ESTIMATED_MENU_HEIGHT = 256;
            const spaceBelow = window.innerHeight - rect.bottom - 8;
            const shouldOpenUpward = spaceBelow < ESTIMATED_MENU_HEIGHT;
            setOpenUpward(shouldOpenUpward);
            const topValue = shouldOpenUpward
                ? rect.top - ESTIMATED_MENU_HEIGHT - 8
                : rect.bottom + 8;
            setMenuStyle(
                align === 'right'
                    ? {
                          position: 'fixed',
                          top: topValue,
                          right: window.innerWidth - rect.right,
                          zIndex: 9999,
                      }
                    : {
                          position: 'fixed',
                          top: topValue,
                          left: rect.left,
                          zIndex: 9999,
                      },
            );
        }

        setIsOpen((prev) => !prev);
    };

    return (
        <div
            className={cn('relative inline-block text-left', className)}
            ref={triggerRef}
        >
            <div onClick={handleOpen} className="cursor-pointer">
                {trigger}
            </div>

            {typeof document !== 'undefined' &&
                createPortal(
                    <AnimatePresence>
                        {isOpen && (
                            <motion.div
                                ref={menuRef}
                                initial={{ opacity: 0, scale: 0.95, y: openUpward ? -10 : 10 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95, y: openUpward ? -10 : 10 }}
                                transition={{ duration: 0.2, ease: 'easeOut' }}
                                style={menuStyle}
                                className="w-56 overflow-hidden rounded-2xl bg-white shadow-2xl ring-1 ring-yellow-100 focus:outline-none"
                            >
                                <div className="max-h-60 overflow-y-auto py-1 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:rounded-full [&::-webkit-scrollbar-track]:bg-amber-50 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-amber-300 [&::-webkit-scrollbar-thumb:hover]:bg-amber-400">
                                    {items.map((item) => (
                                        <button
                                            key={item.id}
                                            onClick={() => {
                                                item.onClick?.();
                                                setIsOpen(false);
                                            }}
                                            className={cn(
                                                'flex w-full items-center gap-3 px-4 py-3 text-sm font-bold transition-colors',
                                                item.variant === 'danger'
                                                    ? 'text-red-600 hover:bg-red-50'
                                                    : 'text-amber-900 hover:bg-yellow-50',
                                            )}
                                        >
                                            {item.icon && (
                                                <span className="opacity-60">
                                                    {item.icon}
                                                </span>
                                            )}
                                            {item.label}
                                        </button>
                                    ))}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>,
                    document.body,
                )}
        </div>
    );
};
