import { ScanLine } from 'lucide-react';

export function GridScanIcon() {
    return (
        <div className="mb-3 rounded-full border border-yellow-200 bg-yellow-50 p-0.5 shadow-sm">
            <div className="relative overflow-hidden rounded-full border border-yellow-200 bg-yellow-100 p-2.5">
                <div className="absolute inset-0 grid grid-cols-5 opacity-50">
                    {Array.from({ length: 5 }, (_, i) => (
                        <div key={`col-${i + 1}`} className="border-r border-yellow-200 last:border-r-0" />
                    ))}
                </div>
                <div className="absolute inset-0 grid grid-rows-5 opacity-50">
                    {Array.from({ length: 5 }, (_, i) => (
                        <div key={`row-${i + 1}`} className="border-b border-yellow-200 last:border-b-0" />
                    ))}
                </div>
                <ScanLine className="relative z-20 size-6 text-amber-900" />
            </div>
        </div>
    );
}
