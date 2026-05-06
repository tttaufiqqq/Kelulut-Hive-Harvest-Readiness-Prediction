<?php

namespace App\Services;

use App\Models\Prediction;

class PredictionRunResult
{
    public function __construct(
        public readonly int $sensorLogId,
        public readonly ?Prediction $prediction,
        public readonly string $outcome,
        public readonly string $telegramDispatch,
        public readonly ?string $failureReason = null,
    ) {}

    public static function mlUnavailable(int $sensorLogId, string $failureReason): self
    {
        return new self(
            sensorLogId: $sensorLogId,
            prediction: null,
            outcome: 'ml_unavailable',
            telegramDispatch: 'not_attempted',
            failureReason: $failureReason,
        );
    }

    public static function predictionCreated(Prediction $prediction, string $telegramDispatch): self
    {
        return new self(
            sensorLogId: $prediction->sensor_log_id,
            prediction: $prediction,
            outcome: 'prediction_created',
            telegramDispatch: $telegramDispatch,
        );
    }

    public function hasPrediction(): bool
    {
        return $this->prediction !== null;
    }

    public function isReady(): bool
    {
        return $this->prediction?->readiness_level === 'ready';
    }

    public function toArray(): array
    {
        return [
            'sensor_log_id' => $this->sensorLogId,
            'prediction_id' => $this->prediction?->id,
            'readiness_level' => $this->prediction?->readiness_level,
            'raw_readiness_level' => $this->prediction?->raw_readiness_level,
            'warning_state' => $this->prediction?->warning_state,
            'guardrail_action' => $this->prediction?->guardrail_action,
            'telegram_dispatch' => $this->telegramDispatch,
            'failure_reason' => $this->failureReason,
        ];
    }
}
