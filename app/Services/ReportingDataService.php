<?php

namespace App\Services;

use App\Models\HriSummary;
use Carbon\Carbon;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

class ReportingDataService
{
    public function execute(int $beekeeperId, Collection $hives): array
    {
        $hiveIds = $hives->pluck('id');

        return [
            'hriGauges'       => $this->hriGauges($hives),
            'readinessTrends' => $this->readinessTrends($hiveIds),
            'harvestSummary'  => $this->harvestSummary($beekeeperId),
            'sensorProfiles'  => $this->sensorProfiles($hiveIds),
        ];
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
            ->map(fn ($row) => (array) $row)
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
            ->map(fn ($row) => [
                'avg_temperature' => (float) ($row->avg_temperature ?? 0),
                'avg_humidity'    => (float) ($row->avg_humidity ?? 0),
                'avg_mq2'         => (float) ($row->avg_mq2 ?? 0),
                'avg_mq3'         => (float) ($row->avg_mq3 ?? 0),
                'avg_mq5'         => (float) ($row->avg_mq5 ?? 0),
                'avg_mq135'       => (float) ($row->avg_mq135 ?? 0),
            ])
            ->toArray();
    }

    private function hriGauges(Collection $hives): array
    {
        try {
            $predictions = DB::table('vw_hive_latest_prediction')
                ->whereIn('hive_id', $hives->pluck('id'))
                ->get()
                ->keyBy('hive_id');
        } catch (\Throwable) {
            $predictions = collect();
        }

        return $hives->map(fn ($hive) => [
            'hive_id'         => $hive->id,
            'hive_name'       => $hive->name,
            'site_name'       => $hive->site?->name,
            'readiness_level' => $predictions->get($hive->id)?->readiness_level,
            'hri_value'       => $predictions->has($hive->id) ? (float) $predictions->get($hive->id)->hri_value : null,
            'confidence_pct'  => $predictions->has($hive->id) ? (int) round((float) $predictions->get($hive->id)->confidence_score * 100) : null,
        ])->values()->all();
    }

    private function readinessTrends(Collection $hiveIds): array
    {
        return HriSummary::whereIn('hive_id', $hiveIds)
            ->where('summary_date', '>=', now()->subDays(30)->toDateString())
            ->with('hive')
            ->orderBy('summary_date')
            ->get()
            ->map(fn ($summary) => [
                'hive_id'      => $summary->hive_id,
                'hive_name'    => $summary->hive?->name,
                'summary_date' => $summary->summary_date,
                'date'         => Carbon::parse($summary->summary_date)->format('M d'),
                'avg_hri_pct'  => (int) round((float) ($summary->avg_hri_value ?? 0) * 100),
            ])
            ->values()
            ->all();
    }
}
