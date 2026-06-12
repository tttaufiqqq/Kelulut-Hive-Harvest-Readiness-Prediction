import { Card } from '@/components/core/display/card';

export function EmptyPredictionState() {
    return (
        <Card className="flex flex-col items-center justify-center gap-3 py-16 text-center">
            <p className="font-bold text-amber-900">No predictions yet</p>
            <p className="max-w-xs text-sm text-amber-700/60">
                Predictions appear once sensor data has been sent by the ESP32
                and processed by the ML model.
            </p>
        </Card>
    );
}
