<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class HriSummarySeeder extends Seeder
{
    public function run(): void
    {
        $hives = DB::table('hives')->orderBy('id')->get();

        foreach ($hives as $hive) {
            // Load all sensor logs for this hive grouped by date
            $logsByDate = DB::table('sensor_logs')
                ->where('hive_id', $hive->id)
                ->get()
                ->groupBy(fn($log) => substr($log->record_timestamp, 0, 10));

            // Load all predictions for this hive grouped by date
            $predictionsByDate = DB::table('predictions')
                ->join('sensor_logs', 'predictions.sensor_log_id', '=', 'sensor_logs.id')
                ->where('sensor_logs.hive_id', $hive->id)
                ->select('predictions.*', 'sensor_logs.record_timestamp')
                ->get()
                ->groupBy(fn($p) => substr($p->record_timestamp, 0, 10));

            // Load harvests for this hive
            $harvestDates = DB::table('harvests')
                ->where('hive_id', $hive->id)
                ->pluck('harvest_date')
                ->flip()
                ->toArray();

            $rows = [];

            foreach ($logsByDate as $date => $logs) {
                $predictions = $predictionsByDate[$date] ?? collect();
                $latestLevel = $predictions->sortByDesc('prediction_timestamp')->first()?->readiness_level ?? 'not_ready';
                $avgHri      = $predictions->isNotEmpty() ? round($predictions->avg('hri_value'), 4) : 0;

                $rows[] = [
                    'hive_id'                => $hive->id,
                    'summary_date'           => $date,
                    'avg_temperature'        => round($logs->avg('temp'), 2),
                    'avg_humidity'           => round($logs->avg('humidity'), 2),
                    'avg_mq2'                => round($logs->avg('mq2_value'), 2),
                    'avg_mq3'                => round($logs->avg('mq3_value'), 2),
                    'avg_mq5'                => round($logs->avg('mq5_value'), 2),
                    'avg_mq135'              => round($logs->avg('mq135_value'), 2),
                    'avg_hri_value'          => $avgHri,
                    'harvest_count'          => isset($harvestDates[$date]) ? 1 : 0,
                    'latest_readiness_level' => $latestLevel,
                    'created_at'             => now(),
                    'updated_at'             => now(),
                ];
            }

            DB::table('hri_summary')->insert($rows);
            $this->command->info("HriSummarySeeder: {$hive->name} — " . count($rows) . ' days inserted.');
        }
    }
}
