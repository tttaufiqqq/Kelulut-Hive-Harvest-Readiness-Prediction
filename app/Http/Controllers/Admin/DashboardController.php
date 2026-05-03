<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Hive;
use App\Models\Prediction;
use App\Models\SensorLog;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;

class DashboardController extends Controller
{
    public function index()
    {
        $stats = User::role('beekeeper')
            ->selectRaw("COUNT(*) as total, SUM(status = 'pending') as pending, SUM(status = 'active') as active")
            ->first();

        try {
            $hives = $this->liveHiveMonitor();
        } catch (\Throwable $e) {
            Log::error('AdminDashboard liveHiveMonitor failed: ' . $e->getMessage() . ' in ' . $e->getFile() . ':' . $e->getLine());
            $hives = [];
        }

        try {
            $productivity = $this->productivityRanking();
        } catch (\Throwable $e) {
            Log::error('AdminDashboard productivityRanking failed: ' . $e->getMessage() . ' in ' . $e->getFile() . ':' . $e->getLine());
            $productivity = [];
        }

        try {
            $crossSite = $this->crossSiteComparison();
        } catch (\Throwable $e) {
            Log::error('AdminDashboard crossSiteComparison failed: ' . $e->getMessage() . ' in ' . $e->getFile() . ':' . $e->getLine());
            $crossSite = [];
        }

        return Inertia::render('admin/dashboard', [
            'stats' => [
                'total'   => (int) $stats->total,
                'pending' => (int) $stats->pending,
                'active'  => (int) $stats->active,
            ],
            'hives'               => $hives,
            'productivityRanking' => $productivity,
            'crossSiteComparison' => $crossSite,
        ]);
    }

    private function liveHiveMonitor(): array
    {
        $hives = Hive::with(['user', 'species'])->withSum('harvests', 'weight')->get();

        // Latest sensor_log id per hive — one query
        $latestLogIds = SensorLog::selectRaw('MAX(id) as log_id, hive_id')
            ->groupBy('hive_id')
            ->pluck('log_id', 'hive_id');

        // Sensor logs and predictions for those ids — two queries
        $sensorLogs  = SensorLog::whereIn('id', $latestLogIds->values())->get()->keyBy('id');
        $predictions = Prediction::whereIn('sensor_log_id', $latestLogIds->values())->get()->keyBy('sensor_log_id');

        return $hives->map(function ($hive) use ($latestLogIds, $sensorLogs, $predictions) {
            $logId      = $latestLogIds->get($hive->id);
            $log        = $logId ? $sensorLogs->get($logId) : null;
            $prediction = $logId ? $predictions->get($logId) : null;
            $status     = $this->deriveStatus($prediction?->readiness_level);

            return [
                'id'        => (string) $hive->id,
                'beekeeper' => $hive->user?->name ?? '—',
                'species'   => $hive->species?->name ?? '—',
                'weight'    => round((float) ($hive->harvests_sum_weight ?? 0), 1),
                'temp'      => $log ? round((float) $log->temp, 1) : 0,
                'humidity'  => $log ? (int) round((float) $log->humidity) : 0,
                'co2'       => $log ? (int) $log->mq135_value : 0,
                'readiness' => $prediction ? (int) round((float) $prediction->confidence_score * 100) : 0,
                'status'    => $status,
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
            ->map(fn($h) => [
                'hive_name'     => $h->name,
                'beekeeper'     => $h->user?->name ?? '—',
                'total_weight'  => round((float) ($h->harvests_sum_weight ?? 0), 1),
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
            ->map(fn($r) => [
                'site_name'    => $r->site_name,
                'avg_hri_pct'  => (int) round((float) ($r->avg_hri_pct ?? 0)),
                'total_weight' => round((float) ($r->total_weight ?? 0), 1),
                'hive_count'   => (int) $r->hive_count,
            ])
            ->values()
            ->all();
    }

    private function deriveStatus(?string $readinessLevel): string
    {
        return match ($readinessLevel) {
            'Ready to Harvest' => 'ready',
            'Nearly Ready'     => 'growing',
            'Approaching'      => 'growing',
            'Not Ready'        => 'alert',
            default            => 'offline',
        };
    }
}
