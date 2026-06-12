import { Alert } from '@/components/core/feedback';
import type { PredictionEntry } from './types';
import { formatRawConfidence, getTrustAlertStyle, getTrustLabel, getTrustStyle } from './utils';

interface PredictionTrustNoticeProps {
    prediction: PredictionEntry;
}

export function PredictionTrustNotice({ prediction }: PredictionTrustNoticeProps) {
    if (prediction.warning_state === 'normal' && !prediction.prediction_warning && !prediction.out_of_distribution) {
        return null;
    }

    const alertStyle = getTrustAlertStyle(prediction.warning_state);

    return (
        <Alert
            variant="warning"
            className={alertStyle.container}
            title={
                <div className="flex flex-wrap items-center gap-2">
                    <span className={`rounded-full px-3 py-1 text-xs font-bold ${getTrustStyle(prediction.warning_state)}`}>
                        {getTrustLabel(prediction)}
                    </span>
                    <span className="text-xs font-semibold opacity-75">
                        Raw model confidence {formatRawConfidence(prediction.confidence_score)}
                    </span>
                </div>
            }
        >
            <div className="text-sm opacity-85">
                <p>
                    {prediction.prediction_warning ??
                        'This result was flagged by the safety layer, so interpret the raw model score carefully.'}
                </p>
                {prediction.guardrail_action && (
                    <p className="font-medium">Recommended action: {prediction.guardrail_action}</p>
                )}
            </div>
        </Alert>
    );
}
