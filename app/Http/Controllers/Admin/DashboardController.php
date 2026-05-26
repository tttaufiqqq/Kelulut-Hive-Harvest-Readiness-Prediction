<?php

namespace App\Http\Controllers\Admin;

use App\Enums\AppErrorCode;
use App\Http\Controllers\Controller;
use App\Models\Hive;
use App\Models\Prediction;
use App\Models\SensorLog;
use App\Support\SafeSection;
use App\Models\HriSummary;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
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

        $fleetHriTrend = SafeSection::execute(
            'admin.dashboard.fleet_hri_trend',
            fn () => array_map(fn ($r) => (array) $r, DB::select('CALL sp_fleet_hri_trend(?)', [180])),
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
            'fleetHriTrend' => $fleetHriTrend,
        ]);
    }

    private function liveHiveMonitor(?Carbon $date = null): array
    {
        $hives = Hive::with(['user', 'species'])->withSum('harvests', 'weight')->get();
        $targetDate = $date ?? today();

        // Query A: latest sensor_log id per hive — today only
        $latestTodayLogIds = SensorLog::selectRaw('MAX(id) as log_id, hive_id')
            ->whereDate('record_timestamp', $targetDate)
            ->groupBy('hive_id')
            ->pluck('log_id', 'hive_id');

        // Query B: latest sensor_log id per hive — all-time (for last_reading only)
        $latestEverLogIds = SensorLog::selectRaw('MAX(id) as log_id, hive_id')
            ->groupBy('hive_id')
            ->pluck('log_id', 'hive_id');

        // Query C: hive IDs with threshold violations today
        $alertHiveIds = DB::table('sensor_log_thresholds')
            ->join('sensor_logs', 'sensor_log_thresholds.sensor_log_id', '=', 'sensor_logs.id')
            ->whereDate('sensor_logs.record_timestamp', $targetDate)
            ->pluck('sensor_logs.hive_id')
            ->unique();

        // Fetch sensor logs for union of today + ever IDs (include MQ columns for radar)
        $allLogIds = $latestTodayLogIds->values()->merge($latestEverLogIds->values())->unique();
        $sensorLogs = SensorLog::whereIn('id', $allLogIds)
            ->select(['id', 'hive_id', 'temp', 'humidity', 'mq2_value', 'mq3_value', 'mq5_value', 'mq135_value', 'record_timestamp'])
            ->get()
            ->keyBy('id');

        // Query D: predictions for today's log IDs only
        $predictions = Prediction::whereIn('sensor_log_id', $latestTodayLogIds->values())->get()->keyBy('sensor_log_id');

        return $hives->map(function ($hive) use ($latestTodayLogIds, $latestEverLogIds, $sensorLogs, $predictions, $alertHiveIds) {
            $targetDateLogId = $latestTodayLogIds->get($hive->id);
            $everLogId = $latestEverLogIds->get($hive->id);
            $targetDateLog = $targetDateLogId ? $sensorLogs->get($targetDateLogId) : null;
            $everLog = $everLogId ? $sensorLogs->get($everLogId) : null;
            $prediction = $targetDateLogId ? $predictions->get($targetDateLogId) : null;
            $hasAlert = $alertHiveIds->contains($hive->id);

            if (! $targetDateLog) {
                $status = 'no_data';
            } elseif ($hasAlert) {
                $status = 'alert';
            } elseif ($prediction) {
                $status = match ($prediction->readiness_level) {
                    'Ready to Harvest', 'ready' => 'ready',
                    'Nearly Ready', 'Approaching', 'Not Ready',
                    'nearly_ready', 'approaching', 'not_ready' => 'growing',
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
                'temp' => $targetDateLog ? round((float) $targetDateLog->temp, 1) : 0,
                'humidity' => $targetDateLog ? (int) round((float) $targetDateLog->humidity) : 0,
                'co2' => $targetDateLog ? (int) $targetDateLog->mq135_value : 0,
                'mq2' => $targetDateLog ? (int) $targetDateLog->mq2_value : 0,
                'mq3' => $targetDateLog ? (int) $targetDateLog->mq3_value : 0,
                'mq5' => $targetDateLog ? (int) $targetDateLog->mq5_value : 0,
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
            ->get()
            ->sortByDesc(fn ($h) => ($h->harvests_sum_weight ?? 0) * ($h->harvests_count ?? 0))
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

    public function readinessSnapshot(Request $request): JsonResponse
    {
        $date = $request->input('date');

        if (!$date || !Carbon::canBeCreatedFromFormat($date, 'Y-m-d')) {
            return response()->json(['has_data' => false, 'data' => []], 422);
        }

        $parsedDate = Carbon::createFromFormat('Y-m-d', $date)->startOfDay();

        if ($parsedDate->isFuture()) {
            return response()->json(['has_data' => false, 'data' => []], 422);
        }

        $totalHives = Hive::count();

        $rows = HriSummary::whereDate('summary_date', $parsedDate)
            ->whereNotNull('latest_readiness_level')
            ->select(['latest_readiness_level'])
            ->get();

        if ($rows->isEmpty()) {
            return response()->json([
                'has_data' => false,
                'data' => [['level' => 'no_data', 'count' => $totalHives]],
            ]);
        }

        $counts = [];
        foreach ($rows as $row) {
            $level = $row->latest_readiness_level;
            $counts[$level] = ($counts[$level] ?? 0) + 1;
        }

        $data = array_map(
            fn ($level, $count) => ['level' => $level, 'count' => $count],
            array_keys($counts),
            array_values($counts),
        );

        return response()->json(['has_data' => true, 'data' => $data]);
    }

    public function hiveMonitorSnapshot(Request $request): JsonResponse
    {
        $date = $request->input('date');

        if (!$date || !Carbon::canBeCreatedFromFormat($date, 'Y-m-d')) {
            return response()->json(['has_data' => false, 'data' => []], 422);
        }

        $parsedDate = Carbon::createFromFormat('Y-m-d', $date)->startOfDay();

        if ($parsedDate->isFuture()) {
            return response()->json(['has_data' => false, 'data' => []], 422);
        }

        $data = $this->liveHiveMonitor($parsedDate);
        $hasData = collect($data)->contains(fn ($h) => $h['status'] !== 'no_data');

        return response()->json(['has_data' => $hasData, 'data' => $data]);
    }
}
