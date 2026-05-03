<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class SensorLogSeeder extends Seeder
{
    public function run(): void
    {
        $hives    = DB::table('hives')->orderBy('id')->get();
        $iotNodes = DB::table('iot_nodes')->get()->keyBy('hive_id');

        // Per-hive sensor baseline profiles
        $profiles = [
            ['tempBase' => 34.0, 'humidityBase' => 73.0],
            ['tempBase' => 33.5, 'humidityBase' => 71.5],
            ['tempBase' => 34.5, 'humidityBase' => 69.0],
        ];

        $rows = [];

        foreach ($hives as $index => $hive) {
            $node    = $iotNodes[$hive->id] ?? null;
            $profile = $profiles[$index] ?? $profiles[0];

            if (!$node) continue;

            for ($daysAgo = 89; $daysAgo >= 0; $daysAgo--) {
                for ($slot = 0; $slot < 12; $slot++) {
                    $hour = $slot * 2;
                    $ts   = now()->subDays($daysAgo)->setTime($hour, rand(0, 59), 0);

                    // Temp peaks at 2pm, lowest at 6am — sinusoidal day cycle
                    $tempOffset     = round(sin(($hour - 6) * M_PI / 12) * 1.5 + (rand(-8, 8) / 10), 1);
                    $humidityOffset = round(-sin(($hour - 6) * M_PI / 12) * 3.0 + (rand(-8, 8) / 10), 1);

                    $rows[] = [
                        'hive_id'          => $hive->id,
                        'device_id'        => $node->id,
                        'temp'             => round($profile['tempBase'] + $tempOffset, 1),
                        'humidity'         => round($profile['humidityBase'] + $humidityOffset, 1),
                        'mq2_value'        => rand(160, 450),
                        'mq3_value'        => rand(160, 450),
                        'mq5_value'        => rand(160, 450),
                        'mq135_value'      => rand(160, 450),
                        'record_timestamp' => $ts,
                        'created_at'       => $ts,
                    ];
                }
            }
        }

        foreach (array_chunk($rows, 500) as $chunk) {
            DB::table('sensor_logs')->insert($chunk);
        }

        $this->command->info('SensorLogSeeder: ' . count($rows) . ' rows inserted.');
    }
}
