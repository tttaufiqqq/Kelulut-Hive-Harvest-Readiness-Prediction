<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Harvest;
use App\Models\Hive;
use Illuminate\Http\Request;
use Inertia\Inertia;

class HarvestController extends Controller
{
    public function index(Request $request)
    {
        $harvests = Harvest::with(['hive', 'beekeeper', 'color', 'flavor'])
            ->when($request->hive_id, fn ($q) => $q->where('hive_id', $request->hive_id))
            ->when($request->productivity, fn ($q) => $q->where('productivity_level', $request->productivity))
            ->latest('harvest_date')
            ->paginate(20);

        $stats = [
            'total' => Harvest::count(),
            'total_weight' => round((float) Harvest::sum('weight'), 2),
            'avg_weight' => round((float) Harvest::avg('weight'), 2),
        ];

        $hives = Hive::orderBy('name')->select('id', 'name')->get();

        return Inertia::render('admin/harvests/index', [
            'harvests' => $harvests,
            'stats' => $stats,
            'hives' => $hives,
            'filters' => ['hive_id' => $request->hive_id, 'productivity' => $request->productivity],
        ]);
    }
}
