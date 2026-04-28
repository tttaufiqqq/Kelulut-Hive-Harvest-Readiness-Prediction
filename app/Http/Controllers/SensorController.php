<?php

namespace App\Http\Controllers;

use App\Models\IotNode;
use App\Models\SensorLog;
use App\Services\MlPredictionService;
use Illuminate\Http\Request;

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
        $node = IotNode::where('device_id', $data['device_id'])
                       ->where('hive_id',   $data['hive_id'])
                       ->where('status',    'active')
                       ->first();

        if (!$node) {
            return response()->json(['error' => 'Device not registered'], 404);
        }

        // ── Store sensor log ──────────────────────────────────────
        $log = SensorLog::create([
            'hive_id'      => $data['hive_id'],
            'iot_node_id'  => $node->id,
            'temp'         => $data['temp'],
            'humidity'     => $data['humidity'],
            'mq2_value'    => $data['mq2_value'],
            'mq3_value'    => $data['mq3_value'],
            'mq5_value'    => $data['mq5_value'],
            'mq135_value'  => $data['mq135_value'],
            'recorded_at'  => now(),
        ]);

        // ── ML Prediction (non-blocking — skipped silently if Flask down)
        $this->mlService->predict($log);

        return response()->json(['status' => 'ok'], 201);
    }
}
