<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class HarvestSeeder extends Seeder
{
    // Hive 0: harvested at day 61 ago
    // Hive 1: no harvest yet (first cycle still approaching ready)
    // Hive 2: harvested at day 54 ago
    private array $harvestDaysAgo = [
        0 => [61],
        1 => [],
        2 => [54],
    ];

    public function run(): void
    {
        $hives     = DB::table('hives')->orderBy('id')->get();
        $admin     = DB::table('users')->where('email', 'admin@buzzyhive.urban-alert.com')->first();
        $colorIds  = DB::table('master_honey_colors')->pluck('id')->toArray();
        $flavorIds = DB::table('master_honey_flavors')->pluck('id')->toArray();

        if (!$admin) {
            $this->command->error('Admin user not found.');
            return;
        }

        $rows = [];

        foreach ($hives as $index => $hive) {
            $days = $this->harvestDaysAgo[$index] ?? [];

            foreach ($days as $daysAgo) {
                $rows[] = [
                    'hive_id'            => $hive->id,
                    'beekeeper_id'       => $admin->id,
                    'harvest_date'       => now()->subDays($daysAgo)->toDateString(),
                    'weight'             => round(rand(380, 720) / 1, 1),
                    'productivity_level' => $daysAgo <= 30 ? 'high' : 'medium',
                    'color_id'           => $colorIds[array_rand($colorIds)],
                    'flavor_id'          => $flavorIds[array_rand($flavorIds)],
                    'notes'              => 'Harvest collected after readiness confirmed by system.',
                    'created_at'         => now()->subDays($daysAgo),
                    'updated_at'         => now()->subDays($daysAgo),
                ];
            }
        }

        DB::table('harvests')->insert($rows);
        $this->command->info('HarvestSeeder: ' . count($rows) . ' rows inserted.');
    }
}
