<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Hive;
use App\Models\SensorLog;
use Carbon\Carbon;
use Illuminate\Http\Request;
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
                '6h'  => 6,
                '24h' => 24,
                default => 1,
            };
            $query->whereBetween('record_timestamp', [
                $day->copy()->endOfDay()->subHours($hours),
                $day->copy()->endOfDay(),
            ]);
        } else {
            $since = match ($window) {
                '6h'  => now()->subHours(6),
                '24h' => now()->subHours(24),
                default => now()->subHour(),
            };
            $query->where('record_timestamp', '>=', $since);
        }

        $logs = $query->limit(500)->get();

        $latest = $logs->last();

        $lastSeenRaw = SensorLog::where('hive_id', $hiveId)->max('record_timestamp');
        $lastSeen    = $lastSeenRaw ? Carbon::parse($lastSeenRaw)->diffForHumans() : null;

        $history = $logs->map(fn ($log) => [
            'time'        => $log->record_timestamp->format('H:i'),
            'temperature' => round($log->temp, 1),
            'humidity'    => round($log->humidity, 1),
            'mq2'         => $log->mq2_value,
            'mq3'         => $log->mq3_value,
            'mq5'         => $log->mq5_value,
            'mq135'       => $log->mq135_value,
        ])->values();

        return Inertia::render('admin/sensors', [
            'hives'    => $hives,
            'selected' => $hiveId,
            'window'   => $window,
            'date'     => $date ?? null,
            'latest'   => $latest ? [
                'temperature' => round($latest->temp, 1),
                'humidity'    => round($latest->humidity, 1),
                'mq2'         => $latest->mq2_value,
                'mq3'         => $latest->mq3_value,
                'mq5'         => $latest->mq5_value,
                'mq135'       => $latest->mq135_value,
                'recorded_at' => $latest->record_timestamp->diffForHumans(),
            ] : null,
            'history'   => $history,
            'last_seen' => $lastSeen,
        ]);
    }
}
