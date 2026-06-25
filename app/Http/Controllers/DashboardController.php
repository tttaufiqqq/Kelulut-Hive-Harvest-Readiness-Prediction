<?php

namespace App\Http\Controllers;

use App\Models\Hive;
use App\Models\Prediction;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class DashboardController extends Controller
{
    public function index()
    {
        $hives = Hive::where('beekeeper_id', auth()->id())
            ->with(['species', 'site', 'summary'])
            ->withCount('harvests')
            ->withMax('harvests', 'harvest_date')
            ->get();

        // Fetch the latest today's prediction hri_value per hive so the readiness %
        // and the readiness badge (latest_readiness_level) always come from the same
        // prediction. avg_hri_value from hri_summary is a daily average and would show
        // a misleading low % when a synthetic diagnostic prediction is the latest one.
        $latestPredIdByHive = DB::table('predictions')
            ->join('sensor_logs', 'predictions.sensor_log_id', '=', 'sensor_logs.id')
            ->whereIn('sensor_logs.hive_id', $hives->pluck('id'))
            ->whereDate('sensor_logs.record_timestamp', today())
            ->groupBy('sensor_logs.hive_id')
            ->selectRaw('sensor_logs.hive_id as hive_id, MAX(predictions.id) as pred_id')
            ->pluck('pred_id', 'hive_id');

        $hriByPredId = Prediction::whereIn('id', $latestPredIdByHive->values())
            ->pluck('hri_value', 'id');

        $latestHriByHive = $latestPredIdByHive->map(
            fn ($predId) => (float) ($hriByPredId->get($predId) ?? 0)
        );

        return Inertia::render('dashboard/index', [
            'hives' => $hives->map(fn ($hive) => [
                'id' => $hive->id,
                'name' => $hive->name,
                'species' => $hive->species?->name,
                'species_id' => $hive->species_id,
                'location' => $hive->site?->name,
                'site_id' => $hive->site_id,
                'status' => $hive->status,
                'age_months' => (function () use ($hive) {
                    $days = (int) $hive->created_at->diffInDays(now());
                    $months = (int) floor($days / 30);
                    return $months > 0 ? "{$months}m" : "{$days}d";
                })(),
                'harvest_count' => (int) ($hive->harvests_count ?? 0),
                'last_harvest_date' => $hive->harvests_max_harvest_date,
                'readiness_level' => $hive->summary?->latest_readiness_level,
                'hri_value' => $latestHriByHive->get($hive->id) ?? (float) ($hive->summary?->avg_hri_value ?? 0),
                'avg_temperature' => $hive->summary?->avg_temperature,
                'avg_humidity' => $hive->summary?->avg_humidity,
                'avg_mq2' => $hive->summary?->avg_mq2,
                'avg_mq3' => $hive->summary?->avg_mq3,
                'avg_mq5' => $hive->summary?->avg_mq5,
                'avg_mq135' => $hive->summary?->avg_mq135,
            ])->values()->all(),
        ]);
    }
}
