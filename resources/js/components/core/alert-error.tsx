import { Alert } from '@/components/core/feedback';

export function AlertError({
    errors,
    title,
}: {
    errors: string[];
    title?: string;
}) {
    const uniqueErrors = Array.from(new Set(errors));

    return (
        <Alert variant="error" title={title || 'Something went wrong.'}>
            <ul className="list-inside list-disc space-y-1 text-sm">
                {uniqueErrors.map((error, index) => (
                    <li key={index}>{error}</li>
                ))}
            </ul>
        </Alert>
    );
}
