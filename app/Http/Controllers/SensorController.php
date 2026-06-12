<?php

namespace App\Http\Controllers;

use App\Enums\AppErrorCode;
use App\Exceptions\AppException;
use App\Models\IotNode;
use App\Models\SensorLog;
use App\Services\MlPredictionService;
use App\Services\PredictionRunResult;
use App\Services\SensorIngestionService;
use App\Support\SensorReadings;
use App\Http\Middleware\AssignRequestId;
use Illuminate\Http\Request;

class SensorController extends Controller
{
    public function __construct(
        private MlPredictionService $mlService,
        private SensorIngestionService $ingestionService,
    ) {}

    public function store(Request $request)
    {
        if ($request->header('X-API-Key') !== config('app.iot_api_key')) {
            throw new AppException(
                AppErrorCode::Unauthorized,
                401,
                'The API key is missing or invalid.',
                'warning',
            );
        }

        $data = SensorReadings::normalize($this->validateSensorPayload($request));
        $node = $this->findActiveNode($data['device_id'], $data['hive_id']);

        if (! $node) {
            throw new AppException(
                AppErrorCode::NotFound,
                404,
                'Device not registered for the selected hive.',
                'warning',
                [
                    'device_id' => $data['device_id'],
                    'hive_id'   => $data['hive_id'],
                ],
            );
        }

        $log = $this->ingestionService->execute($data, $node);
        $result = $this->mlService->runPrediction($log);

        $payload = ['status' => 'ok'];

        if ($warning = $result->toWarning()) {
            $payload['warnings'] = [$warning];
            $payload['meta'] = [
                'request_id' => $request->attributes->get(AssignRequestId::ATTRIBUTE),
            ];
        }

        return response()->json($payload, 201);
    }

    public function testTelegramReady(Request $request)
    {
        if (! $this->hasValidInternalTestSecret($request)) {
            throw new AppException(
                AppErrorCode::Unauthorized,
                401,
                'Internal diagnostic endpoint requires a valid X-Test-Secret header.',
                'warning',
            );
        }

        $data = SensorReadings::normalize($this->validateSensorPayload($request, true));
        $node = $this->findActiveNode($data['device_id'], $data['hive_id']);

        if (! $node) {
            throw new AppException(
                AppErrorCode::NotFound,
                404,
                'Internal diagnostic endpoint only accepts an active device and hive pairing.',
                'warning',
                [
                    'device_id' => $data['device_id'],
                    'hive_id'   => $data['hive_id'],
                ],
            );
        }

        $log = $this->ingestionService->execute($data, $node);

        if ($data['mode'] === 'synthetic_ready') {
            $result = $this->mlService->createSyntheticReadyPrediction($log);

            return response()->json([
                'message' => 'Internal diagnostic synthetic-ready run created a marked ready prediction and queued the Telegram alert job.',
                'mode'    => $data['mode'],
                ...$this->withMeta($request),
                ...$this->formatPredictionRunResult($result),
            ], 201);
        }

        $result = $this->mlService->runPrediction($log);

        if (! $result->hasPrediction()) {
            return response()->json([
                ...$this->errorPayload(
                    $request,
                    AppErrorCode::MlUnavailable,
                    'Internal diagnostic full-pipeline run could not create a prediction because ML was unavailable.',
                ),
                'message' => 'Internal diagnostic full-pipeline run could not create a prediction because ML was unavailable.',
                'mode'    => $data['mode'],
                ...$this->formatPredictionRunResult($result),
            ], 503);
        }

        if (! $result->isReady()) {
            return response()->json([
                ...$this->errorPayload(
                    $request,
                    AppErrorCode::PredictionNotReady,
                    'Internal diagnostic full-pipeline run created a prediction, but the final guarded readiness was not ready.',
                ),
                'message' => 'Internal diagnostic full-pipeline run created a prediction, but the final guarded readiness was not ready.',
                'mode'    => $data['mode'],
                ...$this->formatPredictionRunResult($result),
            ], 409);
        }

        return response()->json([
            'message' => 'Internal diagnostic full-pipeline run created a ready prediction and queued the Telegram alert job.',
            'mode'    => $data['mode'],
            ...$this->withMeta($request),
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
            'device_id'   => 'required|string',
            'hive_id'     => 'required|integer|exists:hives,id',
            'temp'        => 'nullable|numeric|between:-10,60',
            'humidity'    => 'nullable|numeric|between:0,100',
            'mq2_value'   => 'nullable|integer|between:0,4095',
            'mq3_value'   => 'nullable|integer|between:0,4095',
            'mq5_value'   => 'nullable|integer|between:0,4095',
            'mq135_value' => 'nullable|integer|between:0,4095',
        ];

        if ($includeMode) {
            $rules['mode'] = 'required|string|in:full_pipeline,synthetic_ready';
        }

        return $request->validate($rules);
    }

    private function findActiveNode(string $deviceId, int $hiveId): ?IotNode
    {
        return IotNode::where('node_identifier', $deviceId)
            ->where('hive_id', $hiveId)
            ->where('device_status', 'active')
            ->first();
    }

    private function formatPredictionRunResult(PredictionRunResult $result): array
    {
        return $result->toArray();
    }

    private function errorPayload(Request $request, AppErrorCode $errorCode, string $message): array
    {
        return [
            'error' => [
                'code'    => $errorCode->value,
                'message' => $message,
            ],
            ...$this->withMeta($request),
        ];
    }

    private function withMeta(Request $request): array
    {
        return [
            'meta' => [
                'request_id' => $request->attributes->get(AssignRequestId::ATTRIBUTE),
            ],
        ];
    }
}
