<?php

namespace App\Services;

use App\Jobs\SendTelegramAlert;
use App\Models\HriSummary;
use App\Models\Prediction;
use App\Models\SensorLog;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class MlPredictionService
{
    public function predict(SensorLog $log): ?Prediction
    {
        try {
            $response = Http::timeout(10)->post(config('services.ml.url').'/predict', [
                'mq2_value' => $log->mq2_value,
                'mq3_value' => $log->mq3_value,
                'mq5_value' => $log->mq5_value,
                'mq135_value' => $log->mq135_value,
                'temp' => $log->temp,
                'humidity' => $log->humidity,
            ]);

            if (! $response->successful()) {
                Log::warning('ML API error', ['status' => $response->status(), 'sensor_log_id' => $log->id]);

                return null;
            }

            $data = $response->json();

            if (isset($data['error'])) {
                Log::warning('ML API returned error', ['error' => $data['error'], 'sensor_log_id' => $log->id]);

                return null;
            }

            $prediction = Prediction::create([
                'sensor_log_id' => $log->id,
                'readiness_level' => $data['readiness_level'],
                'hri_value' => $data['hri_value'],
                'confidence_score' => $data['confidence_score'],
                'prediction_timestamp' => now(),
            ]);

            if ($prediction->readiness_level === 'ready') {
                SendTelegramAlert::dispatch($prediction->id);
            }

            // ── HRI Summary update (non-blocking) ────────────────────────
            try {
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
            } catch (\Throwable $e) {
                Log::warning('HriSummary update failed', [
                    'error' => $e->getMessage(),
                    'sensor_log_id' => $log->id,
                ]);
            }

            return $prediction;
        } catch (\Throwable $e) {
            Log::warning('ML prediction failed', [
                'error' => $e->getMessage(),
                'sensor_log_id' => $log->id,
            ]);

            return null;
        }
    }
}
