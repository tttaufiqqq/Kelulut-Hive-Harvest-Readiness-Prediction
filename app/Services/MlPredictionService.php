<?php

namespace App\Services;

use App\Enums\AppErrorCode;
use App\Events\PredictionCreated;
use App\Jobs\SendTelegramAlert;
use App\Models\HriSummary;
use App\Models\Prediction;
use App\Models\SensorLog;
use App\Support\AppErrorReporter;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class MlPredictionService
{
    public function predict(SensorLog $log): ?Prediction
    {
        return $this->runPrediction($log)->prediction;
    }

    public function runPrediction(SensorLog $log): PredictionRunResult
    {
        if ($log->temp === null || $log->humidity === null) {
            return PredictionRunResult::skipped($log->id);
        }

        $payload = [
            'mq2_value' => $log->mq2_value,
            'mq3_value' => $log->mq3_value,
            'mq5_value' => $log->mq5_value,
            'mq135_value' => $log->mq135_value,
            'temp' => $log->temp,
            'humidity' => $log->humidity,
        ];

        try {
            $response = Http::timeout(10)->post(config('services.ml.url').'/predict', $payload);

            if (! $response->successful()) {
                Log::warning('ML API unavailable for prediction.', [
                    'sensor_log_id' => $log->id,
                    'status' => $response->status(),
                    'error_code' => AppErrorCode::MlUnavailable->value,
                ]);

                return PredictionRunResult::mlUnavailable(
                    $log->id,
                    AppErrorCode::MlUnavailable->value,
                    'Live readiness prediction is temporarily unavailable.',
                );
            }

            $data = $response->json();

            if (isset($data['error'])) {
                Log::warning('ML API returned an error payload.', [
                    'sensor_log_id' => $log->id,
                    'ml_error' => $data['error'],
                    'error_code' => AppErrorCode::MlUnavailable->value,
                ]);

                return PredictionRunResult::mlUnavailable(
                    $log->id,
                    AppErrorCode::MlUnavailable->value,
                    'Live readiness prediction is temporarily unavailable.',
                );
            }

            $warningState = $data['warning_state'] ?? 'normal';
            $logContext = [
                'sensor_log_id' => $log->id,
                'input' => $payload,
                'model_version' => $data['model_version'] ?? null,
                'warning_state' => $warningState,
                'guardrail_action' => $data['guardrail_action'] ?? 'none',
                'out_of_distribution' => (bool) ($data['out_of_distribution'] ?? false),
                'out_of_distribution_features' => $data['out_of_distribution_features'] ?? [],
                'prediction_warning' => $data['prediction_warning'] ?? null,
                'raw_readiness_level' => $data['raw_readiness_level'] ?? null,
                'readiness_level' => $data['readiness_level'] ?? null,
            ];

            if ($warningState === 'normal') {
                Log::info('ML prediction stored', $logContext);
            } else {
                Log::warning('ML prediction stored with low-trust warning', $logContext);
            }

            try {
                return $this->persistPrediction($log, [
                    'sensor_log_id' => $log->id,
                    'readiness_level' => $data['readiness_level'],
                    'raw_readiness_level' => $data['raw_readiness_level'] ?? $data['readiness_level'],
                    'hri_value' => $data['hri_value'],
                    'raw_hri_value' => $data['raw_hri_value'] ?? $data['hri_value'],
                    'confidence_score' => $data['confidence_score'],
                    'model_version' => $data['model_version'] ?? 'unknown-model',
                    'warning_state' => $warningState,
                    'prediction_warning' => $data['prediction_warning'] ?? null,
                    'guardrail_action' => $data['guardrail_action'] ?? 'none',
                    'threshold_warning_level' => $data['threshold_warning_level'] ?? null,
                    'out_of_distribution' => (bool) ($data['out_of_distribution'] ?? false),
                    'out_of_distribution_features' => $data['out_of_distribution_features'] ?? [],
                    'prediction_timestamp' => now(),
                ]);
            } catch (\Throwable $e) {
                AppErrorReporter::report(
                    $e,
                    AppErrorCode::PredictionPersistFailed,
                    context: [
                        'sensor_log_id' => $log->id,
                        'model_version' => $data['model_version'] ?? null,
                    ],
                );

                return PredictionRunResult::processingFailed(
                    $log->id,
                    AppErrorCode::PredictionPersistFailed->value,
                    'We saved the reading, but the prediction could not be stored.',
                );
            }
        } catch (\Throwable $e) {
            AppErrorReporter::report(
                $e,
                AppErrorCode::MlUnavailable,
                context: ['sensor_log_id' => $log->id],
                level: 'warning',
            );

            return PredictionRunResult::mlUnavailable(
                $log->id,
                AppErrorCode::MlUnavailable->value,
                'Live readiness prediction is temporarily unavailable.',
            );
        }
    }

    public function createSyntheticReadyPrediction(SensorLog $log): PredictionRunResult
    {
        try {
            return $this->persistPrediction($log, [
                'sensor_log_id' => $log->id,
                'readiness_level' => 'ready',
                'raw_readiness_level' => 'ready',
                'hri_value' => 1.0,
                'raw_hri_value' => 1.0,
                'confidence_score' => 1.0,
                'model_version' => 'synthetic_diagnostic_ready_v1',
                'warning_state' => 'normal',
                'prediction_warning' => 'Synthetic diagnostic prediction created by the internal Telegram readiness test endpoint.',
                'guardrail_action' => 'none',
                'threshold_warning_level' => null,
                'out_of_distribution' => false,
                'out_of_distribution_features' => [],
                'prediction_timestamp' => now(),
            ]);
        } catch (\Throwable $e) {
            AppErrorReporter::report(
                $e,
                AppErrorCode::PredictionPersistFailed,
                context: ['sensor_log_id' => $log->id, 'mode' => 'synthetic_ready'],
            );

            return PredictionRunResult::processingFailed(
                $log->id,
                AppErrorCode::PredictionPersistFailed->value,
                'We saved the diagnostic reading, but the synthetic prediction could not be stored.',
            );
        }
    }

    public function queueReadinessAlert(Prediction $prediction): string
    {
        if (! in_array($prediction->readiness_level, ['ready', 'nearly_ready'], true)) {
            return 'not_ready';
        }

        SendTelegramAlert::dispatch($prediction->id)->afterCommit();

        return 'queued';
    }

    private function persistPrediction(SensorLog $log, array $attributes): PredictionRunResult
    {
        return DB::transaction(function () use ($log, $attributes) {
            $prediction = Prediction::create($attributes);
            $this->updateHriSummary($log, $prediction);

            PredictionCreated::dispatch(
                $log->hive_id,
                $prediction->id,
                $prediction->prediction_timestamp->toIso8601String(),
            );

            $telegramDispatch = $this->queueReadinessAlert($prediction);

            return PredictionRunResult::predictionCreated($prediction, $telegramDispatch);
        });
    }

    private function updateHriSummary(SensorLog $log, Prediction $prediction): void
    {
        $today = now()->toDateString();

        $avgStats = DB::table('sensor_logs')
            ->where('hive_id', $log->hive_id)
            ->whereDate('record_timestamp', $today)
            ->selectRaw('AVG(temp) as avg_temp, AVG(humidity) as avg_humidity, AVG(mq2_value) as avg_mq2')
            ->first();

        $avgHri = DB::table('predictions')
            ->join('sensor_logs', 'predictions.sensor_log_id', '=', 'sensor_logs.id')
            ->where('sensor_logs.hive_id', $log->hive_id)
            ->whereDate('sensor_logs.record_timestamp', $today)
            ->avg('predictions.hri_value');

        HriSummary::updateOrCreate(
            ['hive_id' => $log->hive_id, 'summary_date' => $today],
            [
                'avg_temperature' => round((float) $avgStats->avg_temp, 2),
                'avg_humidity' => round((float) $avgStats->avg_humidity, 2),
                'avg_mq2' => round((float) $avgStats->avg_mq2, 2),
                'avg_hri_value' => round((float) ($avgHri ?? 0), 4),
                'latest_readiness_level' => $prediction->readiness_level,
            ],
        );
    }
}
