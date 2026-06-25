<?php

namespace App\Support;

use App\Models\SensorLog;

class SensorReadings
{
    public const FIELD_LABELS = [
        'temp' => 'Temperature',
        'humidity' => 'Humidity',
        'mq2_value' => 'MQ-2',
        'mq3_value' => 'MQ-3',
        'mq5_value' => 'MQ-5',
        'mq135_value' => 'MQ-135',
    ];

    public static function normalize(array $readings): array
    {
        foreach (self::FIELD_LABELS as $field => $_label) {
            if (array_key_exists($field, $readings)) {
                $readings[$field] = self::normalizeValue($readings[$field]);
            }
        }

        return $readings;
    }

    public static function fromLog(?SensorLog $log): array
    {
        if (! $log) {
            return [];
        }

        return self::normalize([
            'temp' => $log->temp,
            'humidity' => $log->humidity,
            'mq2_value' => $log->mq2_value,
            'mq3_value' => $log->mq3_value,
            'mq5_value' => $log->mq5_value,
            'mq135_value' => $log->mq135_value,
        ]);
    }

    public static function missingLabels(array $readings): array
    {
        $normalized = self::normalize($readings);

        return collect(self::FIELD_LABELS)
            ->filter(fn ($label, $field) => self::isMissing($normalized[$field] ?? null))
            ->values()
            ->all();
    }

    public static function hasMissing(array $readings): bool
    {
        return self::missingLabels($readings) !== [];
    }

    public static function normalizeValue(mixed $value): mixed
    {
        return self::isMissing($value) ? null : $value;
    }

    public static function isMissing(mixed $value): bool
    {
        if ($value === null) {
            return true;
        }

        if (is_string($value)) {
            return trim($value) === '';
        }

        return false;
    }
}
