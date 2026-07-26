<?php

namespace App\Http\Controllers;

use App\Models\Hive;
use App\Models\Prediction;
use App\Models\SensorLog;
use App\Services\BuildWeeklyPredictionTrendService;
use App\Services\FormatPredictionService;
use App\Services\FormatPredictionTrendService;
use App\Support\CalendarWeeks;
use App\Support\SensorReadings;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Inertia\Inertia;

class PredictionController extends Controller
{
    public function __construct(
        private readonly FormatPredictionService $formatter,
        private readonly FormatPredictionTrendService $trendFormatter,
        private readonly BuildWeeklyPredictionTrendService $weeklyTrendBuilder,
    ) {}

    public function show(Request $request, Hive $hive)
    {
        abort_if($hive->beekeeper_id !== auth()->id(), 403);

        $baseQuery = Prediction::query()
            ->with([
                'sensorLog' => fn ($query) => $query->select([
                    'id',
                    'hive_id',
                    'device_id',
                    'temp',
                    'humidity',
                    'mq2_value',
                    'mq3_value',
                    'mq5_value',
                    'mq135_value',
                    'record_timestamp',
                ]),
                'sensorLog.iotNode:id,node_identifier',
                'sensorLog.matchedThresholds:id,sensor_type,min_value,max_value,level,meaning,recommended_action',
            ])
            ->whereHas('sensorLog', fn ($query) => $query->where('hive_id', $hive->id));

        $latestPrediction = (clone $baseQuery)
            ->orderByDesc('predictions.prediction_timestamp')
            ->first();
        $defaultChartDate = Carbon::today();
        $defaultChartMonth = Carbon::today()->startOfMonth();
        $defaultChartWeek = CalendarWeeks::weekNumberFor(Carbon::today());

        $filterType = $request->string('filter_type', 'date')->value();
        $chartDate = $request->date('chart_date') ?? $defaultChartDate;
        $chartMonth = $request->date('chart_month') ?? $defaultChartMonth;
        $chartWeek = (int) $request->integer('chart_week', $defaultChartWeek);
        $weekRange = CalendarWeeks::range($chartMonth, $chartWeek);

        $historyQuery = (clone $baseQuery)
            ->orderByDesc('predictions.prediction_timestamp');

        if ($latestPrediction) {
            $historyQuery->whereKeyNot($latestPrediction->id);
        }

        $historyPredictions = $historyQuery
            ->paginate(5)
            ->withQueryString()
            ->through(fn (Prediction $prediction) => $this->formatter->execute($prediction));

        $predictionTrends = $filterType === 'week'
            ? $this->weeklyTrendBuilder->execute($hive, $weekRange['start'], $weekRange['end'])
            : (clone $baseQuery)
                ->whereDate('predictions.prediction_timestamp', $chartDate)
                ->orderByDesc('predictions.prediction_timestamp')
                ->limit(24)
                ->get()
                ->reverse()
                ->values()
                ->map(fn (Prediction $prediction) => $this->trendFormatter->execute($prediction, $chartDate));

        $latestSensorLog = SensorLog::where('hive_id', $hive->id)
            ->latest('record_timestamp')
            ->first(['temp', 'humidity', 'mq2_value', 'mq3_value', 'mq5_value', 'mq135_value']);

        $sensorWarnings = $latestSensorLog
            ? SensorReadings::missingLabels(SensorReadings::fromLog($latestSensorLog))
            : [];

        return Inertia::render('predictions/index', [
            'hive'               => ['id' => $hive->id, 'name' => $hive->name],
            'latestPrediction'   => $latestPrediction
                ? $this->formatter->execute($latestPrediction)
                : null,
            'predictionTrends'   => $predictionTrends,
            'historyPredictions' => $historyPredictions,
            'sensorWarnings'     => $sensorWarnings,
            'filters'            => [
                'page'                => (int) $request->integer('page', 1),
                'filter_type'         => $filterType,
                'chart_date'          => Carbon::parse($chartDate)->toDateString(),
                'default_chart_date'  => Carbon::parse($defaultChartDate)->toDateString(),
                'chart_month'         => Carbon::parse($chartMonth)->format('Y-m'),
                'default_chart_month' => Carbon::parse($defaultChartMonth)->format('Y-m'),
                'chart_week'          => $weekRange['week'],
                'default_chart_week'  => $defaultChartWeek,
            ],
        ]);
    }
}
