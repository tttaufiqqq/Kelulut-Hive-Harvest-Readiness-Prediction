<?php

namespace App\Http\Controllers;

use App\Models\Hive;
use App\Models\Prediction;
use Inertia\Inertia;

class PredictionController extends Controller
{
    public function show(Hive $hive)
    {
        abort_if($hive->beekeeper_id !== auth()->id(), 403);

        $predictions = Prediction::query()
            ->with([
                'sensorLog' => fn ($query) => $query->select([
                    'id',
                    'hive_id',
                    'device_id',
                    'temp',
                    'humidity',
                    'mq2_value',
                    'mq3_value',
                    'mq5_value',
                    'mq135_value',
                    'record_timestamp',
                ]),
                'sensorLog.iotNode:id,device_id',
                'sensorLog.matchedThresholds:id,sensor_type,min_value,max_value,level,meaning,recommended_action',
            ])
            ->whereHas('sensorLog', fn ($query) => $query->where('hive_id', $hive->id))
            ->orderByDesc('predictions.prediction_timestamp')
            ->limit(20)
            ->get()
            ->map(function (Prediction $prediction) {
                $sensorLog = $prediction->sensorLog;

                return [
                    'id' => $prediction->id,
                    'sensor_log_id' => $sensorLog?->id,
                    'device_identifier' => $sensorLog?->iotNode?->device_id,
                    'readiness_level' => $prediction->readiness_level,
                    'hri_value' => (float) $prediction->hri_value,
                    'confidence_score' => (float) $prediction->confidence_score,
                    'prediction_timestamp' => $prediction->prediction_timestamp?->toIso8601String(),
                    'prediction_timestamp_label' => $prediction->prediction_timestamp?->format('d M Y, H:i'),
                    'record_timestamp' => $sensorLog?->record_timestamp?->toIso8601String(),
                    'record_timestamp_label' => $sensorLog?->record_timestamp?->format('d M Y, H:i'),
                    'sensor_values' => [
                        'temp' => round((float) ($sensorLog?->temp ?? 0), 1),
                        'humidity' => round((float) ($sensorLog?->humidity ?? 0), 1),
                        'mq2_value' => (int) ($sensorLog?->mq2_value ?? 0),
                        'mq3_value' => (int) ($sensorLog?->mq3_value ?? 0),
                        'mq5_value' => (int) ($sensorLog?->mq5_value ?? 0),
                        'mq135_value' => (int) ($sensorLog?->mq135_value ?? 0),
                    ],
                    'threshold_match_summaries' => $sensorLog?->matchedThresholds
                        ->map(function ($threshold) use ($sensorLog) {
                            $reading = match ($threshold->sensor_type) {
                                'temp' => $sensorLog?->temp,
                                'humidity' => $sensorLog?->humidity,
                                'mq2' => $sensorLog?->mq2_value,
                                'mq3' => $sensorLog?->mq3_value,
                                'mq5' => $sensorLog?->mq5_value,
                                'mq135' => $sensorLog?->mq135_value,
                                default => null,
                            };

                            return [
                                'id' => $threshold->id,
                                'sensor_type' => $threshold->sensor_type,
                                'level' => $threshold->level,
                                'meaning' => $threshold->meaning,
                                'recommended_action' => $threshold->recommended_action,
                                'min_value' => (float) $threshold->min_value,
                                'max_value' => (float) $threshold->max_value,
                                'reading' => $reading !== null ? (float) $reading : null,
                            ];
                        })
                        ->values()
                        ->all() ?? [],
                ];
            });

        return Inertia::render('predictions', [
            'hive' => ['id' => $hive->id, 'name' => $hive->name],
            'predictions' => $predictions,
        ]);
    }
}
