<?php

namespace App\Http\Controllers;

use App\Models\Hive;
use App\Models\HriSummary;
use App\Models\Prediction;
use Carbon\Carbon;
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
        ]);
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
                'date' => Carbon::parse($s->summary_date)->format('M d'),
                'avg_hri_pct' => (int) round((float) ($s->avg_hri_value ?? 0) * 100),
            ])
            ->values()
            ->all();
    }
}
