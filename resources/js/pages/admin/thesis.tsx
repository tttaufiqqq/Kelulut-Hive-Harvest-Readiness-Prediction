import { Head, router, useForm, usePage } from '@inertiajs/react';
import { useRef, useState } from 'react';
import { FlashAlerts } from '@/components/core/feedback/flash-alerts';
import type { FlashMessageBag } from '@/components/core/feedback/flash-alerts';
import { ConfirmModal } from '@/components/core/overlay/confirm-modal';
import { AdminLayout } from '@/layouts/admin-layout';
import { ThesisStatusCard } from './thesis/ThesisStatusCard';
import { ThesisUploadCard } from './thesis/ThesisUploadCard';

type Props = {
    thesisUrl: string | null;
    uploadedAt: string | null;
    maxUploadBytes: number;
};

export default function ThesisPage({ thesisUrl, uploadedAt, maxUploadBytes }: Props) {
    const { props } = usePage<{ flash?: FlashMessageBag }>();
    const flash = props.flash;

    const fileRef = useRef<HTMLInputElement>(null);
    const [dragging, setDragging] = useState(false);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [clientErrors, setClientErrors] = useState<string[]>([]);
    const [showRemoveModal, setShowRemoveModal] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const uploadForm = useForm<{ thesis: File | null }>({ thesis: null });

    const uploadErrors = Array.from(
        new Set([...clientErrors, ...Object.values(uploadForm.errors).filter(Boolean)]),
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
return `The thesis PDF must be ${maxUploadBytes / 1024 / 1024} MB or smaller.`;
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
                        Upload your research thesis. Visitors can view it from the landing page.
                    </p>
                </div>

                <FlashAlerts key={flash?.id ?? 'thesis-flash'} flash={flash} />

                <ThesisStatusCard
                    thesisUrl={thesisUrl}
                    uploadedAt={uploadedAt}
                    onRemoveClick={() => setShowRemoveModal(true)}
                />

                <ThesisUploadCard
                    thesisUrl={thesisUrl}
                    dragging={dragging}
                    selectedFile={selectedFile}
                    maxUploadBytes={maxUploadBytes}
                    processing={uploadForm.processing}
                    uploadErrors={uploadErrors}
                    fileInputRef={fileRef}
                    onDrop={handleDrop}
                    onDragOver={(e) => {
                        e.preventDefault();
                        setDragging(true);
                    }}
                    onDragLeave={() => setDragging(false)}
                    onFileChange={(e) => handleFile(e.target.files?.[0] ?? null)}
                    onUpload={handleUpload}
                    onCancel={() => {
                        setClientErrors([]);
                        uploadForm.clearErrors();
                        resetSelectedFile();
                    }}
                />
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
