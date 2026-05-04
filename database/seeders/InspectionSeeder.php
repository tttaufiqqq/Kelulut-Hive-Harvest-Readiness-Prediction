<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class InspectionSeeder extends Seeder
{
    public function run(): void
    {
        $hives = DB::table('hives')->orderBy('id')->get();
        $admin = DB::table('users')->where('email', 'admin@buzzyhive.urban-alert.com')->first();
        $weatherIds = DB::table('master_weather_conditions')->pluck('id')->toArray();
        $floraIds = DB::table('master_flora_types')->pluck('id')->toArray();

        if (! $admin) {
            $this->command->error('Admin user not found.');

            return;
        }

        // 4 inspections per hive spread across 90 days
        $inspectionOffsets = [80, 60, 35, 10];
        $count = 0;

        foreach ($hives as $hive) {
            foreach ($inspectionOffsets as $daysAgo) {
                $date = now()->subDays($daysAgo);
                $isLaterStage = $daysAgo <= 35;

                $inspectionId = DB::table('inspections')->insertGetId([
                    'hive_id' => $hive->id,
                    'beekeeper_id' => $admin->id,
                    'notes' => $isLaterStage
                        ? 'Bees highly active. Propolis layers thickening. Honey chamber filling up.'
                        : 'Colony establishing. Early foraging observed. Hive structure intact.',
                    'blooming_status' => $isLaterStage ? 'peak_bloom' : 'early_bloom',
                    'vegetation_density' => $isLaterStage ? 'dense' : 'moderate',
                    'nectar_source_availability' => $isLaterStage ? 'abundant' : 'moderate',
                    'structural_damage' => null,
                    'food_source_observation' => $isLaterStage
                        ? 'Heavy foraging activity. Multiple nectar sources identified nearby.'
                        : 'Light foraging. Bees adapting to environment.',
                    'inspection_date' => $date->toDateString(),
                    'created_at' => $date,
                    'updated_at' => $date,
                ]);

                // 1 weather condition per inspection
                DB::table('inspection_weather')->insert([
                    'inspection_id' => $inspectionId,
                    'weather_id' => $weatherIds[array_rand($weatherIds)],
                ]);

                // 2–3 flora types per inspection
                $shuffled = $floraIds;
                shuffle($shuffled);
                foreach (array_slice($shuffled, 0, rand(2, 3)) as $floraId) {
                    DB::table('inspection_flora')->insert([
                        'inspection_id' => $inspectionId,
                        'flora_id' => $floraId,
                    ]);
                }

                $count++;
            }
        }

        $this->command->info('InspectionSeeder: '.$count.' inspections inserted.');
    }
}
