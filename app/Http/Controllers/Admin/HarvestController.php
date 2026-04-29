<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Harvest;
use Inertia\Inertia;

class HarvestController extends Controller
{
    public function index()
    {
        $harvests = Harvest::with(['hive', 'beekeeper', 'color', 'flavor'])
            ->latest('harvest_date')
            ->paginate(20);

        $stats = [
            'total'        => Harvest::count(),
            'total_weight' => round((float) Harvest::sum('weight'), 2),
            'avg_weight'   => round((float) Harvest::avg('weight'), 2),
        ];

        return Inertia::render('admin/harvests/index', [
            'harvests' => $harvests,
            'stats'    => $stats,
        ]);
    }
}
