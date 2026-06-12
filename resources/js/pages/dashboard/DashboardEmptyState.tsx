import { Bug as Bee } from 'lucide-react';
import { Card } from '@/components/core/card';

export function DashboardEmptyState() {
    return (
        <Card className="flex min-h-[340px] flex-col items-center justify-center border-2 border-dashed border-yellow-200 bg-white/70 text-center shadow-none lg:min-h-full">
            <div className="mb-4 rounded-full bg-yellow-100 p-6">
                <Bee className="h-10 w-10 text-yellow-600" />
            </div>
            <p className="text-lg font-bold text-amber-900">No hives assigned yet.</p>
            <p className="mt-2 max-w-sm text-sm text-amber-900/50">
                Contact your admin to register a hive and start tracking readiness data here.
            </p>
        </Card>
    );
}
