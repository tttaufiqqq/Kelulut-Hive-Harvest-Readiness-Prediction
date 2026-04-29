<?php

namespace App\Services;

use App\Jobs\SendTelegramAlert;
use App\Models\Prediction;
use App\Models\SensorLog;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class MlPredictionService
{
    public function predict(SensorLog $log): ?Prediction
    {
        try {
            $response = Http::timeout(5)->post(config('services.ml.url') . '/predict', [
                'mq2_value'   => $log->mq2_value,
                'mq3_value'   => $log->mq3_value,
                'mq5_value'   => $log->mq5_value,
                'mq135_value' => $log->mq135_value,
                'temp'        => $log->temp,
                'humidity'    => $log->humidity,
            ]);

            if (!$response->successful()) {
                Log::warning('ML API returned non-2xx', [
                    'status'        => $response->status(),
                    'sensor_log_id' => $log->id,
                ]);
                return null;
            }

            $data = $response->json();

            $prediction = Prediction::create([
                'sensor_log_id'        => $log->id,
                'readiness_level'      => $data['readiness_level'],
                'hri_value'            => $data['hri_value'],
                'confidence_score'     => $data['confidence_score'],
                'prediction_timestamp' => now(),
            ]);

            if ($prediction->readiness_level === 'Ready to Harvest') {
                SendTelegramAlert::dispatch($prediction->id);
            }

            return $prediction;
        } catch (\Throwable $e) {
            Log::warning('ML prediction failed', [
                'error'         => $e->getMessage(),
                'sensor_log_id' => $log->id,
            ]);
            return null;
        }
    }
}
