<?php

namespace App\Http\Controllers;

use App\Models\Hive;
use App\Services\HiveAnalyticsService;
use Illuminate\Http\Request;
use Inertia\Inertia;

class AnalyticsController extends Controller
{
    public function __construct(private readonly HiveAnalyticsService $analytics) {}

    public function show(Request $request, Hive $hive)
    {
        abort_if($hive->beekeeper_id !== auth()->id(), 403);

        return Inertia::render('analytics', $this->analytics->execute($hive, $request));
    }
}
