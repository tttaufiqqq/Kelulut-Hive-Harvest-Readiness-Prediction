export interface PredictionEntry {
    id: number;
    readiness_level: string;
    hri_value: number;
    confidence_score: number;
    raw_readiness_level: string | null;
    model_version: string | null;
    warning_state: string;
    prediction_warning: string | null;
    guardrail_action: string | null;
    out_of_distribution: boolean;
    prediction_timestamp: string | null;
    prediction_timestamp_label: string | null;
    record_timestamp: string | null;
    record_timestamp_label: string | null;
    device_identifier: string | null;
    sensor_values: {
        temp: number;
        humidity: number;
        mq2_value: number;
        mq3_value: number;
        mq5_value: number;
        mq135_value: number;
    };
}

export interface PredictionTrendPoint {
    id: number;
    label: string;
    hri_pct: number;
    confidence_pct: number;
    temp: number;
    humidity: number;
    warning_state: string;
}

export interface Props {
    hive: { id: number; name: string };
    latestPrediction: PredictionEntry | null;
    predictionTrends: PredictionTrendPoint[];
    historyPredictions: {
        data: PredictionEntry[];
        links: { url: string | null; label: string; active: boolean }[];
        current_page: number;
        last_page: number;
        total: number;
    };
    filters: {
        page: number;
        chart_date: string;
        default_chart_date: string;
    };
}
