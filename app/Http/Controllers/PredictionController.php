<?php

namespace App\Http\Controllers;

use App\Models\Hive;
use App\Models\Prediction;
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
                'sensorLog.iotNode:id,device_id',
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

        return Inertia::render('predictions', [
            'hive' => ['id' => $hive->id, 'name' => $hive->name],
            'latestPrediction' => $latestPrediction
                ? $this->transformPrediction($latestPrediction)
                : null,
            'predictionTrends' => $predictionTrends,
            'historyPredictions' => $historyPredictions,
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

        return [
            'id' => $prediction->id,
            'sensor_log_id' => $sensorLog?->id,
            'device_identifier' => $sensorLog?->iotNode?->device_id,
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
    }

    private function transformPredictionTrend(Prediction $prediction, $chartDate): array
    {
        $sensorLog = $prediction->sensorLog;
        $predictionTimestamp = $prediction->prediction_timestamp;
        $isSameDay = $predictionTimestamp?->isSameDay(Carbon::parse($chartDate));

        return [
            'id' => $prediction->id,
            'label' => $predictionTimestamp
                ? $predictionTimestamp->format($isSameDay ? 'H:i' : 'd M, H:i')
                : 'N/A',
            'hri_pct' => round((float) $prediction->hri_value * 100, 1),
            'confidence_pct' => round((float) $prediction->confidence_score * 100, 1),
            'temp' => round((float) ($sensorLog?->temp ?? 0), 1),
            'humidity' => round((float) ($sensorLog?->humidity ?? 0), 1),
            'warning_state' => $prediction->warning_state ?? 'normal',
        ];
    }
}
