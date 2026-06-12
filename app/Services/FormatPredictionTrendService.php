<?php

namespace App\Services;

use App\Models\Prediction;
use App\Support\SensorReadings;
use Carbon\Carbon;

class FormatPredictionTrendService
{
    public function execute(Prediction $prediction, mixed $chartDate): array
    {
        $sensorLog = $prediction->sensorLog;
        $predictionTimestamp = $prediction->prediction_timestamp;
        $isSameDay = $predictionTimestamp?->isSameDay(Carbon::parse($chartDate));
        $sensorValues = SensorReadings::fromLog($sensorLog);

        return [
            'id'             => $prediction->id,
            'label'          => $predictionTimestamp
                ? $predictionTimestamp->format($isSameDay ? 'H:i' : 'd/m/Y, H:i')
                : 'N/A',
            'hri_pct'        => round((float) $prediction->hri_value * 100, 1),
            'confidence_pct' => round((float) $prediction->confidence_score * 100, 1),
            'temp'           => ($sensorValues['temp'] ?? null) !== null ? round((float) $sensorValues['temp'], 1) : null,
            'humidity'       => ($sensorValues['humidity'] ?? null) !== null ? round((float) $sensorValues['humidity'], 1) : null,
            'warning_state'  => $prediction->warning_state ?? 'normal',
        ];
    }
}
