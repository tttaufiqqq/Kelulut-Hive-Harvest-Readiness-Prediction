<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class SensorLogSeeder extends Seeder
{
    public function run(): void
    {
        $hives    = DB::table('hives')->get();
        $iotNodes = DB::table('iot_nodes')->get()->keyBy('hive_id');

        $rows = [];
        $start = now()->subDays(29);

        foreach ($hives as $hive) {
            $node = $iotNodes[$hive->id] ?? null;
            if (!$node) continue;

            for ($day = 0; $day < 30; $day++) {
                for ($slot = 0; $slot < 6; $slot++) {
                    $ts = $start->copy()->addDays($day)->addHours($slot * 4);

                    // Values drift slightly per hive for variety
                    $tempBase     = 33.5 + ($hive->id * 0.3);
                    $humidityBase = 72.0 - ($hive->id * 1.5);

                    $rows[] = [
                        'hive_id'          => $hive->id,
                        'device_id'        => $node->id,
                        'temp'             => round($tempBase + (rand(-15, 15) / 10), 1),
                        'humidity'         => round($humidityBase + (rand(-10, 10) / 10), 1),
                        'mq2_value'        => rand(180, 480),
                        'mq3_value'        => rand(180, 480),
                        'mq5_value'        => rand(180, 480),
                        'mq135_value'      => rand(180, 480),
                        'record_timestamp' => $ts,
                        'created_at'       => $ts,
                    ];
                }
            }
        }

        foreach (array_chunk($rows, 100) as $chunk) {
            DB::table('sensor_logs')->insert($chunk);
        }

        $this->command->info('SensorLogSeeder: ' . count($rows) . ' rows inserted.');
    }
}
