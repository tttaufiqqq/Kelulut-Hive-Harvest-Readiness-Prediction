<?php

namespace App\Http\Controllers\Admin;

use App\Enums\AppErrorCode;
use App\Http\Controllers\Controller;
use App\Models\Hive;
use App\Models\HriSummary;
use App\Models\User;
use App\Services\Admin\DashboardDataService;
use App\Support\SafeSection;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class DashboardController extends Controller
{
    public function __construct(private readonly DashboardDataService $dashboardData) {}

    public function index()
    {
        $stats = User::role('beekeeper')
            ->selectRaw("COUNT(*) as total, SUM(status = 'pending') as pending, SUM(status = 'active') as active")
            ->first();

        $result = $this->dashboardData->execute();

        $fleetHriTrend = SafeSection::execute(
            'admin.dashboard.fleet_hri_trend',
            fn () => array_map(fn ($row) => (array) $row, DB::select('CALL sp_fleet_hri_trend(?)', [180])),
            [],
            AppErrorCode::UnexpectedError,
        );

        return Inertia::render('admin/dashboard', [
            'stats'               => [
                'total'   => (int) $stats->total,
                'pending' => (int) $stats->pending,
                'active'  => (int) $stats->active,
            ],
            'hives'               => $result['hives'],
            'productivityRanking' => $result['productivityRanking'],
            'crossSiteComparison' => $result['crossSiteComparison'],
            'fleetHriTrend'       => $fleetHriTrend,
        ]);
    }

    public function readinessSnapshot(Request $request): JsonResponse
    {
        $date = $request->input('date');

        if (! $date || ! Carbon::canBeCreatedFromFormat($date, 'Y-m-d')) {
            return response()->json(['has_data' => false, 'data' => []], 422);
        }

        $parsedDate = Carbon::createFromFormat('Y-m-d', $date)->startOfDay();

        if ($parsedDate->isFuture()) {
            return response()->json(['has_data' => false, 'data' => []], 422);
        }

        $totalHives = Hive::count();

        $rows = HriSummary::whereDate('summary_date', $parsedDate)
            ->whereNotNull('latest_readiness_level')
            ->select(['latest_readiness_level'])
            ->get();

        if ($rows->isEmpty()) {
            return response()->json([
                'has_data' => false,
                'data'     => [['level' => 'no_data', 'count' => $totalHives]],
            ]);
        }

        $counts = [];
        foreach ($rows as $row) {
            $level = $row->latest_readiness_level;
            $counts[$level] = ($counts[$level] ?? 0) + 1;
        }

        $data = array_map(
            fn ($level, $count) => ['level' => $level, 'count' => $count],
            array_keys($counts),
            array_values($counts),
        );

        return response()->json(['has_data' => true, 'data' => $data]);
    }

    public function hiveMonitorSnapshot(Request $request): JsonResponse
    {
        $date = $request->input('date');

        if (! $date || ! Carbon::canBeCreatedFromFormat($date, 'Y-m-d')) {
            return response()->json(['has_data' => false, 'data' => []], 422);
        }

        $parsedDate = Carbon::createFromFormat('Y-m-d', $date)->startOfDay();

        if ($parsedDate->isFuture()) {
            return response()->json(['has_data' => false, 'data' => []], 422);
        }

        $result = $this->dashboardData->execute($parsedDate);
        $data = $result['hives'];
        $hasData = collect($data)->contains(fn ($hive) => $hive['status'] !== 'no_data');

        return response()->json(['has_data' => $hasData, 'data' => $data]);
    }
}
