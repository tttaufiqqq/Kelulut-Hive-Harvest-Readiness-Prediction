<?php

namespace App\Http\Controllers;

use App\Models\Hive;
use App\Models\Prediction;
use Carbon\Carbon;
use Inertia\Inertia;

class PredictionController extends Controller
{
    public function show(Hive $hive)
    {
        abort_if($hive->beekeeper_id !== auth()->id(), 403);

        $predictions = Prediction::join('sensor_logs', 'predictions.sensor_log_id', '=', 'sensor_logs.id')
            ->where('sensor_logs.hive_id', $hive->id)
            ->orderByDesc('predictions.prediction_timestamp')
            ->limit(20)
            ->select(
                'predictions.*',
                'sensor_logs.temp',
                'sensor_logs.humidity',
                'sensor_logs.mq2_value',
                'sensor_logs.mq3_value',
                'sensor_logs.mq5_value',
                'sensor_logs.mq135_value',
                'sensor_logs.record_timestamp',
            )
            ->get()
            ->map(fn ($p) => [
                'id' => $p->id,
                'readiness_level' => $p->readiness_level,
                'hri_value' => (float) $p->hri_value,
                'confidence_score' => (float) $p->confidence_score,
                'prediction_timestamp' => Carbon::parse($p->prediction_timestamp)->format('d M Y, H:i'),
                'temp' => round((float) $p->temp, 1),
                'humidity' => round((float) $p->humidity, 1),
                'mq2_value' => (int) $p->mq2_value,
                'mq3_value' => (int) $p->mq3_value,
                'mq5_value' => (int) $p->mq5_value,
                'mq135_value' => (int) $p->mq135_value,
                'record_timestamp' => Carbon::parse($p->record_timestamp)->format('d M Y, H:i'),
            ]);

        return Inertia::render('predictions', [
            'hive' => ['id' => $hive->id, 'name' => $hive->name],
            'predictions' => $predictions,
        ]);
    }
}
