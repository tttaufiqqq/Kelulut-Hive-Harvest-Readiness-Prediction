<?php

namespace App\Http\Controllers;

use App\Models\Hive;
use App\Models\MasterSpecies;
use App\Models\MasterSite;
use Inertia\Inertia;

class DashboardController extends Controller
{
    public function index()
    {
        $hives = Hive::where('beekeeper_id', auth()->id())
            ->with(['species', 'site', 'summary'])
            ->get()
            ->map(fn($hive) => [
                'id'              => $hive->id,
                'name'            => $hive->name,
                'species'         => $hive->species?->name,
                'species_id'      => $hive->species_id,
                'location'        => $hive->site?->name,
                'site_id'         => $hive->site_id,
                'status'          => $hive->status,
                'age_months'      => (int) $hive->created_at->diffInMonths(now()),
                'harvest_count'   => (int) ($hive->summary?->harvest_count ?? 0),
                'readiness_level' => $hive->summary?->latest_readiness_level,
                'hri_value'       => (float) ($hive->summary?->avg_hri_value ?? 0),
                'avg_temperature' => $hive->summary?->avg_temperature,
                'avg_humidity'    => $hive->summary?->avg_humidity,
                'avg_mq2'         => $hive->summary?->avg_mq2,
            ]);

        return Inertia::render('dashboard', [
            'hives'        => $hives,
            'species_list' => MasterSpecies::orderBy('name')->get(['id', 'name']),
            'sites_list'   => MasterSite::orderBy('name')->get(['id', 'name']),
        ]);
    }
}
