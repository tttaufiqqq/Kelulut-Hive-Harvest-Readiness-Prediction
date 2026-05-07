<?php

namespace App\Http\Controllers\Admin;

use App\Enums\AppErrorCode;
use App\Http\Controllers\Controller;
use App\Models\Hive;
use App\Models\Prediction;
use App\Models\SensorLog;
use App\Support\SafeSection;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class DashboardController extends Controller
{
    public function index()
    {
        $stats = User::role('beekeeper')
            ->selectRaw("COUNT(*) as total, SUM(status = 'pending') as pending, SUM(status = 'active') as active")
            ->first();

        $hives = SafeSection::execute(
            'admin.dashboard.live_hive_monitor',
            fn () => $this->liveHiveMonitor(),
            [],
            AppErrorCode::UnexpectedError,
        );

        $productivity = SafeSection::execute(
            'admin.dashboard.productivity_ranking',
            fn () => $this->productivityRanking(),
            [],
            AppErrorCode::UnexpectedError,
        );

        $crossSite = SafeSection::execute(
            'admin.dashboard.cross_site_comparison',
            fn () => $this->crossSiteComparison(),
            [],
            AppErrorCode::UnexpectedError,
        );

        return Inertia::render('admin/dashboard', [
            'stats' => [
                'total' => (int) $stats->total,
                'pending' => (int) $stats->pending,
                'active' => (int) $stats->active,
            ],
            'hives' => $hives,
            'productivityRanking' => $productivity,
            'crossSiteComparison' => $crossSite,
        ]);
    }

    private function liveHiveMonitor(): array
    {
        $hives = Hive::with(['user', 'species'])->withSum('harvests', 'weight')->get();
        $today = today();

        // Query A: latest sensor_log id per hive — today only
        $latestTodayLogIds = SensorLog::selectRaw('MAX(id) as log_id, hive_id')
            ->whereDate('record_timestamp', $today)
            ->groupBy('hive_id')
            ->pluck('log_id', 'hive_id');

        // Query B: latest sensor_log id per hive — all-time (for last_reading only)
        $latestEverLogIds = SensorLog::selectRaw('MAX(id) as log_id, hive_id')
            ->groupBy('hive_id')
            ->pluck('log_id', 'hive_id');

        // Query C: hive IDs with threshold violations today
        $alertHiveIds = DB::table('sensor_log_thresholds')
            ->join('sensor_logs', 'sensor_log_thresholds.sensor_log_id', '=', 'sensor_logs.id')
            ->whereDate('sensor_logs.record_timestamp', $today)
            ->pluck('sensor_logs.hive_id')
            ->unique();

        // Fetch sensor logs for union of today + ever IDs
        $allLogIds = $latestTodayLogIds->values()->merge($latestEverLogIds->values())->unique();
        $sensorLogs = SensorLog::whereIn('id', $allLogIds)->get()->keyBy('id');

        // Query D: predictions for today's log IDs only
        $predictions = Prediction::whereIn('sensor_log_id', $latestTodayLogIds->values())->get()->keyBy('sensor_log_id');

        return $hives->map(function ($hive) use ($latestTodayLogIds, $latestEverLogIds, $sensorLogs, $predictions, $alertHiveIds) {
            $todayLogId = $latestTodayLogIds->get($hive->id);
            $everLogId = $latestEverLogIds->get($hive->id);
            $todayLog = $todayLogId ? $sensorLogs->get($todayLogId) : null;
            $everLog = $everLogId ? $sensorLogs->get($everLogId) : null;
            $prediction = $todayLogId ? $predictions->get($todayLogId) : null;
            $hasAlert = $alertHiveIds->contains($hive->id);

            if (! $todayLog) {
                $status = 'no_data';
            } elseif ($hasAlert) {
                $status = 'alert';
            } elseif ($prediction) {
                $status = match ($prediction->readiness_level) {
                    'Ready to Harvest' => 'ready',
                    'Nearly Ready', 'Approaching', 'Not Ready' => 'growing',
                    default => 'offline',
                };
            } else {
                $status = 'offline';
            }

            return [
                'id' => (string) $hive->id,
                'hive_name' => $hive->name,
                'beekeeper' => $hive->user?->name ?? '—',
                'species' => $hive->species?->name ?? '—',
                'weight' => round((float) ($hive->harvests_sum_weight ?? 0), 1),
                'temp' => $todayLog ? round((float) $todayLog->temp, 1) : 0,
                'humidity' => $todayLog ? (int) round((float) $todayLog->humidity) : 0,
                'co2' => $todayLog ? (int) $todayLog->mq135_value : 0,
                'readiness' => $prediction ? (int) round((float) $prediction->confidence_score * 100) : 0,
                'status' => $status,
                'last_reading' => $everLog ? Carbon::parse($everLog->record_timestamp)->toIso8601String() : null,
            ];
        })->values()->all();
    }

    private function productivityRanking(): array
    {
        return Hive::with('user')
            ->withSum('harvests', 'weight')
            ->withCount('harvests')
            ->orderByDesc('harvests_sum_weight')
            ->get()
            ->map(fn ($h) => [
                'hive_name' => $h->name,
                'beekeeper' => $h->user?->name ?? '—',
                'total_weight' => round((float) ($h->harvests_sum_weight ?? 0), 1),
                'harvest_count' => (int) ($h->harvests_count ?? 0),
            ])
            ->values()
            ->all();
    }

    private function crossSiteComparison(): array
    {
        return DB::table('hives')
            ->join('master_sites', 'hives.site_id', '=', 'master_sites.id')
            ->leftJoin('hri_summary', 'hives.id', '=', 'hri_summary.hive_id')
            ->leftJoin('harvests', 'hives.id', '=', 'harvests.hive_id')
            ->groupBy('master_sites.id', 'master_sites.name')
            ->selectRaw('
                master_sites.name as site_name,
                AVG(hri_summary.avg_hri_value * 100) as avg_hri_pct,
                SUM(harvests.weight) as total_weight,
                COUNT(DISTINCT hives.id) as hive_count
            ')
            ->get()
            ->map(fn ($r) => [
                'site_name' => $r->site_name,
                'avg_hri_pct' => (int) round((float) ($r->avg_hri_pct ?? 0)),
                'total_weight' => round((float) ($r->total_weight ?? 0), 1),
                'hive_count' => (int) $r->hive_count,
            ])
            ->values()
            ->all();
    }
}
