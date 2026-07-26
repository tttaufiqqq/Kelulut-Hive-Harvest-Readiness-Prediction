<?php

namespace App\Services;

use App\Models\Hive;
use App\Models\Prediction;
use Carbon\Carbon;
use Carbon\CarbonInterface;

class BuildWeeklyPredictionTrendService
{
    public function execute(Hive $hive, CarbonInterface $start, CarbonInterface $end): array
    {
        return Prediction::join('sensor_logs', 'predictions.sensor_log_id', '=', 'sensor_logs.id')
            ->where('sensor_logs.hive_id', $hive->id)
            ->whereBetween('predictions.prediction_timestamp', [$start, $end])
            ->selectRaw('
                DATE(predictions.prediction_timestamp) as day,
                AVG(predictions.hri_value) as hri_value,
                AVG(predictions.confidence_score) as confidence_score,
                AVG(sensor_logs.temp) as temp,
                AVG(sensor_logs.humidity) as humidity
            ')
            ->groupByRaw('DATE(predictions.prediction_timestamp)')
            ->orderBy('day')
            ->get()
            ->values()
            ->map(fn ($row, int $index) => [
                'id' => $index + 1,
                'label' => Carbon::parse($row->day)->format('D, M j'),
                'hri_pct' => round((float) $row->hri_value * 100, 1),
                'confidence_pct' => round((float) $row->confidence_score * 100, 1),
                'temp' => $row->temp !== null ? round((float) $row->temp, 1) : null,
                'humidity' => $row->humidity !== null ? round((float) $row->humidity, 1) : null,
                'warning_state' => 'normal',
            ])
            ->all();
    }
}
