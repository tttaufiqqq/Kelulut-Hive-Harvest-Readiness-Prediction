<?php

namespace App\Services;

use App\Models\Prediction;
use App\Support\SensorReadings;

class FormatPredictionService
{
    public function execute(Prediction $prediction): array
    {
        $sensorLog = $prediction->sensorLog;
        $sensorValues = SensorReadings::fromLog($sensorLog);
        $thresholdReadings = [
            'temp'     => $sensorValues['temp'] ?? null,
            'humidity' => $sensorValues['humidity'] ?? null,
            'mq2'      => $sensorValues['mq2_value'] ?? null,
            'mq3'      => $sensorValues['mq3_value'] ?? null,
            'mq5'      => $sensorValues['mq5_value'] ?? null,
            'mq135'    => $sensorValues['mq135_value'] ?? null,
        ];

        return [
            'id'                          => $prediction->id,
            'sensor_log_id'               => $sensorLog?->id,
            'device_identifier'           => $sensorLog?->iotNode?->node_identifier,
            'readiness_level'             => $prediction->readiness_level,
            'raw_readiness_level'         => $prediction->raw_readiness_level,
            'hri_value'                   => (float) $prediction->hri_value,
            'raw_hri_value'               => $prediction->raw_hri_value !== null ? (float) $prediction->raw_hri_value : null,
            'confidence_score'            => (float) $prediction->confidence_score,
            'model_version'               => $prediction->model_version,
            'warning_state'               => $prediction->warning_state ?? 'normal',
            'prediction_warning'          => $prediction->prediction_warning,
            'guardrail_action'            => $prediction->guardrail_action,
            'threshold_warning_level'     => $prediction->threshold_warning_level,
            'out_of_distribution'         => (bool) ($prediction->out_of_distribution ?? false),
            'out_of_distribution_features' => $prediction->out_of_distribution_features ?? [],
            'prediction_timestamp'        => $prediction->prediction_timestamp?->toIso8601String(),
            'prediction_timestamp_label'  => $prediction->prediction_timestamp?->format('d/m/Y H:i'),
            'record_timestamp'            => $sensorLog?->record_timestamp?->toIso8601String(),
            'record_timestamp_label'      => $sensorLog?->record_timestamp?->format('d/m/Y H:i'),
            'sensor_values'               => [
                'temp'        => ($sensorValues['temp'] ?? null) !== null ? round((float) $sensorValues['temp'], 1) : null,
                'humidity'    => ($sensorValues['humidity'] ?? null) !== null ? round((float) $sensorValues['humidity'], 1) : null,
                'mq2_value'   => ($sensorValues['mq2_value'] ?? null) !== null ? (int) $sensorValues['mq2_value'] : null,
                'mq3_value'   => ($sensorValues['mq3_value'] ?? null) !== null ? (int) $sensorValues['mq3_value'] : null,
                'mq5_value'   => ($sensorValues['mq5_value'] ?? null) !== null ? (int) $sensorValues['mq5_value'] : null,
                'mq135_value' => ($sensorValues['mq135_value'] ?? null) !== null ? (int) $sensorValues['mq135_value'] : null,
            ],
            'threshold_match_summaries' => $sensorLog?->matchedThresholds
                ->map(function ($threshold) use ($thresholdReadings) {
                    $reading = match ($threshold->sensor_type) {
                        'temp'     => $thresholdReadings['temp'],
                        'humidity' => $thresholdReadings['humidity'],
                        'mq2'      => $thresholdReadings['mq2'],
                        'mq3'      => $thresholdReadings['mq3'],
                        'mq5'      => $thresholdReadings['mq5'],
                        'mq135'    => $thresholdReadings['mq135'],
                        default    => null,
                    };

                    return [
                        'id'                 => $threshold->id,
                        'sensor_type'        => $threshold->sensor_type,
                        'level'              => $threshold->level,
                        'meaning'            => $threshold->meaning,
                        'recommended_action' => $threshold->recommended_action,
                        'min_value'          => (float) $threshold->min_value,
                        'max_value'          => (float) $threshold->max_value,
                        'reading'            => $reading !== null ? (float) $reading : null,
                    ];
                })
                ->values()
                ->all() ?? [],
        ];
    }
}
