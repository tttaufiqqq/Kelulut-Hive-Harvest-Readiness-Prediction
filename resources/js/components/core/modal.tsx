import { X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import React from "react";
import { createPortal } from 'react-dom';

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    children: React.ReactNode;
    maxWidth?: 'sm' | 'md' | 'lg' | 'xl';
}

const maxWidthMap = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
};

export function Modal({ isOpen, onClose, title, children, maxWidth = 'md' }: ModalProps) {
    // Portal to document.body bypasses any parent stacking context
    // (e.g. motion.div opacity animations) that would cause z-index to lose
    // against the sticky navbar.
    if (typeof document === 'undefined') {
return null;
}

    return createPortal(
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[9999] flex items-center justify-center p-6">
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
                        className={`relative bg-white w-full ${maxWidthMap[maxWidth]} rounded-[2.5rem] p-8 shadow-2xl overflow-hidden`}
                    >
                        {/* Top accent bar */}
                        <div className="absolute top-0 left-0 w-full h-2 bg-yellow-400" />

                        {/* Header */}
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-2xl font-bold text-amber-900">{title}</h2>
                            <button
                                onClick={onClose}
                                className="p-2 hover:bg-yellow-50 rounded-full transition-colors text-amber-900/40 hover:text-amber-900"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Content */}
                        {children}
                    </motion.div>
                </div>
            )}
        </AnimatePresence>,
        document.body
    );
}

export default Modal;
