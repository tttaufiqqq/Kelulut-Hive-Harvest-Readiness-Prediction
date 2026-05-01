<?php

namespace App\Http\Controllers;

use App\Models\Harvest;
use App\Models\Hive;
use App\Models\Prediction;
use App\Models\SensorLog;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Inertia\Inertia;

class AnalyticsController extends Controller
{
    public function show(Request $request, Hive $hive)
    {
        abort_if($hive->beekeeper_id !== auth()->id(), 403);

        // ── HRI trend: last 30 days, one reading per day (latest per day) ──────
        $hriTrend = HriRecord::where('hive_id', $hive->id)
            ->where('computed_at', '>=', now()->subDays(30))
            ->selectRaw('DATE(computed_at) as date, AVG(hri_score) as hri_score')
            ->groupByRaw('DATE(computed_at)')
            ->orderBy('date')
            ->get()
            ->map(function ($row) {
                return [
                    'date'      => \Carbon\Carbon::parse($row->date)->format('M d'),
                    'hri_score' => round($row->hri_score),
                    'avg_7d'    => 0, // filled below
                ];
            });

        // 7-day rolling avg overlay
        $avg7d = HriRecord::where('hive_id', $hive->id)
            ->where('computed_at', '>=', now()->subDays(7))
            ->avg('hri_score');

        $hriTrend = $hriTrend->map(fn($row) => array_merge($row, [
            'avg_7d' => round($avg7d ?? 0),
        ]));

        // ── Sensor readings: today, one row per hour ──────────────────────────
        $sensorReadings = SensorLog::where('hive_id', $hive->id)
            ->where('recorded_at', '>=', now()->startOfDay())
            ->selectRaw('
                DATE_FORMAT(recorded_at, "%H:00") as time,
                AVG(temp)     as temp,
                AVG(humidity) as humidity,
                AVG(co2_adc)  as co2,
                AVG(etoh_adc) as etoh,
                AVG(ch4_adc)  as ch4,
                AVG(smoke_adc) as smoke
            ')
            ->groupByRaw('DATE_FORMAT(recorded_at, "%H:00")')
            ->orderBy('time')
            ->get()
            ->map(fn($r) => [
                'time'     => $r->time,
                'temp'     => round($r->temp, 1),
                'humidity' => round($r->humidity, 1),
                'co2'      => round($r->co2),
                'etoh'     => round($r->etoh),
                'ch4'      => round($r->ch4),
                'smoke'    => round($r->smoke),
            ]);

        // ── Score components: latest HRI record ───────────────────────────────
        $latest = HriRecord::where('hive_id', $hive->id)
            ->latest('computed_at')
            ->first();

        $scoreComponents = $latest ? [
            ['sensor' => 'Humidity', 'score' => $latest->s_hum,  'max' => 20],
            ['sensor' => 'Temp',     'score' => $latest->s_temp, 'max' => 20],
            ['sensor' => 'EtOH',     'score' => $latest->s_etoh, 'max' => 20],
            ['sensor' => 'CO₂',      'score' => $latest->s_co2,  'max' => 20],
            ['sensor' => 'CH₄',      'score' => $latest->s_ch4,  'max' => 10],
            ['sensor' => 'Smoke',    'score' => $latest->s_mq2,  'max' => 10],
        ] : [];

        // ── Harvest history ───────────────────────────────────────────────────
        $harvestHistory = $hive->harvests()
            ->orderBy('harvest_dt')
            ->get(['harvest_dt', 'qty_ml', 'hri_at_hvst'])
            ->map(fn($h) => [
                'date'           => \Carbon\Carbon::parse($h->harvest_dt)->format('M d'),
                'qty_ml'         => $h->qty_ml,
                'hri_at_harvest' => $h->hri_at_hvst,
            ]);

        // ── Hive summary ──────────────────────────────────────────────────────
        $summary = $hive->hiveSummary;

        return Inertia::render('analytics', [
            'hive' => [
                'id'               => $hive->id,
                'name'             => $hive->name,
                'latest_hri_score' => $summary?->latest_hri_score ?? 0,
                'latest_category'  => $summary?->latest_category  ?? 'Poor',
                'avg_hri_7d'       => $summary ? round($avg7d ?? 0) : 0,
                'avg_hri_30d'      => $summary?->avg_hri_30d ?? 0,
                'total_harvests'   => $summary?->total_harvests ?? 0,
                'last_harvest_dt'  => $summary?->last_harvest_dt,
            ],
            'hriTrend'       => $hriTrend,
            'sensorReadings' => $sensorReadings,
            'scoreComponents' => $scoreComponents,
            'harvestHistory' => $harvestHistory,
        ]);
    }
}
