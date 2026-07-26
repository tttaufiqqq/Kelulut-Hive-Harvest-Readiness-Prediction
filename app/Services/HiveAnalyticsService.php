<?php

namespace App\Services;

use App\Models\Harvest;
use App\Models\Hive;
use App\Models\Prediction;
use App\Services\BuildHourlySensorReadingsService;
use App\Services\BuildWeeklySensorReadingsService;
use App\Support\CalendarWeeks;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class HiveAnalyticsService
{
    public function __construct(
        private readonly BuildHourlySensorReadingsService $hourlySensorReadingsBuilder,
        private readonly BuildWeeklySensorReadingsService $weeklySensorReadingsBuilder,
    ) {}

    public function execute(Hive $hive, Request $request): array
    {
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
            ->map(fn ($row) => [
                'date'      => Carbon::parse($row->date)->format('M d'),
                'hri_score' => round($row->hri_score),
                'avg_7d'    => $avg7dPct,
            ]);

        // ── Q2: Sensor readings — selected date (hourly) or week (daily), default today
        $defaultSensorDate = today();
        $defaultSensorMonth = today()->startOfMonth();
        $defaultSensorWeek = CalendarWeeks::weekNumberFor(today());

        $sensorFilterType = $request->string('sensor_filter_type', 'date')->value();
        $sensorDate = $request->date('sensor_date') ?? $defaultSensorDate;
        $sensorMonth = $request->date('sensor_month') ?? $defaultSensorMonth;
        $sensorWeek = (int) $request->integer('sensor_week', $defaultSensorWeek);
        $weekRange = CalendarWeeks::range($sensorMonth, $sensorWeek);

        $sensorReadings = $sensorFilterType === 'week'
            ? $this->weeklySensorReadingsBuilder->execute($hive, $weekRange['start'], $weekRange['end'])
            : $this->hourlySensorReadingsBuilder->execute($hive, $sensorDate);

        // ── Q3: Latest prediction ─────────────────────────────────────────────
        try {
            $latestPredictionRow = DB::table('vw_hive_latest_prediction')
                ->where('hive_id', $hive->id)
                ->first();
        } catch (\Throwable) {
            $latestPredictionRow = null;
        }

        $latestPrediction = $latestPredictionRow ? [
            'readiness_level'      => $latestPredictionRow->readiness_level,
            'hri_value'            => (float) $latestPredictionRow->hri_value,
            'confidence_score'     => (float) $latestPredictionRow->confidence_score,
            'prediction_timestamp' => Carbon::parse($latestPredictionRow->prediction_timestamp)->toIso8601String(),
        ] : null;

        // ── Q4: Harvest history ───────────────────────────────────────────────
        $harvestHistory = Harvest::where('hive_id', $hive->id)
            ->with(['color', 'flavor'])
            ->orderBy('harvest_date')
            ->get()
            ->map(fn ($harvest) => [
                'date'   => Carbon::parse($harvest->harvest_date)->format('M d'),
                'weight' => (float) $harvest->weight,
                'color'  => $harvest->color?->name,
                'flavor' => $harvest->flavor?->name,
            ]);

        // ── Q5: Hive summary ──────────────────────────────────────────────────
        $summary = $hive->summary;
        try {
            $harvestSummary = DB::table('vw_harvest_summary_per_hive')->where('hive_id', $hive->id)->first();
        } catch (\Throwable) {
            $harvestSummary = null;
        }
        $totalHarvests = (int) ($harvestSummary?->total_harvests ?? 0);
        $lastHarvestDate = $harvestSummary?->last_harvest_date;

        // Use the latest prediction's hri_value for the HRI Score card so the % and badge
        // always come from the same prediction. avg_hri_value is a daily average that stays
        // low when most readings today were not_ready, even if the latest one is ready.
        $latestHriValue = $latestPrediction ? $latestPrediction['hri_value'] : ($summary?->avg_hri_value ?? 0);

        return [
            'hive' => [
                'id'                     => $hive->id,
                'name'                   => $hive->name,
                'latest_readiness_level' => $summary?->latest_readiness_level,
                'avg_hri_pct'            => round($latestHriValue * 100),
                'avg_hri_7d_pct'         => $avg7dPct,
                'total_harvests'         => $totalHarvests,
                'last_harvest_date'      => $lastHarvestDate,
            ],
            'hriTrend'         => $hriTrend,
            'sensorReadings'   => $sensorReadings,
            'latestPrediction' => $latestPrediction,
            'harvestHistory'   => $harvestHistory,
            'filters'          => [
                'sensor_filter_type'   => $sensorFilterType,
                'sensor_date'          => Carbon::parse($sensorDate)->toDateString(),
                'default_sensor_date'  => Carbon::parse($defaultSensorDate)->toDateString(),
                'sensor_month'         => Carbon::parse($sensorMonth)->format('Y-m'),
                'default_sensor_month' => Carbon::parse($defaultSensorMonth)->format('Y-m'),
                'sensor_week'          => $weekRange['week'],
                'default_sensor_week'  => $defaultSensorWeek,
            ],
        ];
    }
}
