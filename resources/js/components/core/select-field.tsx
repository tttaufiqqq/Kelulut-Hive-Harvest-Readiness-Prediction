import { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '@/lib/utils';

export interface SelectOption {
    value: string | number;
    label: string;
}

interface SelectFieldProps {
    label?:       string;
    value:        string | number;
    onChange:     (value: string) => void;
    options:      SelectOption[];
    placeholder?: string;
    error?:       string;
    disabled?:    boolean;
    className?:   string;
}

export function SelectField({
    label, value, onChange, options, placeholder = 'Select...', error, disabled, className,
}: SelectFieldProps) {
    const [open, setOpen]         = useState(false);
    const [menuStyle, setMenuStyle] = useState<React.CSSProperties>({});
    const triggerRef              = useRef<HTMLButtonElement>(null);
    const menuRef                 = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handler = (e: MouseEvent) => {
            const t = e.target as Node;
            if (!triggerRef.current?.contains(t) && !menuRef.current?.contains(t)) {
                setOpen(false);
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    const handleOpen = () => {
        if (disabled) return;
        if (!open && triggerRef.current) {
            const rect = triggerRef.current.getBoundingClientRect();
            setMenuStyle({
                position: 'fixed',
                top:      rect.bottom + 4,
                left:     rect.left,
                width:    rect.width,
                zIndex:   9999,
            });
        }
        setOpen(o => !o);
    };

    const selected = options.find(o => String(o.value) === String(value));

    return (
        <div className={cn('space-y-1.5 w-full', className)}>
            {label && (
                <label className="text-sm font-medium text-amber-900 ml-1">{label}</label>
            )}

            <button
                ref={triggerRef}
                type="button"
                onClick={handleOpen}
                disabled={disabled}
                className={cn(
                    'w-full px-4 py-2.5 bg-yellow-50/50 border border-yellow-200 rounded-2xl text-sm',
                    'flex items-center justify-between gap-2 transition-all text-left',
                    'focus:outline-none focus:ring-2 focus:ring-yellow-400/50',
                    open        && 'ring-2 ring-yellow-400/50',
                    error       && 'border-red-400 focus:ring-red-400/50',
                    disabled    && 'opacity-50 cursor-not-allowed',
                    !selected   ? 'text-amber-900/40' : 'text-amber-950',
                )}
            >
                <span className="truncate">{selected?.label ?? placeholder}</span>
                <ChevronDown className={cn('w-4 h-4 text-amber-900/40 flex-shrink-0 transition-transform', open && 'rotate-180')} />
            </button>

            {error && <p className="text-xs text-red-500 ml-1">{error}</p>}

            {typeof document !== 'undefined' && createPortal(
                <AnimatePresence>
                    {open && (
                        <motion.div
                            ref={menuRef}
                            initial={{ opacity: 0, y: -4, scale: 0.98 }}
                            animate={{ opacity: 1, y: 0,  scale: 1    }}
                            exit={{    opacity: 0, y: -4, scale: 0.98 }}
                            transition={{ duration: 0.15, ease: 'easeOut' }}
                            style={menuStyle}
                            className="bg-white border border-yellow-100 rounded-2xl shadow-xl overflow-hidden py-1"
                        >
                            {options.map(opt => {
                                const isSelected = String(opt.value) === String(value);
                                return (
                                    <button
                                        key={opt.value}
                                        type="button"
                                        onClick={() => { onChange(String(opt.value)); setOpen(false); }}
                                        className={cn(
                                            'w-full flex items-center justify-between px-4 py-2.5 text-sm transition-colors text-left',
                                            isSelected
                                                ? 'bg-yellow-100 text-amber-900 font-semibold'
                                                : 'text-amber-900 hover:bg-yellow-50',
                                        )}
                                    >
                                        <span>{opt.label}</span>
                                        {isSelected && <Check className="w-3.5 h-3.5 text-amber-600 flex-shrink-0" />}
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
