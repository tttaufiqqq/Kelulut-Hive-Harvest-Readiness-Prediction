<?php

namespace App\Http\Controllers;

use App\Events\SensorReadingCreated;
use App\Models\IotNode;
use App\Models\SensorLog;
use App\Services\MlPredictionService;
use App\Services\PredictionRunResult;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class SensorController extends Controller
{
    public function __construct(private MlPredictionService $mlService) {}

    public function store(Request $request)
    {
        if ($request->header('X-API-Key') !== config('app.iot_api_key')) {
            return response()->json(['error' => 'Unauthorized'], 401);
        }

        $data = $this->validateSensorPayload($request);
        $node = $this->findActiveNode($data['device_id'], $data['hive_id']);

        if (! $node) {
            return response()->json(['error' => 'Device not registered'], 404);
        }

        $log = $this->storeSensorLog($data, $node);
        $this->dispatchSensorReadingCreated($log);
        $this->matchThresholds($log, $data);

        $this->mlService->predict($log);

        return response()->json(['status' => 'ok'], 201);
    }

    public function testTelegramReady(Request $request)
    {
        if (! $this->hasValidInternalTestSecret($request)) {
            return response()->json([
                'error' => 'Unauthorized',
                'message' => 'Internal diagnostic endpoint requires a valid X-Test-Secret header.',
            ], 401);
        }

        $data = $this->validateSensorPayload($request, true);
        $node = $this->findActiveNode($data['device_id'], $data['hive_id']);

        if (! $node) {
            return response()->json([
                'error' => 'Device not registered',
                'message' => 'Internal diagnostic endpoint only accepts an active device and hive pairing.',
            ], 404);
        }

        $log = $this->storeSensorLog($data, $node);
        $this->dispatchSensorReadingCreated($log);
        $this->matchThresholds($log, $data);

        if ($data['mode'] !== 'full_pipeline') {
            return response()->json([
                'message' => 'Internal diagnostic sensor log stored. Synthetic prediction wiring will be added in the next phase.',
                'mode' => $data['mode'],
                'sensor_log_id' => $log->id,
            ], 202);
        }

        $result = $this->mlService->runPrediction($log);

        if (! $result->hasPrediction()) {
            return response()->json([
                'message' => 'Internal diagnostic full-pipeline run could not create a prediction because ML was unavailable.',
                'mode' => $data['mode'],
                ...$this->formatPredictionRunResult($result),
            ], 503);
        }

        if (! $result->isReady()) {
            return response()->json([
                'message' => 'Internal diagnostic full-pipeline run created a prediction, but the final guarded readiness was not ready.',
                'mode' => $data['mode'],
                ...$this->formatPredictionRunResult($result),
            ], 409);
        }

        return response()->json([
            'message' => 'Internal diagnostic full-pipeline run created a ready prediction and queued the Telegram alert job.',
            'mode' => $data['mode'],
            ...$this->formatPredictionRunResult($result),
        ], 201);
    }

    private function hasValidInternalTestSecret(Request $request): bool
    {
        $expectedSecret = (string) config('services.telegram.test_secret');
        $providedSecret = (string) $request->header('X-Test-Secret');

        return $expectedSecret !== '' && $providedSecret !== '' && hash_equals($expectedSecret, $providedSecret);
    }

    private function validateSensorPayload(Request $request, bool $includeMode = false): array
    {
        $rules = [
            'device_id' => 'required|string',
            'hive_id' => 'required|integer|exists:hives,id',
            'temp' => 'required|numeric|between:-10,60',
            'humidity' => 'required|numeric|between:0,100',
            'mq2_value' => 'required|integer|between:0,4095',
            'mq3_value' => 'required|integer|between:0,4095',
            'mq5_value' => 'required|integer|between:0,4095',
            'mq135_value' => 'required|integer|between:0,4095',
        ];

        if ($includeMode) {
            $rules['mode'] = 'required|string|in:full_pipeline,synthetic_ready';
        }

        return $request->validate($rules);
    }

    private function findActiveNode(string $deviceId, int $hiveId): ?IotNode
    {
        return IotNode::where('device_id', $deviceId)
            ->where('hive_id', $hiveId)
            ->where('device_status', 'active')
            ->first();
    }

    private function storeSensorLog(array $data, IotNode $node): SensorLog
    {
        return SensorLog::create([
            'hive_id' => $data['hive_id'],
            'device_id' => $node->id,
            'temp' => $data['temp'],
            'humidity' => $data['humidity'],
            'mq2_value' => $data['mq2_value'],
            'mq3_value' => $data['mq3_value'],
            'mq5_value' => $data['mq5_value'],
            'mq135_value' => $data['mq135_value'],
            'record_timestamp' => now(),
        ]);
    }

    private function dispatchSensorReadingCreated(SensorLog $log): void
    {
        SensorReadingCreated::dispatch(
            $log->hive_id,
            $log->id,
            $log->record_timestamp->toIso8601String(),
        );
    }

    private function matchThresholds(SensorLog $log, array $data): void
    {
        try {
            $thresholds = DB::table('master_sensor_thresholds')->get();

            $sensorMap = [
                'temp' => $data['temp'],
                'humidity' => $data['humidity'],
                'mq2' => $data['mq2_value'],
                'mq3' => $data['mq3_value'],
                'mq5' => $data['mq5_value'],
                'mq135' => $data['mq135_value'],
            ];

            $matched = $thresholds->filter(function ($threshold) use ($sensorMap) {
                $reading = $sensorMap[$threshold->sensor_type] ?? null;

                return $reading !== null
                    && $reading >= $threshold->min_value
                    && $reading <= $threshold->max_value;
            })->map(fn ($threshold) => [
                'sensor_log_id' => $log->id,
                'threshold_id' => $threshold->id,
            ])->values()->all();

            if (! empty($matched)) {
                DB::table('sensor_log_thresholds')->insert($matched);
            }
        } catch (\Throwable $e) {
            Log::warning('Threshold matching failed', [
                'error' => $e->getMessage(),
                'sensor_log_id' => $log->id,
            ]);
        }
    }

    private function formatPredictionRunResult(PredictionRunResult $result): array
    {
        return $result->toArray();
    }
}
