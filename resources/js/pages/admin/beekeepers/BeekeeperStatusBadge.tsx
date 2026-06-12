interface Props {
    status: string;
}

export function BeekeeperStatusBadge({ status }: Props) {
    if (status === 'pending') {
        return <span className="inline-flex items-center rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-bold text-amber-700">Pending</span>;
    }
    if (status === 'active') {
        return <span className="inline-flex items-center rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-bold text-emerald-700">Active</span>;
    }
    return <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-bold text-gray-500">Deactivated</span>;
}
