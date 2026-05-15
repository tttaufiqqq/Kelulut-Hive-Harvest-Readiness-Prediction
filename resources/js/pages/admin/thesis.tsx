import { Head, router, useForm, usePage } from '@inertiajs/react';
import {
    Upload,
    FileText,
    Trash2,
    ExternalLink,
    CheckCircle,
} from 'lucide-react';
import { useRef, useState } from 'react';
import { AlertError } from '@/components/core/alert-error';
import { Button } from '@/components/core/button';
import { Card } from '@/components/core/card';
import { FlashAlerts } from '@/components/core/flash-alerts';
import type { FlashMessageBag } from '@/components/core/flash-alerts';
import { ConfirmModal } from '@/components/core/confirm-modal';
import { AdminLayout } from '@/layouts/admin-layout';

type Props = {
    thesisUrl: string | null;
    uploadedAt: string | null;
    maxUploadBytes: number;
};

function formatUploadLimit(bytes: number): string {
    const megabytes = bytes / 1024 / 1024;

    if (Number.isInteger(megabytes)) {
        return `${megabytes} MB`;
    }

    return `${megabytes.toFixed(1)} MB`;
}

export default function ThesisPage({
    thesisUrl,
    uploadedAt,
    maxUploadBytes,
}: Props) {
    const { props } = usePage<{ flash?: FlashMessageBag }>();
    const flash = props.flash;
    const maxUploadLabel = formatUploadLimit(maxUploadBytes);

    const fileRef = useRef<HTMLInputElement>(null);
    const [dragging, setDragging] = useState(false);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [clientErrors, setClientErrors] = useState<string[]>([]);
    const [showRemoveModal, setShowRemoveModal] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const uploadForm = useForm<{ thesis: File | null }>({ thesis: null });

    const uploadErrors = Array.from(
        new Set([
            ...clientErrors,
            ...Object.values(uploadForm.errors).filter(Boolean),
        ]),
    );

    function resetSelectedFile() {
        setSelectedFile(null);
        uploadForm.reset();

        if (fileRef.current) {
            fileRef.current.value = '';
        }
    }

    function validatePdf(file: File): string | null {
        const isPdfMime =
            file.type === 'application/pdf' ||
            file.type === 'application/x-pdf' ||
            file.type === '';
        const hasPdfExtension = /\.pdf$/i.test(file.name);

        if (!isPdfMime && !hasPdfExtension) {
            return 'Please choose a PDF file for the thesis.';
        }

        if (file.size > maxUploadBytes) {
            return `The thesis PDF must be ${maxUploadLabel} or smaller.`;
        }

        return null;
    }

    function handleFile(file: File | null) {
        if (!file) {
            return;
        }

        setClientErrors([]);
        uploadForm.clearErrors();

        const validationError = validatePdf(file);

        if (validationError) {
            setClientErrors([validationError]);
            resetSelectedFile();

            return;
        }

        setSelectedFile(file);
        uploadForm.setData('thesis', file);
    }

    function handleDrop(e: React.DragEvent) {
        e.preventDefault();
        setDragging(false);
        handleFile(e.dataTransfer.files[0] ?? null);
    }

    function handleUpload() {
        if (!selectedFile) {
            setClientErrors(['Please choose a thesis PDF to upload.']);

            return;
        }

        uploadForm.post(route('admin.thesis.upload'), {
            forceFormData: true,
            preserveScroll: true,
            onSuccess: () => {
                setClientErrors([]);
                resetSelectedFile();
            },
        });
    }

    function confirmRemove() {
        setDeleting(true);
        router.delete(route('admin.thesis.destroy'), {
            onFinish: () => {
                setDeleting(false);
                setShowRemoveModal(false);
            },
        });
    }

    return (
        <AdminLayout>
            <Head title="Thesis — Admin" />

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

                    {uploadErrors.length > 0 && (
                        <div className="mb-4">
                            <AlertError
                                errors={uploadErrors}
                                title="Thesis upload failed."
                            />
                        </div>
                    )}

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
                                    PDF only · max {maxUploadLabel}
                                </p>
                            </div>
                        )}
                    </div>

                    {selectedFile && (
                        <div className="mt-4 flex gap-3">
                            <Button
                                onClick={handleUpload}
                                disabled={uploadForm.processing}
                                size="md"
                            >
                                {uploadForm.processing
                                    ? 'Uploading...'
                                    : 'Upload Thesis'}
                            </Button>
                            <Button
                                variant="ghost"
                                size="md"
                                onClick={() => {
                                    setClientErrors([]);
                                    uploadForm.clearErrors();
                                    resetSelectedFile();
                                }}
                                disabled={uploadForm.processing}
                            >
                                Cancel
                            </Button>
                        </div>
                    )}
                </Card>
            </div>
            <ConfirmModal
                isOpen={showRemoveModal}
                onClose={() => setShowRemoveModal(false)}
                onConfirm={confirmRemove}
                title="Remove Thesis"
                message="Are you sure you want to remove the uploaded thesis? Visitors will no longer be able to view it."
                confirmLabel={deleting ? 'Deleting...' : 'Remove'}
                variant="destructive"
                loading={deleting}
            />
        </AdminLayout>
    );
}
