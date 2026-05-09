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
        public readonly ?string $failureMessage = null,
    ) {}

    public static function skipped(int $sensorLogId): self
    {
        return new self(
            sensorLogId: $sensorLogId,
            prediction: null,
            outcome: 'ml_skipped',
            telegramDispatch: 'not_attempted',
        );
    }

    public static function mlUnavailable(int $sensorLogId, string $failureReason, string $failureMessage): self
    {
        return new self(
            sensorLogId: $sensorLogId,
            prediction: null,
            outcome: 'ml_unavailable',
            telegramDispatch: 'not_attempted',
            failureReason: $failureReason,
            failureMessage: $failureMessage,
        );
    }

    public static function processingFailed(int $sensorLogId, string $failureReason, string $failureMessage): self
    {
        return new self(
            sensorLogId: $sensorLogId,
            prediction: null,
            outcome: 'processing_failed',
            telegramDispatch: 'not_attempted',
            failureReason: $failureReason,
            failureMessage: $failureMessage,
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
            'prediction_source' => $this->predictionSource(),
            'telegram_dispatch' => $this->telegramDispatch,
            'failure_reason' => $this->failureReason,
            'failure_message' => $this->failureMessage,
        ];
    }

    public function toWarning(): ?array
    {
        if ($this->failureReason === null || $this->failureMessage === null) {
            return null;
        }

        return [
            'code' => $this->failureReason,
            'message' => $this->failureMessage,
        ];
    }

    public function predictionSource(): ?string
    {
        if (! $this->prediction) {
            return null;
        }

        return str_starts_with((string) $this->prediction->model_version, 'synthetic_diagnostic')
            ? 'synthetic_diagnostic'
            : 'ml_pipeline';
    }
}
