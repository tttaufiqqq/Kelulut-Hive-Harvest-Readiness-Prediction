import { Head, router } from '@inertiajs/react';
import { useState } from 'react';
import {
    CrudIndexHeader,
    CrudIndexShell,
    CrudPagination,
    CrudTableCard,
    CrudTableEmptyRow,
} from '@/components/core/data/crud-index-shell';
import { DatePickerField } from '@/components/core/date-picker';
import { SelectField } from '@/components/core/form/select-field';
import { AdminLayout } from '@/layouts/admin-layout';
import { AuditLogDetailModal } from './AuditLogDetailModal';
import { AuditLogTableRow } from './AuditLogTableRow';
import type { AuditLog } from './AuditLogTableRow';

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

export default function AuditLogsIndex({ logs, filters }: Props) {
    const [activeLog, setActiveLog] = useState<AuditLog | null>(null);
    const activeFilterCount = [filters.event, filters.model, filters.date].filter(Boolean).length;

    const applyFilter = (key: string, value: string | null) => {
        router.get(
            route('admin.audit-logs.index'),
            { ...filters, [key]: value ?? undefined },
            { preserveState: true, preserveScroll: true, only: ['logs', 'filters'] },
        );
    };

    const clearFilters = () => {
        router.get(
            route('admin.audit-logs.index'),
            {},
            { preserveState: true, preserveScroll: true, only: ['logs', 'filters'] },
        );
    };

    return (
        <AdminLayout>
            <Head title="Audit Log — Admin" />

            <CrudIndexShell>
                <CrudIndexHeader
                    title="Audit Log"
                    description={
                        <span className="flex items-center gap-2">
                            <span>
                                {logs.total} event{logs.total !== 1 ? 's' : ''} recorded
                            </span>
                            {activeFilterCount > 0 && (
                                <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-bold text-amber-700">
                                    {activeFilterCount} filter{activeFilterCount > 1 ? 's' : ''}{' '}
                                    active
                                    <button
                                        onClick={clearFilters}
                                        className="font-normal underline underline-offset-2 hover:no-underline"
                                    >
                                        clear
                                    </button>
                                </span>
                            )}
                        </span>
                    }
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
                                <CrudTableEmptyRow colSpan={5} message="No audit events yet." />
                            )}
                            {logs.data.map((log) => (
                                <AuditLogTableRow key={log.id} log={log} onView={setActiveLog} />
                            ))}
                        </tbody>
                    </table>
                </CrudTableCard>

                {logs.last_page > 1 && <CrudPagination links={logs.links} />}
            </CrudIndexShell>

            <AuditLogDetailModal log={activeLog} onClose={() => setActiveLog(null)} />
        </AdminLayout>
    );
}
