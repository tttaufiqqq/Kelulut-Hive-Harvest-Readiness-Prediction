<?php

namespace App\Http\Controllers;

use App\Models\Hive;
use Inertia\Inertia;

class DashboardController extends Controller
{
    public function index()
    {
        $hives = Hive::where('beekeeper_id', auth()->id())
            ->with(['species', 'site', 'summary'])
            ->withCount('harvests')
            ->withMax('harvests', 'harvest_date')
            ->get()
            ->map(fn ($hive) => [
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
                'hri_value' => (float) ($hive->summary?->avg_hri_value ?? 0),
                'avg_temperature' => $hive->summary?->avg_temperature,
                'avg_humidity' => $hive->summary?->avg_humidity,
                'avg_mq2' => $hive->summary?->avg_mq2,
                'avg_mq3' => $hive->summary?->avg_mq3,
                'avg_mq5' => $hive->summary?->avg_mq5,
                'avg_mq135' => $hive->summary?->avg_mq135,
            ]);

        return Inertia::render('dashboard/index', [
            'hives' => $hives->values()->all(),
        ]);
    }
}
