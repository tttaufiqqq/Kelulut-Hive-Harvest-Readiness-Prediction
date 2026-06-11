<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Hive;
use App\Models\SensorLog;
use App\Support\SensorReadings;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class SensorDashboardController extends Controller
{
    public function index(Request $request)
    {
        $hives = Hive::select('id', 'name')->orderBy('name')->get();

        $hiveId = $request->integer('hive_id') ?: $hives->first()?->id;

        $window = in_array($request->input('window'), ['1h', '6h', '24h'])
            ? $request->input('window')
            : '1h';

        $date = $request->input('date'); // nullable Y-m-d — overrides window when set

        $query = SensorLog::where('hive_id', $hiveId)
            ->orderBy('record_timestamp')
            ->select('temp', 'humidity', 'mq2_value', 'mq3_value', 'mq5_value', 'mq135_value', 'record_timestamp');

        if ($date && preg_match('/^\d{4}-\d{2}-\d{2}$/', $date)) {
            $day = Carbon::parse($date);
            $hours = match ($window) {
                '6h' => 6,
                '24h' => 24,
                default => 1,
            };
            $query->whereBetween('record_timestamp', [
                $day->copy()->endOfDay()->subHours($hours),
                $day->copy()->endOfDay(),
            ]);
        } else {
            $since = match ($window) {
                '6h' => now()->subHours(6),
                '24h' => now()->subHours(24),
                default => now()->subHour(),
            };
            $query->where('record_timestamp', '>=', $since);
        }

        $logs = $query->limit(500)->get();

        $latest = $logs->last();

        $lastSeenRaw = SensorLog::where('hive_id', $hiveId)->max('record_timestamp');
        $lastSeen = $lastSeenRaw ? Carbon::parse($lastSeenRaw)->diffForHumans() : null;

        $history = $logs->map(fn ($log) => [
            'time' => $log->record_timestamp->format('H:i'),
            'temperature' => $log->temp !== null ? round($log->temp, 1) : null,
            'humidity' => $log->humidity !== null ? round($log->humidity, 1) : null,
            'mq2' => $log->mq2_value,
            'mq3' => $log->mq3_value,
            'mq5' => $log->mq5_value,
            'mq135' => $log->mq135_value,
        ])->values();
        $latestReadings = SensorReadings::fromLog($latest);

        return Inertia::render('admin/sensors', [
            'hives' => $hives,
            'selected' => $hiveId,
            'window' => $window,
            'date' => $date ?? null,
            'latest' => $latest ? [
                'temperature' => ($latestReadings['temp'] ?? null) !== null ? round((float) $latestReadings['temp'], 1) : null,
                'humidity' => ($latestReadings['humidity'] ?? null) !== null ? round((float) $latestReadings['humidity'], 1) : null,
                'mq2' => ($latestReadings['mq2_value'] ?? null) !== null ? (int) $latestReadings['mq2_value'] : null,
                'mq3' => ($latestReadings['mq3_value'] ?? null) !== null ? (int) $latestReadings['mq3_value'] : null,
                'mq5' => ($latestReadings['mq5_value'] ?? null) !== null ? (int) $latestReadings['mq5_value'] : null,
                'mq135' => ($latestReadings['mq135_value'] ?? null) !== null ? (int) $latestReadings['mq135_value'] : null,
                'recorded_at' => $latest->record_timestamp->diffForHumans(),
            ] : null,
            'history' => $history,
            'last_seen' => $lastSeen,
        ]);
    }

    public function dailyHistory(Hive $hive): JsonResponse
    {
        $rows = DB::table('vw_hive_sensor_daily_avg')
            ->where('hive_id', $hive->id)
            ->orderByDesc('reading_date')
            ->limit(14)
            ->get();

        return response()->json([
            'hive_name' => $hive->name,
            'days' => $rows->map(fn ($r) => [
                'date'          => $r->reading_date,
                'avg_temp'      => round((float) $r->avg_temp, 1),
                'avg_humidity'  => round((float) $r->avg_humidity, 1),
                'avg_mq2'       => round((float) $r->avg_mq2, 1),
                'avg_mq3'       => round((float) $r->avg_mq3, 1),
                'avg_mq5'       => round((float) $r->avg_mq5, 1),
                'avg_mq135'     => round((float) $r->avg_mq135, 1),
                'avg_hri_pct'   => round((float) $r->avg_hri_value * 100, 1),
                'reading_count' => (int) $r->reading_count,
            ])->all(),
        ]);
    }
}
