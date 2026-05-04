export function Heading({
    title,
    description,
    variant = 'default',
}: {
    title: string;
    description?: string;
    variant?: 'default' | 'small';
}) {
    return (
        <header className={variant === 'small' ? '' : 'mb-8 space-y-0.5'}>
            <h2
                className={
                    variant === 'small'
                        ? 'mb-0.5 text-base font-bold text-amber-900'
                        : 'text-xl font-black tracking-tight text-amber-950'
                }
            >
                {title}
            </h2>
            {description && (
                <p className="text-sm text-amber-600/60">{description}</p>
            )}
        </header>
    );
}
