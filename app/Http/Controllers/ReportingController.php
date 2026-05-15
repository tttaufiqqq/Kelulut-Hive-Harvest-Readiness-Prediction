<?php

namespace App\Http\Controllers;

use App\Models\Hive;
use App\Models\HriSummary;
use App\Models\Prediction;
use Carbon\Carbon;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class ReportingController extends Controller
{
    public function index()
    {
        $beekeeperId = auth()->id();
        $hives = Hive::where('beekeeper_id', $beekeeperId)->with(['species', 'site'])->get();
        $hiveIds = $hives->pluck('id');

        return Inertia::render('reporting', [
            'hriGauges' => $this->hriGauges($hives),
            'readinessTrends' => $this->readinessTrends($hiveIds),
            'harvestSummary' => $this->harvestSummary($beekeeperId),
            'sensorProfiles' => $this->sensorProfiles($hiveIds),
        ]);
    }

    private function harvestSummary(int $beekeeperId): array
    {
        if (DB::getDriverName() !== 'mysql') {
            return [];
        }

        return DB::table('harvests')
            ->join('hives', 'hives.id', '=', 'harvests.hive_id')
            ->where('harvests.beekeeper_id', $beekeeperId)
            ->selectRaw("hives.id as hive_id, hives.name as hive_name, DATE_FORMAT(harvests.harvest_date, '%Y-%m') as harvest_month, SUM(harvests.weight) as total_weight, COUNT(*) as harvest_count")
            ->groupByRaw("hives.id, hives.name, DATE_FORMAT(harvests.harvest_date, '%Y-%m')")
            ->orderByDesc('total_weight')
            ->get()
            ->map(fn ($r) => (array) $r)
            ->all();
    }

    private function sensorProfiles(Collection $hiveIds): array
    {
        $latestIds = HriSummary::whereIn('hive_id', $hiveIds)
            ->selectRaw('MAX(id) as id')
            ->groupBy('hive_id')
            ->pluck('id');

        return HriSummary::whereIn('id', $latestIds)
            ->select([
                'hive_id',
                'avg_temperature',
                'avg_humidity',
                'avg_mq2',
                'avg_mq3',
                'avg_mq5',
                'avg_mq135',
            ])
            ->get()
            ->keyBy('hive_id')
            ->map(fn ($r) => [
                'avg_temperature' => (float) ($r->avg_temperature ?? 0),
                'avg_humidity' => (float) ($r->avg_humidity ?? 0),
                'avg_mq2' => (float) ($r->avg_mq2 ?? 0),
                'avg_mq3' => (float) ($r->avg_mq3 ?? 0),
                'avg_mq5' => (float) ($r->avg_mq5 ?? 0),
                'avg_mq135' => (float) ($r->avg_mq135 ?? 0),
            ])
            ->toArray();
    }

    private function hriGauges($hives): array
    {
        return $hives->map(function ($hive) {
            $latest = Prediction::join('sensor_logs', 'predictions.sensor_log_id', '=', 'sensor_logs.id')
                ->where('sensor_logs.hive_id', $hive->id)
                ->orderByDesc('predictions.prediction_timestamp')
                ->select('predictions.*')
                ->first();

            return [
                'hive_id' => $hive->id,
                'hive_name' => $hive->name,
                'site_name' => $hive->site?->name,
                'readiness_level' => $latest?->readiness_level,
                'hri_value' => $latest ? (float) $latest->hri_value : null,
                'confidence_pct' => $latest ? (int) round((float) $latest->confidence_score * 100) : null,
            ];
        })->values()->all();
    }

    private function readinessTrends($hiveIds): array
    {
        return HriSummary::whereIn('hive_id', $hiveIds)
            ->where('summary_date', '>=', now()->subDays(30)->toDateString())
            ->with('hive')
            ->orderBy('summary_date')
            ->get()
            ->map(fn ($s) => [
                'hive_id' => $s->hive_id,
                'hive_name' => $s->hive?->name,
                'summary_date' => $s->summary_date,
                'date' => Carbon::parse($s->summary_date)->format('M d'),
                'avg_hri_pct' => (int) round((float) ($s->avg_hri_value ?? 0) * 100),
            ])
            ->values()
            ->all();
    }
}
