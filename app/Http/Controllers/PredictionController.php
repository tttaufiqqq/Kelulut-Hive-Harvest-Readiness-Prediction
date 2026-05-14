<?php

namespace App\Http\Controllers;

use App\Models\Hive;
use App\Models\Prediction;
use App\Models\SensorLog;
use App\Support\SensorReadings;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Inertia\Inertia;

class PredictionController extends Controller
{
    public function show(Request $request, Hive $hive)
    {
        abort_if($hive->beekeeper_id !== auth()->id(), 403);

        $baseQuery = Prediction::query()
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
                'sensorLog.iotNode:id,node_identifier',
                'sensorLog.matchedThresholds:id,sensor_type,min_value,max_value,level,meaning,recommended_action',
            ])
            ->whereHas('sensorLog', fn ($query) => $query->where('hive_id', $hive->id));

        $latestPrediction = (clone $baseQuery)
            ->orderByDesc('predictions.prediction_timestamp')
            ->first();
        $defaultChartDate = Carbon::today();
        $chartDate = $request->date('chart_date') ?? $defaultChartDate;

        $historyQuery = (clone $baseQuery)
            ->orderByDesc('predictions.prediction_timestamp');

        if ($latestPrediction) {
            $historyQuery->whereKeyNot($latestPrediction->id);
        }

        $historyPredictions = $historyQuery
            ->paginate(5)
            ->withQueryString()
            ->through(fn (Prediction $prediction) => $this->transformPrediction($prediction));

        $predictionTrends = (clone $baseQuery)
            ->whereDate('predictions.prediction_timestamp', $chartDate)
            ->orderByDesc('predictions.prediction_timestamp')
            ->limit(24)
            ->get()
            ->reverse()
            ->values()
            ->map(fn (Prediction $prediction) => $this->transformPredictionTrend($prediction, $chartDate));

        $latestSensorLog = SensorLog::where('hive_id', $hive->id)
            ->latest('record_timestamp')
            ->first(['temp', 'humidity', 'mq2_value', 'mq3_value', 'mq5_value', 'mq135_value']);

        $sensorWarnings = $latestSensorLog
            ? SensorReadings::missingLabels(SensorReadings::fromLog($latestSensorLog))
            : [];

        return Inertia::render('predictions', [
            'hive' => ['id' => $hive->id, 'name' => $hive->name],
            'latestPrediction' => $latestPrediction
                ? $this->transformPrediction($latestPrediction)
                : null,
            'predictionTrends' => $predictionTrends,
            'historyPredictions' => $historyPredictions,
            'sensorWarnings' => $sensorWarnings,
            'filters' => [
                'page' => (int) $request->integer('page', 1),
                'chart_date' => Carbon::parse($chartDate)->toDateString(),
                'default_chart_date' => Carbon::parse($defaultChartDate)->toDateString(),
            ],
        ]);
    }

    private function transformPrediction(Prediction $prediction): array
    {
        $sensorLog = $prediction->sensorLog;
        $sensorValues = SensorReadings::fromLog($sensorLog);
        $thresholdReadings = [
            'temp' => $sensorValues['temp'] ?? null,
            'humidity' => $sensorValues['humidity'] ?? null,
            'mq2' => $sensorValues['mq2_value'] ?? null,
            'mq3' => $sensorValues['mq3_value'] ?? null,
            'mq5' => $sensorValues['mq5_value'] ?? null,
            'mq135' => $sensorValues['mq135_value'] ?? null,
        ];

        return [
            'id' => $prediction->id,
            'sensor_log_id' => $sensorLog?->id,
            'device_identifier' => $sensorLog?->iotNode?->node_identifier,
            'readiness_level' => $prediction->readiness_level,
            'raw_readiness_level' => $prediction->raw_readiness_level,
            'hri_value' => (float) $prediction->hri_value,
            'raw_hri_value' => $prediction->raw_hri_value !== null ? (float) $prediction->raw_hri_value : null,
            'confidence_score' => (float) $prediction->confidence_score,
            'model_version' => $prediction->model_version,
            'warning_state' => $prediction->warning_state ?? 'normal',
            'prediction_warning' => $prediction->prediction_warning,
            'guardrail_action' => $prediction->guardrail_action,
            'threshold_warning_level' => $prediction->threshold_warning_level,
            'out_of_distribution' => (bool) ($prediction->out_of_distribution ?? false),
            'out_of_distribution_features' => $prediction->out_of_distribution_features ?? [],
            'prediction_timestamp' => $prediction->prediction_timestamp?->toIso8601String(),
            'prediction_timestamp_label' => $prediction->prediction_timestamp?->format('d/m/Y H:i'),
            'record_timestamp' => $sensorLog?->record_timestamp?->toIso8601String(),
            'record_timestamp_label' => $sensorLog?->record_timestamp?->format('d/m/Y H:i'),
            'sensor_values' => [
                'temp' => ($sensorValues['temp'] ?? null) !== null ? round((float) $sensorValues['temp'], 1) : null,
                'humidity' => ($sensorValues['humidity'] ?? null) !== null ? round((float) $sensorValues['humidity'], 1) : null,
                'mq2_value' => ($sensorValues['mq2_value'] ?? null) !== null ? (int) $sensorValues['mq2_value'] : null,
                'mq3_value' => ($sensorValues['mq3_value'] ?? null) !== null ? (int) $sensorValues['mq3_value'] : null,
                'mq5_value' => ($sensorValues['mq5_value'] ?? null) !== null ? (int) $sensorValues['mq5_value'] : null,
                'mq135_value' => ($sensorValues['mq135_value'] ?? null) !== null ? (int) $sensorValues['mq135_value'] : null,
            ],
            'threshold_match_summaries' => $sensorLog?->matchedThresholds
                ->map(function ($threshold) use ($thresholdReadings) {
                    $reading = match ($threshold->sensor_type) {
                        'temp' => $thresholdReadings['temp'],
                        'humidity' => $thresholdReadings['humidity'],
                        'mq2' => $thresholdReadings['mq2'],
                        'mq3' => $thresholdReadings['mq3'],
                        'mq5' => $thresholdReadings['mq5'],
                        'mq135' => $thresholdReadings['mq135'],
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
    }

    private function transformPredictionTrend(Prediction $prediction, $chartDate): array
    {
        $sensorLog = $prediction->sensorLog;
        $predictionTimestamp = $prediction->prediction_timestamp;
        $isSameDay = $predictionTimestamp?->isSameDay(Carbon::parse($chartDate));
        $sensorValues = SensorReadings::fromLog($sensorLog);

        return [
            'id' => $prediction->id,
            'label' => $predictionTimestamp
                ? $predictionTimestamp->format($isSameDay ? 'H:i' : 'd M, H:i')
                : 'N/A',
            'hri_pct' => round((float) $prediction->hri_value * 100, 1),
            'confidence_pct' => round((float) $prediction->confidence_score * 100, 1),
            'temp' => ($sensorValues['temp'] ?? null) !== null ? round((float) $sensorValues['temp'], 1) : null,
            'humidity' => ($sensorValues['humidity'] ?? null) !== null ? round((float) $sensorValues['humidity'], 1) : null,
            'warning_state' => $prediction->warning_state ?? 'normal',
        ];
    }
}
