const PREDICTION_CONTENT: Record<string, { accent: string; description: string }> = {
    not_ready: {
        accent: 'border-l-rose-500',
        description: 'The hive still needs more maturation time before harvest conditions are reliable.',
    },
    approaching: {
        accent: 'border-l-amber-400',
        description: 'The readiness trend is improving. Keep monitoring for a stronger harvest window.',
    },
    nearly_ready: {
        accent: 'border-l-amber-500',
        description: 'This hive is close to harvest range. Review the latest trend before making a visit.',
    },
    ready: {
        accent: 'border-l-emerald-500',
        description: 'Signals are aligned for harvest. Open live predictions to confirm the latest reading.',
    },
};

export function getPredictionContent(level: string | null): { accent: string; description: string } {
    if (!level) {
        return {
            accent: 'border-l-stone-300',
            description: 'Predictions will appear once enough sensor data has been collected and processed by the model.',
        };
    }

    return PREDICTION_CONTENT[level] ?? {
        accent: 'border-l-amber-300',
        description: 'Monitor this hive in live predictions for the latest model output and sensor context.',
    };
}
