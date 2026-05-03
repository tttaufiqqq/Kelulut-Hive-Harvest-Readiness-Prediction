<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class PredictionSeeder extends Seeder
{
    // Per-hive readiness progression over 90 days (daysAgo: high = older, low = recent)
    // Hive 0: harvested at day 61 → approaching in cycle 2
    // Hive 1: single long cycle → currently ready
    // Hive 2: harvested at day 54 → nearly_ready in cycle 2
    private array $progressions = [
        0 => [
            ['from' => 89, 'to' => 76, 'level' => 'not_ready'],
            ['from' => 75, 'to' => 62, 'level' => 'approaching'],
            ['from' => 61, 'to' => 42, 'level' => 'not_ready'],
            ['from' => 41, 'to' => 0,  'level' => 'approaching'],
        ],
        1 => [
            ['from' => 89, 'to' => 70, 'level' => 'not_ready'],
            ['from' => 69, 'to' => 40, 'level' => 'approaching'],
            ['from' => 39, 'to' => 10, 'level' => 'nearly_ready'],
            ['from' => 9,  'to' => 0,  'level' => 'ready'],
        ],
        2 => [
            ['from' => 89, 'to' => 70, 'level' => 'not_ready'],
            ['from' => 69, 'to' => 55, 'level' => 'approaching'],
            ['from' => 54, 'to' => 35, 'level' => 'not_ready'],
            ['from' => 34, 'to' => 15, 'level' => 'approaching'],
            ['from' => 14, 'to' => 0,  'level' => 'nearly_ready'],
        ],
    ];

    private array $hriRanges = [
        'not_ready'    => [0.10, 0.24],
        'approaching'  => [0.25, 0.49],
        'nearly_ready' => [0.50, 0.74],
        'ready'        => [0.75, 0.99],
    ];

    public function run(): void
    {
        $hives    = DB::table('hives')->orderBy('id')->pluck('id');
        $hiveIndexMap = $hives->flip()->toArray(); // hive_id => index

        $logs = DB::table('sensor_logs')->orderBy('record_timestamp')->get();
        $rows = [];

        foreach ($logs as $log) {
            $hiveIndex = $hiveIndexMap[$log->hive_id] ?? 0;
            $daysAgo   = (int) now()->diffInDays($log->record_timestamp);

            [$level, $hriValue, $confidence] = $this->resolveLevel($daysAgo, $hiveIndex);

            $rows[] = [
                'sensor_log_id'        => $log->id,
                'readiness_level'      => $level,
                'hri_value'            => $hriValue,
                'confidence_score'     => $confidence,
                'prediction_timestamp' => $log->record_timestamp,
            ];
        }

        foreach (array_chunk($rows, 500) as $chunk) {
            DB::table('predictions')->insert($chunk);
        }

        $this->command->info('PredictionSeeder: ' . count($rows) . ' rows inserted.');
    }

    private function resolveLevel(int $daysAgo, int $hiveIndex): array
    {
        $segments = $this->progressions[$hiveIndex] ?? $this->progressions[0];
        $level    = 'not_ready';

        foreach ($segments as $segment) {
            if ($daysAgo <= $segment['from'] && $daysAgo >= $segment['to']) {
                $level = $segment['level'];
                break;
            }
        }

        [$min, $max] = $this->hriRanges[$level];
        $hriValue   = round($min + (rand(0, 100) / 100) * ($max - $min), 2);
        $confidence = round(0.62 + (rand(0, 33) / 100), 2);

        return [$level, $hriValue, $confidence];
    }
}
