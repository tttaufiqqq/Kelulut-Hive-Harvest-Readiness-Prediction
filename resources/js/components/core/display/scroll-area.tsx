import { cn } from '@/lib/utils';

interface ScrollAreaProps {
    children: React.ReactNode;
    className?: string;
    direction?: 'vertical' | 'horizontal' | 'both';
}

const SCROLLBAR_CLASSES = [
    '[&::-webkit-scrollbar]:w-1.5',
    '[&::-webkit-scrollbar]:h-1.5',
    '[&::-webkit-scrollbar-track]:bg-amber-50',
    '[&::-webkit-scrollbar-track]:rounded-full',
    '[&::-webkit-scrollbar-thumb]:bg-amber-300',
    '[&::-webkit-scrollbar-thumb]:rounded-full',
    '[&::-webkit-scrollbar-thumb:hover]:bg-amber-400',
].join(' ');

export function ScrollArea({
    children,
    className,
    direction = 'vertical',
}: ScrollAreaProps) {
    const overflow =
        direction === 'horizontal'
            ? 'overflow-x-auto overflow-y-hidden'
            : direction === 'both'
              ? 'overflow-auto'
              : 'overflow-y-auto overflow-x-hidden';

    return (
        <div className={cn(overflow, SCROLLBAR_CLASSES, className)}>
            {children}
        </div>
    );
}
