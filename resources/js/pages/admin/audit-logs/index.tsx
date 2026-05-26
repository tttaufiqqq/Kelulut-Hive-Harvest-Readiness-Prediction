import { Head, router } from '@inertiajs/react';
import { useState } from 'react';
import { DatePickerField } from '@/components/core/date-picker';
import { Modal } from '@/components/core/modal';
import { SelectField } from '@/components/core/select-field';
import { StatusBadge } from '@/components/core/status-badge';
import {
    CrudIndexHeader,
    CrudIndexShell,
    CrudPagination,
    CrudTableCard,
    CrudTableEmptyRow,
} from '@/components/core/crud-index-shell';
import { AdminLayout } from '@/layouts/admin-layout';

type AuditLog = {
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

type PaginatedLogs = {
    data: AuditLog[];
    links: { url: string | null; label: string; active: boolean }[];
    current_page: number;
    last_page: number;
    total: number;
};

type Props = {
    logs: PaginatedLogs;
    filters: { event?: string; model?: string; date?: string };
};

const EVENT_TONES = {
    created: 'active',
    updated: 'pending',
    deleted: 'inactive',
} as const;

const MODEL_OPTIONS = [
    { value: '', label: 'All Models' },
    { value: 'Hive', label: 'Hive' },
    { value: 'IotNode', label: 'Device' },
    { value: 'Harvest', label: 'Harvest' },
    { value: 'Inspection', label: 'Inspection' },
];

const EVENT_OPTIONS = [
    { value: '', label: 'All Events' },
    { value: 'created', label: 'Created' },
    { value: 'updated', label: 'Updated' },
    { value: 'deleted', label: 'Deleted' },
];

function changedPreview(log: AuditLog): string {
    const values = log.new_values ?? log.old_values ?? {};
    const keys = Object.keys(values).slice(0, 2);
    if (keys.length === 0) return '—';
    const extra = Object.keys(values).length - keys.length;
    return keys.join(', ') + (extra > 0 ? ` +${extra}` : '');
}

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

export default function AuditLogsIndex({ logs, filters }: Props) {
    const [activeLog, setActiveLog] = useState<AuditLog | null>(null);

    const applyFilter = (key: string, value: string | null) => {
        router.get(
            route('admin.audit-logs.index'),
            { ...filters, [key]: value ?? undefined },
            { preserveState: true, preserveScroll: true, only: ['logs'] },
        );
    };

    return (
        <AdminLayout>
            <Head title="Audit Log — Admin" />

            <CrudIndexShell>
                <CrudIndexHeader
                    title="Audit Log"
                    description={`${logs.total} event${logs.total !== 1 ? 's' : ''} recorded`}
                    actions={
                        <div className="flex flex-wrap items-center gap-2">
                            <div className="w-36">
                                <DatePickerField
                                    value={filters.date ?? null}
                                    onChange={(v) => applyFilter('date', v)}
                                    maxDate="today"
                                    clearable
                                    placeholder="Filter by date"
                                />
                            </div>
                            <div className="w-36">
                                <SelectField
                                    value={filters.model ?? ''}
                                    onChange={(v) => applyFilter('model', v || null)}
                                    options={MODEL_OPTIONS}
                                />
                            </div>
                            <div className="w-36">
                                <SelectField
                                    value={filters.event ?? ''}
                                    onChange={(v) => applyFilter('event', v || null)}
                                    options={EVENT_OPTIONS}
                                />
                            </div>
                        </div>
                    }
                />

                <CrudTableCard>
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-yellow-100 bg-yellow-50/50">
                                <th className="px-6 py-3 text-left text-xs font-bold tracking-widest text-amber-900/50 uppercase">
                                    Time
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-bold tracking-widest text-amber-900/50 uppercase">
                                    Model
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-bold tracking-widest text-amber-900/50 uppercase">
                                    Event
                                </th>
                                <th className="hidden px-6 py-3 text-left text-xs font-bold tracking-widest text-amber-900/50 uppercase md:table-cell">
                                    By
                                </th>
                                <th className="hidden px-6 py-3 text-left text-xs font-bold tracking-widest text-amber-900/50 uppercase lg:table-cell">
                                    Changed
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-yellow-50">
                            {logs.data.length === 0 && (
                                <CrudTableEmptyRow
                                    colSpan={5}
                                    message="No audit events yet."
                                />
                            )}
                            {logs.data.map((log) => (
                                <tr
                                    key={log.id}
                                    className="cursor-pointer transition-colors hover:bg-yellow-50/30"
                                    onClick={() => setActiveLog(log)}
                                >
                                    <td className="px-6 py-4 tabular-nums text-amber-900/60">
                                        {new Date(log.created_at).toLocaleString()}
                                    </td>
                                    <td className="px-6 py-4 font-medium text-amber-950">
                                        {log.auditable_type === 'IotNode'
                                            ? 'Device'
                                            : log.auditable_type}{' '}
                                        <span className="font-mono text-xs text-amber-900/30">
                                            #{log.auditable_id}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <StatusBadge
                                            status={log.event}
                                            tone={EVENT_TONES[log.event]}
                                            label={
                                                log.event.charAt(0).toUpperCase() +
                                                log.event.slice(1)
                                            }
                                        />
                                    </td>
                                    <td className="hidden px-6 py-4 text-amber-900/60 md:table-cell">
                                        {log.auditable_type === 'Harvest' ||
                                        log.auditable_type === 'Inspection'
                                            ? (log.user?.name ?? '—')
                                            : '—'}
                                    </td>
                                    <td className="hidden px-6 py-4 font-mono text-xs text-amber-900/50 lg:table-cell">
                                        {changedPreview(log)}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </CrudTableCard>

                {logs.last_page > 1 && (
                    <CrudPagination links={logs.links} />
                )}
            </CrudIndexShell>

            {activeLog && (
                <Modal
                    isOpen
                    onClose={() => setActiveLog(null)}
                    title="Change Details"
                    maxWidth="2xl"
                >
                    <div className="space-y-4">
                        <div className="flex flex-wrap items-center gap-3 text-sm">
                            <StatusBadge
                                status={activeLog.event}
                                tone={EVENT_TONES[activeLog.event]}
                                label={
                                    activeLog.event.charAt(0).toUpperCase() +
                                    activeLog.event.slice(1)
                                }
                            />
                            <span className="font-medium text-amber-950">
                                {activeLog.auditable_type === 'IotNode'
                                    ? 'Device'
                                    : activeLog.auditable_type}{' '}
                                <span className="font-mono text-xs text-amber-900/40">
                                    #{activeLog.auditable_id}
                                </span>
                            </span>
                            <span className="text-amber-900/40">
                                {new Date(activeLog.created_at).toLocaleString()}
                            </span>
                            {(activeLog.auditable_type === 'Harvest' ||
                                activeLog.auditable_type === 'Inspection') &&
                                activeLog.user && (
                                    <span className="text-amber-900/60">
                                        by {activeLog.user.name}
                                    </span>
                                )}
                        </div>

                        <DiffTable log={activeLog} />
                    </div>
                </Modal>
            )}
        </AdminLayout>
    );
}
