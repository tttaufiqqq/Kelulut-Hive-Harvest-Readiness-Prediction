import { Alert } from '@/components/core/feedback';
import type { PredictionEntry } from './types';
import { getTrustAlertStyle } from './utils';

interface PredictionWarningAlertProps {
    prediction: PredictionEntry;
}

export function PredictionWarningAlert({ prediction }: PredictionWarningAlertProps) {
    if (!prediction.prediction_warning && !prediction.out_of_distribution) {
        return null;
    }

    const alertStyle = getTrustAlertStyle(prediction.warning_state);

    return (
        <Alert variant="warning" className={alertStyle.container} title="Prediction Warning">
            <div className="text-sm opacity-85">
                <p>
                    {prediction.prediction_warning ??
                        'This prediction was flagged by the safety layer, so review the reading carefully before acting on it.'}
                </p>
                {prediction.guardrail_action && (
                    <p className="font-medium">Recommended action: {prediction.guardrail_action}</p>
                )}
            </div>
        </Alert>
    );
}
