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
        temp: number | null;
        humidity: number | null;
        mq2_value: number | null;
        mq3_value: number | null;
        mq5_value: number | null;
        mq135_value: number | null;
    };
    threshold_match_summaries: {
        sensor_type: string;
        level: string;
    }[];
}

export interface PredictionTrendItem {
    id: number;
    label: string;
    hri_pct: number;
    confidence_pct: number;
    temp: number | null;
    humidity: number | null;
    warning_state: string;
}

export interface PaginatedPredictions {
    data: PredictionEntry[];
    links: { url: string | null; label: string; active: boolean }[];
    current_page: number;
    last_page: number;
    total: number;
}
