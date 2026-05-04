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
            setMenuStyle(
                align === 'right'
                    ? {
                          position: 'fixed',
                          top: rect.bottom + 8,
                          right: window.innerWidth - rect.right,
                          zIndex: 9999,
                      }
                    : {
                          position: 'fixed',
                          top: rect.bottom + 8,
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
                                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95, y: 10 }}
                                transition={{ duration: 0.2, ease: 'easeOut' }}
                                style={menuStyle}
                                className="w-56 overflow-hidden rounded-2xl bg-white shadow-2xl ring-1 ring-yellow-100 focus:outline-none"
                            >
                                <div className="py-1">
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
