interface Props {
    status: string;
}

export function HiveStatusBadge({ status }: Props) {
    return status === 'active' ? (
        <span className="inline-flex items-center rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-bold text-emerald-700">
            Active
        </span>
    ) : (
        <span className="inline-flex items-center rounded-full bg-rose-100 px-2.5 py-0.5 text-xs font-bold text-rose-600">
            Inactive
        </span>
    );
}
