import { CheckCircle, ExternalLink, FileText, Trash2 } from 'lucide-react';
import { Button } from '@/components/core/display/button';
import { Card } from '@/components/core/display/card';
import { fmtDateTime } from '@/lib/format';

interface Props {
    thesisUrl: string | null;
    uploadedAt: string | null;
    onRemoveClick: () => void;
}

export function ThesisStatusCard({ thesisUrl, uploadedAt, onRemoveClick }: Props) {
    if (!thesisUrl) {
        return (
            <Card>
                <div className="flex items-center gap-3 text-amber-900/40">
                    <FileText className="h-5 w-5" />
                    <p className="text-sm font-semibold">No thesis uploaded yet.</p>
                </div>
            </Card>
        );
    }

    return (
        <Card>
            <div className="flex items-start gap-4">
                <div className="shrink-0 rounded-2xl bg-emerald-100 p-3">
                    <CheckCircle className="h-6 w-6 text-emerald-600" />
                </div>
                <div className="min-w-0 flex-1">
                    <p className="font-black text-amber-950">Thesis is live</p>
                    <p className="mt-0.5 text-xs text-amber-900/50">Uploaded {fmtDateTime(uploadedAt)}</p>
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
                        <Button variant="destructive" size="sm" onClick={onRemoveClick}>
                            <Trash2 className="mr-1.5 h-3.5 w-3.5" />
                            Remove
                        </Button>
                    </div>
                </div>
            </div>
        </Card>
    );
}
