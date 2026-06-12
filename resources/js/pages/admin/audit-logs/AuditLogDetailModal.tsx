import { StatusBadge } from '@/components/core/display/status-badge';
import { Modal } from '@/components/core/overlay/modal';
import { fmtSmartTime } from '@/lib/format';
import type { AuditLog } from './AuditLogTableRow';

const EVENT_TONES = {
    created: 'active',
    updated: 'pending',
    deleted: 'inactive',
} as const;

function DiffTable({ log }: { log: AuditLog }) {
    const allKeys = Array.from(
        new Set([
            ...Object.keys(log.old_values ?? {}),
            ...Object.keys(log.new_values ?? {}),
        ]),
    );

    if (allKeys.length === 0) {
        return <p className="text-sm text-amber-900/40">No field data recorded.</p>;
    }

    return (
        <table className="w-full text-sm">
            <thead>
                <tr className="border-b border-yellow-100">
                    <th className="py-2 pr-4 text-left text-xs font-bold tracking-widest text-amber-900/40 uppercase">
                        Field
                    </th>
                    <th className="py-2 pr-4 text-left text-xs font-bold tracking-widest text-amber-900/40 uppercase">
                        Before
                    </th>
                    <th className="py-2 text-left text-xs font-bold tracking-widest text-amber-900/40 uppercase">
                        After
                    </th>
                </tr>
            </thead>
            <tbody className="divide-y divide-yellow-50">
                {allKeys.map((key) => {
                    const oldVal = log.old_values?.[key];
                    const newVal = log.new_values?.[key];

                    return (
                        <tr key={key}>
                            <td className="py-2 pr-4 font-mono text-xs font-medium text-amber-900/70">
                                {key}
                            </td>
                            <td className="py-2 pr-4 max-w-[180px] truncate rounded bg-rose-50 px-2 text-xs text-rose-700">
                                {oldVal == null ? (
                                    <span className="text-amber-900/25">null</span>
                                ) : (
                                    String(oldVal)
                                )}
                            </td>
                            <td className="py-2 max-w-[180px] truncate rounded bg-emerald-50 px-2 text-xs text-emerald-700">
                                {newVal == null ? (
                                    <span className="text-amber-900/25">null</span>
                                ) : (
                                    String(newVal)
                                )}
                            </td>
                        </tr>
                    );
                })}
            </tbody>
        </table>
    );
}

interface Props {
    log: AuditLog | null;
    onClose: () => void;
}

export function AuditLogDetailModal({ log, onClose }: Props) {
    if (!log) {
return null;
}

    return (
        <Modal isOpen onClose={onClose} title="Change Details" maxWidth="2xl">
            <div className="space-y-4">
                <div className="flex flex-wrap items-center gap-3 text-sm">
                    <StatusBadge
                        status={log.event}
                        tone={EVENT_TONES[log.event]}
                        label={log.event.charAt(0).toUpperCase() + log.event.slice(1)}
                    />
                    <span className="font-medium text-amber-950">
                        {log.auditable_type === 'IotNode' ? 'Device' : log.auditable_type}{' '}
                        <span className="font-mono text-xs text-amber-900/40">
                            #{log.auditable_id}
                        </span>
                    </span>
                    <span className="text-amber-900/40">{fmtSmartTime(log.created_at)}</span>
                    {log.user && (
                        <span className="text-amber-900/60">by {log.user.name}</span>
                    )}
                </div>

                <DiffTable log={log} />
            </div>
        </Modal>
    );
}
