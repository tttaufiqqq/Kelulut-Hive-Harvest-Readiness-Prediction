import { ChevronDown, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { cn } from '@/lib/utils';

export interface SelectOption {
    value: string | number;
    label: string;
}

interface SelectFieldProps {
    label?: string;
    value: string | number;
    onChange: (value: string) => void;
    options: SelectOption[];
    placeholder?: string;
    error?: string;
    disabled?: boolean;
    className?: string;
}

export function SelectField({
    label,
    value,
    onChange,
    options,
    placeholder = 'Select...',
    error,
    disabled,
    className,
}: SelectFieldProps) {
    const [open, setOpen] = useState(false);
    const [menuStyle, setMenuStyle] = useState<React.CSSProperties>({});
    const triggerRef = useRef<HTMLButtonElement>(null);
    const menuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handler = (e: MouseEvent) => {
            const t = e.target as Node;

            if (
                !triggerRef.current?.contains(t) &&
                !menuRef.current?.contains(t)
            ) {
                setOpen(false);
            }
        };
        document.addEventListener('mousedown', handler);

        return () => document.removeEventListener('mousedown', handler);
    }, []);

    const handleOpen = () => {
        if (disabled) {
            return;
        }

        if (!open && triggerRef.current) {
            const rect = triggerRef.current.getBoundingClientRect();
            setMenuStyle({
                position: 'fixed',
                top: rect.bottom + 4,
                left: rect.left,
                width: rect.width,
                zIndex: 9999,
            });
        }

        setOpen((o) => !o);
    };

    const selected = options.find((o) => String(o.value) === String(value));

    return (
        <div className={cn('w-full space-y-1.5', className)}>
            {label && (
                <label className="ml-1 text-sm font-medium text-amber-900">
                    {label}
                </label>
            )}

            <button
                ref={triggerRef}
                type="button"
                onClick={handleOpen}
                disabled={disabled}
                className={cn(
                    'w-full rounded-2xl border border-yellow-200 bg-yellow-50/50 px-4 py-2.5 text-sm',
                    'flex items-center justify-between gap-2 text-left transition-all',
                    'focus:ring-2 focus:ring-yellow-400/50 focus:outline-none',
                    open && 'ring-2 ring-yellow-400/50',
                    error && 'border-red-400 focus:ring-red-400/50',
                    disabled && 'cursor-not-allowed opacity-50',
                    !selected ? 'text-amber-900/40' : 'text-amber-950',
                )}
            >
                <span className="truncate">
                    {selected?.label ?? placeholder}
                </span>
                <ChevronDown
                    className={cn(
                        'h-4 w-4 flex-shrink-0 text-amber-900/40 transition-transform',
                        open && 'rotate-180',
                    )}
                />
            </button>

            {error && <p className="ml-1 text-xs text-red-500">{error}</p>}

            {typeof document !== 'undefined' &&
                createPortal(
                    <AnimatePresence>
                        {open && (
                            <motion.div
                                ref={menuRef}
                                initial={{ opacity: 0, y: -4, scale: 0.98 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: -4, scale: 0.98 }}
                                transition={{ duration: 0.15, ease: 'easeOut' }}
                                style={menuStyle}
                                className="overflow-hidden rounded-2xl border border-yellow-100 bg-white py-1 shadow-xl"
                            >
                                {options.map((opt) => {
                                    const isSelected =
                                        String(opt.value) === String(value);

                                    return (
                                        <button
                                            key={opt.value}
                                            type="button"
                                            onClick={() => {
                                                onChange(String(opt.value));
                                                setOpen(false);
                                            }}
                                            className={cn(
                                                'flex w-full items-center justify-between px-4 py-2.5 text-left text-sm transition-colors',
                                                isSelected
                                                    ? 'bg-yellow-100 font-semibold text-amber-900'
                                                    : 'text-amber-900 hover:bg-yellow-50',
                                            )}
                                        >
                                            <span>{opt.label}</span>
                                            {isSelected && (
                                                <Check className="h-3.5 w-3.5 flex-shrink-0 text-amber-600" />
                                            )}
                                        </button>
                                    );
                                })}
                            </motion.div>
                        )}
                    </AnimatePresence>,
                    document.body,
                )}
        </div>
    );
}
