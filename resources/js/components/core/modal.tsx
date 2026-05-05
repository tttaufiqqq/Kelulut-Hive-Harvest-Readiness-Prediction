import { X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { ScrollArea } from '@/components/core/scroll-area';

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    children: React.ReactNode;
    maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '4xl';
    mobileLayout?: 'centered' | 'sheet';
}

const maxWidthMap = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
    '4xl': 'max-w-4xl',
};

export function Modal({
    isOpen,
    onClose,
    title,
    children,
    maxWidth = 'md',
    mobileLayout = 'centered',
}: ModalProps) {
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }

        return () => {
            document.body.style.overflow = '';
        };
    }, [isOpen]);

    // Portal to document.body bypasses any parent stacking context
    // (e.g. motion.div opacity animations) that would cause z-index to lose
    // against the sticky navbar.
    if (typeof document === 'undefined') {
        return null;
    }

    return createPortal(
        <AnimatePresence>
            {isOpen && (
                <div
                    className={`fixed inset-0 z-[9999] flex justify-center ${
                        mobileLayout === 'sheet'
                            ? 'items-end p-0 sm:items-center sm:p-6'
                            : 'items-center p-4 sm:p-6'
                    }`}
                >
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 bg-amber-950/40 backdrop-blur-sm"
                        onClick={onClose}
                    />

                    {/* Modal Box */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        className={`relative flex w-full flex-col overflow-hidden bg-white shadow-2xl ${
                            mobileLayout === 'sheet'
                                ? `max-h-[92dvh] rounded-t-[2rem] rounded-b-none sm:max-h-[90vh] sm:rounded-[2.5rem] ${maxWidthMap[maxWidth]}`
                                : `max-h-[calc(100vh-2rem)] rounded-[2rem] sm:max-h-[90vh] sm:rounded-[2.5rem] ${maxWidthMap[maxWidth]}`
                        }`}
                    >
                        {/* Top accent bar */}
                        <div className="absolute top-0 left-0 h-2 w-full flex-shrink-0 bg-yellow-400" />

                        {/* Header — pinned */}
                        <div className="flex flex-shrink-0 items-center justify-between px-5 pt-5 pb-0 sm:px-8 sm:pt-8">
                            <h2 className="text-xl font-bold text-amber-900 sm:text-2xl">
                                {title}
                            </h2>
                            <button
                                onClick={onClose}
                                className="flex-shrink-0 rounded-full bg-yellow-50/50 p-2 text-amber-900/60 transition-colors hover:bg-yellow-100 hover:text-amber-900"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        {/* Content — scrollable */}
                        <ScrollArea className="flex-1 px-5 pt-4 pb-6 sm:px-8 sm:pt-6 sm:pb-8">
                            {children}
                        </ScrollArea>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>,
        document.body,
    );
}

export default Modal;
