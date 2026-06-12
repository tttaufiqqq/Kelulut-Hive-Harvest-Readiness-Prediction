import { Link } from '@inertiajs/react';
import type { ReactNode } from 'react';
import { Card } from '@/components/core/display/card';
import { cn } from '@/lib/utils';

export interface CrudIndexShellProps {
    children: ReactNode;
    className?: string;
}

export function CrudIndexShell({ children, className }: CrudIndexShellProps) {
    return (
        <div
            className={cn(
                'mx-auto max-w-7xl space-y-6 p-6 md:p-10 lg:px-10 lg:py-8',
                className,
            )}
        >
            {children}
        </div>
    );
}

export interface CrudIndexHeaderProps {
    title: ReactNode;
    description?: ReactNode;
    actions?: ReactNode;
    className?: string;
}

export function CrudIndexHeader({
    title,
    description,
    actions,
    className,
}: CrudIndexHeaderProps) {
    return (
        <div
            className={cn(
                'flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between',
                className,
            )}
        >
            <div>
                <h3 className="text-lg font-bold text-amber-900">{title}</h3>
                {description && (
                    <p className="text-sm text-amber-900/50">{description}</p>
                )}
            </div>
            {actions && (
                <div className="flex items-center gap-3">{actions}</div>
            )}
        </div>
    );
}

export interface CrudTableCardProps {
    children: ReactNode;
    className?: string;
    scrollClassName?: string;
}

export function CrudTableCard({
    children,
    className,
    scrollClassName,
}: CrudTableCardProps) {
    return (
        <Card className={cn('overflow-hidden p-0', className)}>
            <div className={cn('overflow-x-auto', scrollClassName)}>
                {children}
            </div>
        </Card>
    );
}

export interface CrudTableEmptyRowProps {
    colSpan: number;
    message: ReactNode;
    className?: string;
}

export function CrudTableEmptyRow({
    colSpan,
    message,
    className,
}: CrudTableEmptyRowProps) {
    return (
        <tr>
            <td
                colSpan={colSpan}
                className={cn(
                    'px-6 py-10 text-center text-sm text-amber-900/40',
                    className,
                )}
            >
                {message}
            </td>
        </tr>
    );
}

export interface CrudPaginationLink {
    url: string | null;
    label: string;
    active: boolean;
}

export interface CrudPaginationProps {
    links: CrudPaginationLink[];
    className?: string;
    preserveState?: boolean;
    preserveScroll?: boolean;
}

export function CrudPagination({
    links,
    className,
    preserveState = true,
    preserveScroll = true,
}: CrudPaginationProps) {
    if (links.length === 0) {
        return null;
    }

    return (
        <div
            className={cn('flex items-center justify-center gap-1', className)}
        >
            {links.map((link, index) =>
                link.url ? (
                    <Link
                        key={`${link.label}-${index}`}
                        href={link.url}
                        preserveState={preserveState}
                        preserveScroll={preserveScroll}
                        className={cn(
                            'rounded-lg px-3 py-1.5 text-sm transition-colors',
                            link.active
                                ? 'bg-amber-500 font-semibold text-white'
                                : 'text-amber-900/70 hover:bg-yellow-100',
                        )}
                        dangerouslySetInnerHTML={{ __html: link.label }}
                    />
                ) : (
                    <span
                        key={`${link.label}-${index}`}
                        className="px-3 py-1.5 text-sm text-amber-900/30"
                        dangerouslySetInnerHTML={{ __html: link.label }}
                    />
                ),
            )}
        </div>
    );
}
