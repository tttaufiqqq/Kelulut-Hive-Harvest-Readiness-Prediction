import { FileText, Upload } from 'lucide-react';
import { Button } from '@/components/core/display/button';
import { Card } from '@/components/core/display/card';
import { AlertError } from '@/components/core/feedback/alert-error';

interface Props {
    thesisUrl: string | null;
    dragging: boolean;
    selectedFile: File | null;
    maxUploadBytes: number;
    processing: boolean;
    uploadErrors: string[];
    fileInputRef: React.RefObject<HTMLInputElement | null>;
    onDrop: React.DragEventHandler;
    onDragOver: React.DragEventHandler;
    onDragLeave: () => void;
    onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    onUpload: () => void;
    onCancel: () => void;
}

function formatUploadLimit(bytes: number): string {
    const megabytes = bytes / 1024 / 1024;

    if (Number.isInteger(megabytes)) {
        return `${megabytes} MB`;
    }

    return `${megabytes.toFixed(1)} MB`;
}

export function ThesisUploadCard({
    thesisUrl,
    dragging,
    selectedFile,
    maxUploadBytes,
    processing,
    uploadErrors,
    fileInputRef,
    onDrop,
    onDragOver,
    onDragLeave,
    onFileChange,
    onUpload,
    onCancel,
}: Props) {
    const maxUploadLabel = formatUploadLimit(maxUploadBytes);

    return (
        <Card>
            <h3 className="mb-4 text-sm font-black tracking-widest text-amber-900/60 uppercase">
                {thesisUrl ? 'Replace Thesis' : 'Upload Thesis'}
            </h3>

            {uploadErrors.length > 0 && (
                <div className="mb-4">
                    <AlertError errors={uploadErrors} title="Thesis upload failed." />
                </div>
            )}

            <div
                className={`cursor-pointer rounded-2xl border-2 border-dashed p-10 text-center transition-colors ${
                    dragging
                        ? 'border-yellow-400 bg-yellow-50'
                        : selectedFile
                          ? 'border-emerald-300 bg-emerald-50'
                          : 'border-amber-200 hover:border-yellow-400 hover:bg-yellow-50/50'
                }`}
                onClick={() => fileInputRef.current?.click()}
                onDragOver={onDragOver}
                onDragLeave={onDragLeave}
                onDrop={onDrop}
            >
                <input
                    ref={fileInputRef}
                    type="file"
                    accept="application/pdf"
                    className="hidden"
                    onChange={onFileChange}
                />

                {selectedFile ? (
                    <div className="flex flex-col items-center gap-2">
                        <div className="rounded-2xl bg-emerald-100 p-3">
                            <FileText className="h-7 w-7 text-emerald-600" />
                        </div>
                        <p className="font-bold text-emerald-700">{selectedFile.name}</p>
                        <p className="text-xs text-amber-900/40">
                            {(selectedFile.size / 1024 / 1024).toFixed(2)} MB — click to change
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
                    <Button onClick={onUpload} disabled={processing} size="md">
                        {processing ? 'Uploading...' : 'Upload Thesis'}
                    </Button>
                    <Button variant="ghost" size="md" onClick={onCancel} disabled={processing}>
                        Cancel
                    </Button>
                </div>
            )}
        </Card>
    );
}
