import { X, Download, FileText, ExternalLink } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { useEffect } from 'react';

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
                        className="relative bg-[#FFFBEB] w-full max-w-5xl rounded-[2rem] shadow-2xl overflow-hidden flex flex-col"
                        style={{ height: 'min(90vh, 860px)' }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Top accent bar */}
                        <div className="absolute top-0 left-0 w-full h-1.5 bg-yellow-400" />

                        {/* Header */}
                        <div className="flex items-center justify-between px-6 pt-7 pb-4 border-b border-yellow-100 shrink-0">
                            <div className="flex items-center gap-3">
                                <div className="bg-yellow-100 p-2.5 rounded-2xl">
                                    <FileText className="w-5 h-5 text-yellow-700" />
                                </div>
                                <div>
                                    <h2 className="text-lg font-black uppercase tracking-tighter text-amber-950">
                                        Research Thesis
                                    </h2>
                                    <p className="text-xs text-amber-900/50 font-medium">BuzzyHive 2.0 — FYP Report</p>
                                </div>
                            </div>

                            <div className="flex items-center gap-2">
                                <a
                                    href={thesisUrl}
                                    download
                                    className="flex items-center gap-1.5 px-4 py-2 bg-yellow-400 hover:bg-yellow-500 text-yellow-950 font-bold text-sm rounded-full transition-colors"
                                >
                                    <Download className="w-4 h-4" />
                                    Download
                                </a>
                                <button
                                    onClick={onClose}
                                    className="p-2 hover:bg-yellow-100 rounded-full transition-colors text-amber-900/50 hover:text-amber-900"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                        </div>

                        {/* PDF Viewer — desktop */}
                        <div className="hidden md:block flex-1 p-4 overflow-hidden">
                            <iframe
                                src={`${thesisUrl}#toolbar=0&navpanes=0`}
                                className="w-full h-full rounded-2xl border border-yellow-100"
                                title="BuzzyHive 2.0 Thesis"
                            />
                        </div>

                        {/* Mobile fallback — open natively */}
                        <div className="md:hidden flex-1 flex flex-col items-center justify-center gap-5 p-8">
                            <div className="bg-yellow-100 p-5 rounded-3xl">
                                <FileText className="w-10 h-10 text-yellow-600" />
                            </div>
                            <p className="text-sm text-amber-900/50 text-center font-medium">
                                PDF preview is not supported on mobile. Open it in your browser's native viewer instead.
                            </p>
                            <a
                                href={thesisUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-2 px-6 py-3 bg-yellow-400 hover:bg-yellow-500 text-yellow-950 font-bold text-sm rounded-full transition-colors"
                            >
                                <ExternalLink className="w-4 h-4" />
                                Open PDF
                            </a>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
