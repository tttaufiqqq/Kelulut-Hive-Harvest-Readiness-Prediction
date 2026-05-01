<?php

namespace App\Http\Controllers;

use App\Models\IotNode;
use App\Models\SensorLog;
use App\Services\MlPredictionService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class SensorController extends Controller
{
    public function __construct(private MlPredictionService $mlService) {}

    public function store(Request $request)
    {
        // ── Auth ──────────────────────────────────────────────────
        if ($request->header('X-API-Key') !== config('app.iot_api_key')) {
            return response()->json(['error' => 'Unauthorized'], 401);
        }

        // ── Validate ──────────────────────────────────────────────
        $data = $request->validate([
            'device_id'   => 'required|string',
            'hive_id'     => 'required|integer|exists:hives,id',
            'temp'        => 'required|numeric|between:-10,60',
            'humidity'    => 'required|numeric|between:0,100',
            'mq2_value'   => 'required|integer|between:0,4095',
            'mq3_value'   => 'required|integer|between:0,4095',
            'mq5_value'   => 'required|integer|between:0,4095',
            'mq135_value' => 'required|integer|between:0,4095',
        ]);

        // ── Resolve IoT Node ──────────────────────────────────────
        $node = IotNode::where('device_id',     $data['device_id'])
                       ->where('hive_id',        $data['hive_id'])
                       ->where('device_status', 'active')
                       ->first();

        if (!$node) {
            return response()->json(['error' => 'Device not registered'], 404);
        }

        // ── Store sensor log ──────────────────────────────────────
        $log = SensorLog::create([
            'hive_id'          => $data['hive_id'],
            'device_id'        => $node->id,
            'temp'             => $data['temp'],
            'humidity'         => $data['humidity'],
            'mq2_value'        => $data['mq2_value'],
            'mq3_value'        => $data['mq3_value'],
            'mq5_value'        => $data['mq5_value'],
            'mq135_value'      => $data['mq135_value'],
            'record_timestamp' => now(),
        ]);

        // ── Threshold matching (non-blocking) ────────────────────
        try {
            $thresholds = DB::table('master_sensor_thresholds')->get();

            $sensorMap = [
                'temp'     => $data['temp'],
                'humidity' => $data['humidity'],
                'mq2'      => $data['mq2_value'],
                'mq3'      => $data['mq3_value'],
                'mq5'      => $data['mq5_value'],
                'mq135'    => $data['mq135_value'],
            ];

            $matched = $thresholds->filter(function ($t) use ($sensorMap) {
                $reading = $sensorMap[$t->sensor_type] ?? null;
                return $reading !== null
                    && $reading >= $t->min_value
                    && $reading <= $t->max_value;
            })->map(fn ($t) => [
                'sensor_log_id' => $log->id,
                'threshold_id'  => $t->id,
            ])->values()->all();

            if (!empty($matched)) {
                DB::table('sensor_log_thresholds')->insert($matched);
            }
        } catch (\Throwable $e) {
            Log::warning('Threshold matching failed', [
                'error'         => $e->getMessage(),
                'sensor_log_id' => $log->id,
            ]);
        }

        // ── ML Prediction (non-blocking — skipped silently if Flask down) ──
        $this->mlService->predict($log);

        return response()->json(['status' => 'ok'], 201);
    }
}
