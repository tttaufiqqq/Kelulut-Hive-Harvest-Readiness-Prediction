import { StatusBadge } from '@/components/core/display/status-badge';
import { fmtSmartTime } from '@/lib/format';

export type AuditLog = {
    id: number;
    user_id: number | null;
    event: 'created' | 'updated' | 'deleted';
    auditable_type: string;
    auditable_id: number;
    old_values: Record<string, unknown> | null;
    new_values: Record<string, unknown> | null;
    created_at: string;
    user: { id: number; name: string } | null;
};

const EVENT_TONES = {
    created: 'active',
    updated: 'pending',
    deleted: 'inactive',
} as const;

function changedPreview(log: AuditLog): string {
    if (log.event === 'created') {
        const count = Object.keys(log.new_values ?? {}).filter((k) => k !== 'id').length;
        return count > 0 ? `${count} fields` : '—';
    }

    if (log.event === 'deleted') {
        const count = Object.keys(log.old_values ?? {}).filter((k) => k !== 'id').length;
        return count > 0 ? `${count} fields` : '—';
    }

    const keys = Object.keys(log.new_values ?? {}).filter((k) => k !== 'id');
    if (keys.length === 0) return '—';
    const shown = keys.slice(0, 3);
    const extra = keys.length - shown.length;
    return shown.join(', ') + (extra > 0 ? ` +${extra}` : '');
}

interface Props {
    log: AuditLog;
    onView: (log: AuditLog) => void;
}

export function AuditLogTableRow({ log, onView }: Props) {
    return (
        <tr
            className="cursor-pointer transition-colors hover:bg-yellow-50/30"
            onClick={() => onView(log)}
        >
            <td className="px-6 py-4 tabular-nums text-amber-900/60">
                {fmtSmartTime(log.created_at)}
            </td>
            <td className="px-6 py-4 font-medium text-amber-950">
                {log.auditable_type === 'IotNode' ? 'Device' : log.auditable_type}{' '}
                <span className="font-mono text-xs text-amber-900/30">#{log.auditable_id}</span>
            </td>
            <td className="px-6 py-4">
                <StatusBadge
                    status={log.event}
                    tone={EVENT_TONES[log.event]}
                    label={log.event.charAt(0).toUpperCase() + log.event.slice(1)}
                />
            </td>
            <td className="hidden px-6 py-4 text-amber-900/60 md:table-cell">
                {log.user?.name ?? '—'}
            </td>
            <td className="hidden px-6 py-4 font-mono text-xs text-amber-900/50 lg:table-cell">
                {changedPreview(log)}
            </td>
        </tr>
    );
}
