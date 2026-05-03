<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Hive;
use App\Models\Inspection;
use Illuminate\Http\Request;
use Inertia\Inertia;

class InspectionController extends Controller
{
    public function index(Request $request)
    {
        $inspections = Inspection::with(['hive', 'beekeeper', 'weatherConditions'])
            ->when($request->hive_id, fn($q) => $q->where('hive_id', $request->hive_id))
            ->latest('inspection_date')
            ->paginate(20);

        $stats = [
            'total' => Inspection::count(),
        ];

        $hives = Hive::orderBy('name')->select('id', 'name')->get();

        return Inertia::render('admin/inspections/index', [
            'inspections' => $inspections,
            'stats'       => $stats,
            'hives'       => $hives,
            'filters'     => ['hive_id' => $request->hive_id],
        ]);
    }
}
