<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Inspection;
use Inertia\Inertia;

class InspectionController extends Controller
{
    public function index()
    {
        $inspections = Inspection::with(['hive', 'beekeeper', 'weatherConditions'])
            ->latest('inspection_date')
            ->paginate(20);

        $stats = [
            'total' => Inspection::count(),
        ];

        return Inertia::render('admin/inspections/index', [
            'inspections' => $inspections,
            'stats'       => $stats,
        ]);
    }
}
