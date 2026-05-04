import { Head, router, usePage } from '@inertiajs/react';
import {
    Upload,
    FileText,
    Trash2,
    ExternalLink,
    CheckCircle,
} from 'lucide-react';
import { useRef, useState } from 'react';
import { Button } from '@/components/core/button';
import { Card } from '@/components/core/card';
import { FlashAlerts } from '@/components/core/flash-alerts';
import type { FlashMessageBag } from '@/components/core/flash-alerts';
import { Modal } from '@/components/core/modal';
import { AdminLayout } from '@/layouts/admin-layout';

type Props = {
    thesisUrl: string | null;
    uploadedAt: string | null;
};

export default function ThesisPage({ thesisUrl, uploadedAt }: Props) {
    const { props } = usePage<{ flash?: FlashMessageBag }>();
    const flash = props.flash;

    const fileRef = useRef<HTMLInputElement>(null);
    const [dragging, setDragging] = useState(false);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [uploading, setUploading] = useState(false);
    const [showRemoveModal, setShowRemoveModal] = useState(false);
    const [deleting, setDeleting] = useState(false);

    function handleFile(file: File | null) {
        if (!file) {
            return;
        }

        if (file.type !== 'application/pdf') {
            alert('Only PDF files are allowed.');

            return;
        }

        setSelectedFile(file);
    }

    function handleDrop(e: React.DragEvent) {
        e.preventDefault();
        setDragging(false);
        handleFile(e.dataTransfer.files[0] ?? null);
    }

    function handleUpload() {
        if (!selectedFile) {
            return;
        }

        setUploading(true);
        const form = new FormData();
        form.append('thesis', selectedFile);
        router.post('/admin/thesis', form, {
            forceFormData: true,
            onFinish: () => {
                setUploading(false);
                setSelectedFile(null);
            },
        });
    }

    function confirmRemove() {
        setDeleting(true);
        router.delete('/admin/thesis', {
            onFinish: () => {
                setDeleting(false);
                setShowRemoveModal(false);
            },
        });
    }

    return (
        <AdminLayout>
            <Head title="Thesis — Admin BuzzyHive 2.0" />

            <div className="space-y-6">
                <div>
                    <h2 className="text-2xl font-black tracking-tighter text-amber-950 uppercase">
                        Thesis PDF
                    </h2>
                    <p className="mt-1 text-sm text-amber-900/50">
                        Upload your research thesis. Visitors can view it from
                        the landing page.
                    </p>
                </div>

                <FlashAlerts key={flash?.id ?? 'thesis-flash'} flash={flash} />

                {/* Current thesis status */}
                {thesisUrl ? (
                    <Card>
                        <div className="flex items-start gap-4">
                            <div className="shrink-0 rounded-2xl bg-emerald-100 p-3">
                                <CheckCircle className="h-6 w-6 text-emerald-600" />
                            </div>
                            <div className="min-w-0 flex-1">
                                <p className="font-black text-amber-950">
                                    Thesis is live
                                </p>
                                <p className="mt-0.5 text-xs text-amber-900/50">
                                    Uploaded {uploadedAt}
                                </p>
                                <div className="mt-4 flex flex-wrap gap-3">
                                    <a
                                        href={thesisUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex cursor-pointer items-center gap-1.5 rounded-full bg-yellow-400 px-4 py-2 text-sm font-bold text-yellow-950 transition-colors hover:bg-yellow-500"
                                    >
                                        <ExternalLink className="h-3.5 w-3.5" />
                                        Preview PDF
                                    </a>
                                    <Button
                                        variant="destructive"
                                        size="sm"
                                        onClick={() => setShowRemoveModal(true)}
                                    >
                                        <Trash2 className="mr-1.5 h-3.5 w-3.5" />
                                        Remove
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </Card>
                ) : (
                    <Card>
                        <div className="flex items-center gap-3 text-amber-900/40">
                            <FileText className="h-5 w-5" />
                            <p className="text-sm font-semibold">
                                No thesis uploaded yet.
                            </p>
                        </div>
                    </Card>
                )}

                {/* Upload area */}
                <Card>
                    <h3 className="mb-4 text-sm font-black tracking-widest text-amber-900/60 uppercase">
                        {thesisUrl ? 'Replace Thesis' : 'Upload Thesis'}
                    </h3>

                    {/* Drop zone */}
                    <div
                        className={`cursor-pointer rounded-2xl border-2 border-dashed p-10 text-center transition-colors ${
                            dragging
                                ? 'border-yellow-400 bg-yellow-50'
                                : selectedFile
                                  ? 'border-emerald-300 bg-emerald-50'
                                  : 'border-amber-200 hover:border-yellow-400 hover:bg-yellow-50/50'
                        }`}
                        onClick={() => fileRef.current?.click()}
                        onDragOver={(e) => {
                            e.preventDefault();
                            setDragging(true);
                        }}
                        onDragLeave={() => setDragging(false)}
                        onDrop={handleDrop}
                    >
                        <input
                            ref={fileRef}
                            type="file"
                            accept="application/pdf"
                            className="hidden"
                            onChange={(e) =>
                                handleFile(e.target.files?.[0] ?? null)
                            }
                        />

                        {selectedFile ? (
                            <div className="flex flex-col items-center gap-2">
                                <div className="rounded-2xl bg-emerald-100 p-3">
                                    <FileText className="h-7 w-7 text-emerald-600" />
                                </div>
                                <p className="font-bold text-emerald-700">
                                    {selectedFile.name}
                                </p>
                                <p className="text-xs text-amber-900/40">
                                    {(selectedFile.size / 1024 / 1024).toFixed(
                                        2,
                                    )}{' '}
                                    MB — click to change
                                </p>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center gap-2">
                                <div className="rounded-2xl bg-yellow-100 p-3">
                                    <Upload className="h-7 w-7 text-yellow-600" />
                                </div>
                                <p className="font-bold text-amber-900">
                                    Drop your PDF here, or click to browse
                                </p>
                                <p className="text-xs text-amber-900/40">
                                    PDF only · max 50 MB
                                </p>
                            </div>
                        )}
                    </div>

                    {selectedFile && (
                        <div className="mt-4 flex gap-3">
                            <Button
                                onClick={handleUpload}
                                disabled={uploading}
                                size="md"
                            >
                                {uploading ? 'Uploading...' : 'Upload Thesis'}
                            </Button>
                            <Button
                                variant="ghost"
                                size="md"
                                onClick={() => setSelectedFile(null)}
                                disabled={uploading}
                            >
                                Cancel
                            </Button>
                        </div>
                    )}
                </Card>
            </div>
            <Modal
                isOpen={showRemoveModal}
                onClose={() => setShowRemoveModal(false)}
                title="Remove Thesis"
                maxWidth="sm"
            >
                <div className="space-y-4">
                    <p className="text-sm text-amber-900/70">
                        Are you sure you want to remove the uploaded thesis?
                        Visitors will no longer be able to view it.
                    </p>
                    <div className="flex gap-3">
                        <Button
                            type="button"
                            variant="ghost"
                            onClick={() => setShowRemoveModal(false)}
                            disabled={deleting}
                            className="flex-1"
                        >
                            Cancel
                        </Button>
                        <Button
                            type="button"
                            variant="destructive"
                            onClick={confirmRemove}
                            disabled={deleting}
                            className="flex-1"
                        >
                            {deleting ? 'Deleting...' : 'Remove'}
                        </Button>
                    </div>
                </div>
            </Modal>
        </AdminLayout>
    );
}
