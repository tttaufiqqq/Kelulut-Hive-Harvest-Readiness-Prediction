import { X, Download, FileText, ExternalLink } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { useEffect } from 'react';
import { ScrollArea } from '@/components/core/scroll-area';

interface ThesisModalProps {
    isOpen: boolean;
    onClose: () => void;
    thesisUrl: string;
}

export function ThesisModal({ isOpen, onClose, thesisUrl }: ThesisModalProps) {
    useEffect(() => {
        document.body.style.overflow = isOpen ? 'hidden' : '';

        return () => {
            document.body.style.overflow = '';
        };
    }, [isOpen]);

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-6">
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 bg-amber-950/60 backdrop-blur-sm"
                        onClick={onClose}
                    />

                    {/* Modal */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 24 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 24 }}
                        transition={{ duration: 0.25, ease: 'easeOut' }}
                        className="relative flex w-full max-w-5xl flex-col overflow-hidden rounded-[2rem] bg-[#FFFBEB] shadow-2xl"
                        style={{ height: 'min(90vh, 860px)' }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Top accent bar */}
                        <div className="absolute top-0 left-0 h-1.5 w-full bg-yellow-400" />

                        {/* Header */}
                        <div className="shrink-0 border-b border-yellow-100 px-5 pt-6 pb-4 sm:px-6 sm:pt-7">
                            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                                <div className="flex min-w-0 items-start gap-3">
                                    <div className="shrink-0 rounded-2xl bg-yellow-100 p-2.5">
                                        <FileText className="h-5 w-5 text-yellow-700" />
                                    </div>
                                    <div className="min-w-0">
                                        <h2 className="text-base leading-tight font-black tracking-tight text-amber-950 uppercase sm:text-lg">
                                            Research Thesis
                                        </h2>
                                        <p className="mt-1 text-xs leading-relaxed font-medium text-amber-900/50 sm:text-sm">
                                            BuzzyHive 2.0 — FYP Report
                                        </p>
                                    </div>
                                </div>

                                <div className="flex w-full items-center gap-2 sm:w-auto sm:flex-shrink-0">
                                    <a
                                        href={thesisUrl}
                                        download
                                        className="flex flex-1 items-center justify-center gap-1.5 rounded-full bg-yellow-400 px-4 py-2 text-sm font-bold text-yellow-950 transition-colors hover:bg-yellow-500 sm:flex-none"
                                    >
                                        <Download className="h-4 w-4" />
                                        Download
                                    </a>
                                    <button
                                        onClick={onClose}
                                        className="rounded-full p-2 text-amber-900/50 transition-colors hover:bg-yellow-100 hover:text-amber-900"
                                    >
                                        <X className="h-5 w-5" />
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* PDF Viewer — desktop */}
                        <ScrollArea
                            className="hidden flex-1 p-4 md:block"
                            direction="both"
                        >
                            <iframe
                                src={`${thesisUrl}#toolbar=0&navpanes=0`}
                                className="h-full w-full rounded-2xl border border-yellow-100"
                                title="BuzzyHive 2.0 Thesis"
                            />
                        </ScrollArea>

                        {/* Mobile fallback — open natively */}
                        <div className="flex flex-1 flex-col items-center justify-center gap-5 p-8 md:hidden">
                            <div className="rounded-3xl bg-yellow-100 p-5">
                                <FileText className="h-10 w-10 text-yellow-600" />
                            </div>
                            <p className="text-center text-sm font-medium text-amber-900/50">
                                PDF preview is not supported on mobile. Open it
                                in your browser's native viewer instead.
                            </p>
                            <a
                                href={thesisUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-2 rounded-full bg-yellow-400 px-6 py-3 text-sm font-bold text-yellow-950 transition-colors hover:bg-yellow-500"
                            >
                                <ExternalLink className="h-4 w-4" />
                                Open PDF
                            </a>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
