<?php

namespace App\Http\Controllers;

use App\Models\Harvest;
use App\Models\Hive;
use App\Models\Prediction;
use App\Models\SensorLog;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class AnalyticsController extends Controller
{
    public function show(Request $request, Hive $hive)
    {
        abort_if($hive->beekeeper_id !== auth()->id(), 403);

        // ── Q1: HRI trend — last 30 days, grouped by date ─────────────────────
        $avg7d = Prediction::join('sensor_logs', 'predictions.sensor_log_id', '=', 'sensor_logs.id')
            ->where('sensor_logs.hive_id', $hive->id)
            ->where('predictions.prediction_timestamp', '>=', now()->subDays(7))
            ->avg('predictions.hri_value');
        $avg7dPct = round(($avg7d ?? 0) * 100);

        $hriTrend = Prediction::join('sensor_logs', 'predictions.sensor_log_id', '=', 'sensor_logs.id')
            ->where('sensor_logs.hive_id', $hive->id)
            ->where('predictions.prediction_timestamp', '>=', now()->subDays(30))
            ->selectRaw('DATE(predictions.prediction_timestamp) as date, AVG(predictions.hri_value * 100) as hri_score')
            ->groupByRaw('DATE(predictions.prediction_timestamp)')
            ->orderBy('date')
            ->get()
            ->map(fn($row) => [
                'date'      => Carbon::parse($row->date)->format('M d'),
                'hri_score' => round($row->hri_score),
                'avg_7d'    => $avg7dPct,
            ]);

        // ── Q2: Sensor readings — today, grouped by hour ──────────────────────
        $isSqlite   = DB::connection()->getDriverName() === 'sqlite';
        $hourExpr   = $isSqlite
            ? "strftime('%H:00', record_timestamp)"
            : 'DATE_FORMAT(record_timestamp, "%H:00")';

        $sensorReadings = SensorLog::where('hive_id', $hive->id)
            ->whereDate('record_timestamp', today())
            ->selectRaw("
                {$hourExpr} as time,
                AVG(temp)         as temp,
                AVG(humidity)     as humidity,
                AVG(mq2_value)    as mq2,
                AVG(mq3_value)    as mq3,
                AVG(mq5_value)    as mq5,
                AVG(mq135_value)  as mq135
            ")
            ->groupByRaw($hourExpr)
            ->orderBy('time')
            ->get()
            ->map(fn($r) => [
                'time'     => $r->time,
                'temp'     => round($r->temp, 1),
                'humidity' => round($r->humidity, 1),
                'mq2'      => round($r->mq2),
                'mq3'      => round($r->mq3),
                'mq5'      => round($r->mq5),
                'mq135'    => round($r->mq135),
            ]);

        // ── Q3: Latest prediction ─────────────────────────────────────────────
        $latestPredictionRow = Prediction::join('sensor_logs', 'predictions.sensor_log_id', '=', 'sensor_logs.id')
            ->where('sensor_logs.hive_id', $hive->id)
            ->orderByDesc('predictions.prediction_timestamp')
            ->select('predictions.*')
            ->first();

        $latestPrediction = $latestPredictionRow ? [
            'readiness_level'      => $latestPredictionRow->readiness_level,
            'hri_value'            => (float) $latestPredictionRow->hri_value,
            'confidence_score'     => (float) $latestPredictionRow->confidence_score,
            'prediction_timestamp' => Carbon::parse($latestPredictionRow->prediction_timestamp)->format('d M Y, H:i'),
        ] : null;

        // ── Q4: Harvest history ───────────────────────────────────────────────
        $harvestHistory = Harvest::where('hive_id', $hive->id)
            ->with(['color', 'flavor'])
            ->orderByDesc('harvest_date')
            ->get()
            ->map(fn($h) => [
                'date'   => Carbon::parse($h->harvest_date)->format('M d'),
                'weight' => (float) $h->weight,
                'color'  => $h->color?->name,
                'flavor' => $h->flavor?->name,
            ]);

        // ── Q5: Hive summary ──────────────────────────────────────────────────
        $summary        = $hive->summary;
        $totalHarvests  = Harvest::where('hive_id', $hive->id)->count();
        $lastHarvestDate= Harvest::where('hive_id', $hive->id)->max('harvest_date');

        return Inertia::render('analytics', [
            'hive' => [
                'id'                     => $hive->id,
                'name'                   => $hive->name,
                'latest_readiness_level' => $summary?->latest_readiness_level,
                'avg_hri_pct'            => round(($summary?->avg_hri_value ?? 0) * 100),
                'avg_hri_7d_pct'         => $avg7dPct,
                'total_harvests'         => $totalHarvests,
                'last_harvest_date'      => $lastHarvestDate,
            ],
            'hriTrend'         => $hriTrend,
            'sensorReadings'   => $sensorReadings,
            'latestPrediction' => $latestPrediction,
            'harvestHistory'   => $harvestHistory,
        ]);
    }
}
