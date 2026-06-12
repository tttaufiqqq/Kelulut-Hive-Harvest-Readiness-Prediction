<?php

namespace App\Services;

use App\Events\SensorReadingCreated;
use App\Models\IotNode;
use App\Models\SensorLog;
use Illuminate\Support\Facades\DB;

class SensorIngestionService
{
    public function execute(array $data, IotNode $node): SensorLog
    {
        return $this->storeSensorReading($data, $node);
    }

    private function storeSensorReading(array $data, IotNode $node): SensorLog
    {
        return DB::transaction(function () use ($data, $node) {
            $log = $this->storeSensorLog($data, $node);
            $this->matchThresholds($log, $data);
            $this->dispatchSensorReadingCreated($log);

            return $log;
        });
    }

    private function storeSensorLog(array $data, IotNode $node): SensorLog
    {
        return SensorLog::create([
            'hive_id'          => $data['hive_id'],
            'device_id'        => $node->id,
            'temp'             => $data['temp'] ?? null,
            'humidity'         => $data['humidity'] ?? null,
            'mq2_value'        => $data['mq2_value'] ?? null,
            'mq3_value'        => $data['mq3_value'] ?? null,
            'mq5_value'        => $data['mq5_value'] ?? null,
            'mq135_value'      => $data['mq135_value'] ?? null,
            'record_timestamp' => now(),
        ]);
    }

    private function matchThresholds(SensorLog $log, array $data): void
    {
        $thresholds = DB::table('master_sensor_thresholds')->get();

        $sensorMap = [
            'temp'     => $data['temp'] ?? null,
            'humidity' => $data['humidity'] ?? null,
            'mq2'      => $data['mq2_value'] ?? null,
            'mq3'      => $data['mq3_value'] ?? null,
            'mq5'      => $data['mq5_value'] ?? null,
            'mq135'    => $data['mq135_value'] ?? null,
        ];

        $matched = $thresholds->filter(function ($threshold) use ($sensorMap) {
            $reading = $sensorMap[$threshold->sensor_type] ?? null;

            return $reading !== null
                && $reading >= $threshold->min_value
                && $reading <= $threshold->max_value;
        })->map(fn ($threshold) => [
            'sensor_log_id' => $log->id,
            'threshold_id'  => $threshold->id,
        ])->values()->all();

        if (! empty($matched)) {
            DB::table('sensor_log_thresholds')->insert($matched);
        }
    }

    private function dispatchSensorReadingCreated(SensorLog $log): void
    {
        SensorReadingCreated::dispatch(
            $log->hive_id,
            $log->id,
            $log->record_timestamp->toIso8601String(),
        );
    }
}
