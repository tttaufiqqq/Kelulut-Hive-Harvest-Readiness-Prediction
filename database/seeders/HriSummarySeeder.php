<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class HriSummarySeeder extends Seeder
{
    public function run(): void
    {
        $hives = DB::table('hives')->get();

        foreach ($hives as $hive) {
            $logs = DB::table('sensor_logs')->where('hive_id', $hive->id)->get();

            if ($logs->isEmpty()) continue;

            $avgTemp     = round($logs->avg('temp'), 2);
            $avgHumidity = round($logs->avg('humidity'), 2);
            $avgMq2      = round($logs->avg('mq2_value'), 2);
            $avgMq3      = round($logs->avg('mq3_value'), 2);
            $avgMq5      = round($logs->avg('mq5_value'), 2);
            $avgMq135    = round($logs->avg('mq135_value'), 2);
            $harvests    = DB::table('harvests')->where('hive_id', $hive->id)->count();

            DB::table('hri_summary')->insert([
                'hive_id'                => $hive->id,
                'summary_date'           => now()->toDateString(),
                'avg_temperature'        => $avgTemp,
                'avg_humidity'           => $avgHumidity,
                'avg_mq2'                => $avgMq2,
                'avg_mq3'                => $avgMq3,
                'avg_mq5'                => $avgMq5,
                'avg_mq135'              => $avgMq135,
                'harvest_count'          => $harvests,
                'latest_readiness_level' => 'ready',
                'created_at'             => now(),
                'updated_at'             => now(),
            ]);
        }

        $this->command->info('HriSummarySeeder: ' . $hives->count() . ' rows inserted.');
    }
}
