import { Edit2, MoreVertical, Power, RefreshCw, Trash2 } from 'lucide-react';
import { Dropdown } from '@/components/core/dropdown';
import { fmtDate } from '@/lib/format';
import type { User } from '@/types';
import { BeekeeperStatusBadge } from './BeekeeperStatusBadge';

interface Props {
    user: User;
    index: number;
    onView: (index: number) => void;
    onEdit: (user: User) => void;
    onToggle: (user: User) => void;
    onResend: (user: User) => void;
    onDelete: (user: User) => void;
}

export function BeekeeperTableRow({ user, index, onView, onEdit, onToggle, onResend, onDelete }: Props) {
    const dropdownItems = [
        { id: 'edit', label: 'Edit', icon: <Edit2 className="h-4 w-4" />, onClick: () => onEdit(user) },
        ...(user.status === 'pending' ? [{ id: 'resend', label: 'Resend Invite', icon: <RefreshCw className="h-4 w-4" />, onClick: () => onResend(user) }] : []),
        {
            id: 'toggle',
            label: user.status === 'active' ? 'Deactivate' : 'Reactivate',
            icon: <Power className="h-4 w-4" />,
            variant: (user.status === 'active' ? 'danger' : 'default') as 'danger' | 'default',
            onClick: () => onToggle(user),
        },
        { id: 'delete', label: 'Delete', icon: <Trash2 className="h-4 w-4" />, variant: 'danger' as const, onClick: () => onDelete(user) },
    ];

    return (
        <tr className="cursor-pointer transition-colors hover:bg-yellow-50/30" onClick={() => onView(index)}>
            <td className="px-6 py-4 font-medium text-amber-950">{user.name}</td>
            <td className="px-6 py-4 text-amber-900/70">{user.email}</td>
            <td className="hidden px-6 py-4 text-amber-900/70 md:table-cell">{user.phone ?? '—'}</td>
            <td className="px-6 py-4"><BeekeeperStatusBadge status={user.status ?? 'active'} /></td>
            <td className="hidden px-6 py-4 text-amber-900/50 lg:table-cell">{fmtDate(user.created_at)}</td>
            <td className="px-6 py-4 text-right" onClick={(e) => e.stopPropagation()}>
                <Dropdown align="right"
                    trigger={<button className="rounded-xl p-1.5 transition-colors hover:bg-yellow-100"><MoreVertical className="h-4 w-4 text-amber-900/50" /></button>}
                    items={dropdownItems} />
            </td>
        </tr>
    );
}
