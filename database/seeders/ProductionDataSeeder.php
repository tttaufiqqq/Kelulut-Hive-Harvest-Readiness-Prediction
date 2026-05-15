<?php

namespace Database\Seeders;

use App\Models\Hive;
use App\Models\IotNode;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Spatie\Permission\Models\Role;

class ProductionDataSeeder extends Seeder
{
    // ── 5 beekeepers ──────────────────────────────────────────────────────
    private array $beekeepers = [
        ['name' => 'Ahmad Firdaus', 'email' => 'ahmad.firdaus@buzzyhive.urban-alert.com'],
        ['name' => 'Nurul Ain',     'email' => 'nurul.ain@buzzyhive.urban-alert.com'],
        ['name' => 'Khairul Anam', 'email' => 'khairul.anam@buzzyhive.urban-alert.com'],
        ['name' => 'Siti Hajar',   'email' => 'siti.hajar@buzzyhive.urban-alert.com'],
        ['name' => 'Mohd Razif',   'email' => 'mohd.razif@buzzyhive.urban-alert.com'],
    ];

    // ── 15 hives: 3 per beekeeper ─────────────────────────────────────────
    // [bkIndex, name, site, species]
    private array $hiveDefinitions = [
        [0, 'Akasia Utara',      'Field A', 'Heterotrigona itama'],
        [0, 'Tualang Barat',     'Field B', 'Geniotrigona thoracica'],
        [0, 'Gelam Prima',       'Lab',     'Tetragonula laeviceps'],
        [1, 'Rambutan Selatan',  'Field A', 'Heterotrigona itama'],
        [1, 'Kelapa Wangi',      'Field B', 'Geniotrigona thoracica'],
        [1, 'Durian Emas',       'Lab',     'Tetragonula laeviceps'],
        [2, 'Longan Harum',      'Field A', 'Heterotrigona itama'],
        [2, 'Getah Maju',        'Field B', 'Geniotrigona thoracica'],
        [2, 'Belimbing Jaya',    'Lab',     'Tetragonula laeviceps'],
        [3, 'Akasia Indah',      'Field A', 'Heterotrigona itama'],
        [3, 'Tualang Murni',     'Field B', 'Geniotrigona thoracica'],
        [3, 'Rambutan Madu',     'Lab',     'Tetragonula laeviceps'],
        [4, 'Kelulut Perdana',   'Field A', 'Heterotrigona itama'],
        [4, 'Kelulut Murni',     'Field B', 'Geniotrigona thoracica'],
        [4, 'Kelulut Manis',     'Lab',     'Tetragonula laeviceps'],
    ];

    // ── 3 harvests per hive = 45 total ────────────────────────────────────
    private array $harvestDates = [
        0  => ['2025-05-15', '2025-09-10', '2026-01-12'],
        1  => ['2025-04-20', '2025-08-18', '2025-12-15'],
        2  => ['2025-06-05', '2025-10-02', '2026-02-01'],
        3  => ['2025-04-08', '2025-08-01', '2025-11-25'],
        4  => ['2025-05-30', '2025-09-25', '2026-01-28'],
        5  => ['2025-04-15', '2025-08-12', '2025-12-08'],
        6  => ['2025-06-10', '2025-10-08', '2026-02-10'],
        7  => ['2025-05-05', '2025-09-01', '2025-12-29'],
        8  => ['2025-04-25', '2025-08-22', '2025-12-18'],
        9  => ['2025-06-20', '2025-10-18', '2026-02-20'],
        10 => ['2025-05-08', '2025-09-05', '2026-01-05'],
        11 => ['2025-04-02', '2025-07-30', '2025-11-20'],
        12 => ['2025-06-15', '2025-10-12', '2026-02-15'],
        13 => ['2025-05-20', '2025-09-18', '2026-01-20'],
        14 => ['2025-04-10', '2025-08-05', '2025-11-30'],
    ];

    // ── Sensor baseline profiles per hive ─────────────────────────────────
    private array $profiles = [
        ['tempBase' => 34.0, 'humBase' => 73.0, 'mqBase' => 210],
        ['tempBase' => 33.5, 'humBase' => 71.5, 'mqBase' => 195],
        ['tempBase' => 34.5, 'humBase' => 69.0, 'mqBase' => 225],
        ['tempBase' => 33.8, 'humBase' => 74.5, 'mqBase' => 180],
        ['tempBase' => 34.2, 'humBase' => 72.0, 'mqBase' => 240],
        ['tempBase' => 33.6, 'humBase' => 70.5, 'mqBase' => 200],
        ['tempBase' => 34.8, 'humBase' => 68.0, 'mqBase' => 215],
        ['tempBase' => 33.4, 'humBase' => 75.5, 'mqBase' => 185],
        ['tempBase' => 34.1, 'humBase' => 71.0, 'mqBase' => 230],
        ['tempBase' => 33.9, 'humBase' => 73.5, 'mqBase' => 205],
        ['tempBase' => 34.6, 'humBase' => 69.5, 'mqBase' => 220],
        ['tempBase' => 33.3, 'humBase' => 76.0, 'mqBase' => 190],
        ['tempBase' => 34.3, 'humBase' => 70.0, 'mqBase' => 235],
        ['tempBase' => 33.7, 'humBase' => 74.0, 'mqBase' => 195],
        ['tempBase' => 34.4, 'humBase' => 72.5, 'mqBase' => 210],
    ];

    // ── 10 inspection dates per hive (~every 7 weeks, 2025–2026) ──────────
    private array $inspectionDates = [
        '2025-01-15', '2025-03-05', '2025-04-23',
        '2025-06-11', '2025-07-30', '2025-09-17',
        '2025-11-05', '2025-12-24', '2026-02-11', '2026-04-01',
    ];

    public function run(): void
    {
        // Admin user — created here so --seeder=ProductionDataSeeder works standalone
        $adminRole = Role::firstOrCreate(['name' => 'admin', 'guard_name' => 'web']);
        $admin     = User::firstOrCreate(
            ['email' => 'admin@buzzyhive.urban-alert.com'],
            [
                'name'              => 'Admin',
                'password'          => Hash::make(env('ADMIN_SEED_PASSWORD', 'BuzzyHive@Admin2025!')),
                'email_verified_at' => now(),
                'status'            => 'active',
                'role'              => 'admin',
            ]
        );
        $admin->assignRole($adminRole);

        $password       = Hash::make(env('BEEKEEPER_SEED_PASSWORD', 'Beekeeper@2025!'));
        $beekeeperRole  = Role::firstOrCreate(['name' => 'beekeeper', 'guard_name' => 'web']);

        // 1. Beekeepers
        $users = [];
        foreach ($this->beekeepers as $bk) {
            $user = User::firstOrCreate(
                ['email' => $bk['email']],
                [
                    'name'              => $bk['name'],
                    'password'          => $password,
                    'email_verified_at' => Carbon::parse('2025-01-01'),
                    'status'            => 'active',
                    'role'              => 'beekeeper',
                ]
            );
            $user->assignRole($beekeeperRole);
            $users[] = $user;
        }

        // 2. Hives + IoT Nodes
        $siteIds    = DB::table('master_sites')->pluck('id', 'name');
        $speciesIds = DB::table('master_species')->pluck('id', 'name');

        $hiveModels = [];
        $nodeModels = [];

        foreach ($this->hiveDefinitions as $hiveIndex => [$bkIndex, $name, $site, $species]) {
            $hive = Hive::firstOrCreate(
                ['name' => $name],
                [
                    'beekeeper_id' => $users[$bkIndex]->id,
                    'site_id'      => $siteIds[$site],
                    'species_id'   => $speciesIds[$species],
                    'status'       => 'active',
                ]
            );

            $node = IotNode::where('hive_id', $hive->id)->first();
            if (! $node) {
                do {
                    $identifier = 'NODE-' . strtoupper(Str::random(6));
                } while (IotNode::where('node_identifier', $identifier)->exists());

                $node = IotNode::create([
                    'hive_id'           => $hive->id,
                    'node_identifier'   => $identifier,
                    'device_status'     => 'active',
                    'installation_date' => Carbon::parse('2025-01-01'),
                ]);
            }

            $hiveModels[$hiveIndex] = $hive;
            $nodeModels[$hiveIndex] = $node;
        }

        // 3. Harvests first — harvest trigger updates hri_summary.harvest_count
        $this->seedHarvests($hiveModels, $users);

        // 4. Sensor logs + predictions — prediction trigger auto-populates hri_summary
        $this->seedSensorData($hiveModels, $nodeModels);

        // 5. Inspections
        $this->seedInspections($hiveModels, $users);
    }

    // ── Harvests ──────────────────────────────────────────────────────────

    private function seedHarvests(array $hives, array $users): void
    {
        $colorIds  = DB::table('master_honey_colors')->pluck('id')->toArray();
        $flavorIds = DB::table('master_honey_flavors')->pluck('id')->toArray();
        $rows      = [];

        foreach ($hives as $hiveIndex => $hive) {
            if (DB::table('harvests')->where('hive_id', $hive->id)->exists()) {
                $this->command->warn("Harvests {$hive->name}: already seeded, skipping.");
                continue;
            }

            $beekeeper = $users[(int) floor($hiveIndex / 3)];

            foreach ($this->harvestDates[$hiveIndex] as $num => $date) {
                $ts     = Carbon::parse($date)->setHour(9)->setMinute(rand(0, 30));
                $rows[] = [
                    'hive_id'            => $hive->id,
                    'beekeeper_id'       => $beekeeper->id,
                    'harvest_date'       => $date,
                    'weight'             => rand(350, 750),
                    'productivity_level' => $num === 2 ? 'high' : 'medium',
                    'color_id'           => $colorIds[array_rand($colorIds)],
                    'flavor_id'          => $flavorIds[array_rand($flavorIds)],
                    'notes'              => 'Harvest confirmed after system readiness alert.',
                    'created_at'         => $ts->toDateTimeString(),
                    'updated_at'         => $ts->toDateTimeString(),
                ];
            }
        }

        if (! empty($rows)) {
            DB::table('harvests')->insert($rows);
            $this->command->info('Harvests: ' . count($rows) . ' rows inserted.');
        }
    }

    // ── Sensor Logs + Predictions ─────────────────────────────────────────
    // Reading days: Mon, Wed, Fri from 2025-01-06 to 2026-04-25
    // 1 reading per day → ~202 per hive × 15 hives = ~3,030 sensor_logs + predictions
    // Prediction trigger auto-populates hri_summary for each insert.

    private function seedSensorData(array $hives, array $nodes): void
    {
        $readingDays = $this->buildReadingDays();

        foreach ($hives as $hiveIndex => $hive) {
            if (DB::table('sensor_logs')->where('hive_id', $hive->id)->exists()) {
                $this->command->warn("SensorLogs {$hive->name}: already seeded, skipping.");
                continue;
            }

            $node    = $nodes[$hiveIndex];
            $profile = $this->profiles[$hiveIndex];
            $logRows = [];

            foreach ($readingDays as $day) {
                $hour    = rand(8, 18);
                $ts      = Carbon::parse($day)->setHour($hour)->setMinute(rand(0, 59))->setSecond(0);
                $tempOff = round(sin(($hour - 6) * M_PI / 12) * 1.5 + (rand(-8, 8) / 10), 1);
                $humOff  = round(-sin(($hour - 6) * M_PI / 12) * 3.0 + (rand(-8, 8) / 10), 1);
                $mqVar   = rand(-40, 60);

                $logRows[] = [
                    'hive_id'          => $hive->id,
                    'device_id'        => $node->id,
                    'temp'             => round($profile['tempBase'] + $tempOff, 1),
                    'humidity'         => round($profile['humBase'] + $humOff, 1),
                    'mq2_value'        => max(50, $profile['mqBase'] + $mqVar + rand(-20, 20)),
                    'mq3_value'        => max(50, $profile['mqBase'] + $mqVar + rand(-20, 20)),
                    'mq5_value'        => max(50, $profile['mqBase'] + $mqVar + rand(-20, 20)),
                    'mq135_value'      => max(50, $profile['mqBase'] + $mqVar + rand(-20, 20)),
                    'record_timestamp' => $ts->toDateTimeString(),
                    'created_at'       => $ts->toDateTimeString(),
                ];
            }

            foreach (array_chunk($logRows, 500) as $chunk) {
                DB::table('sensor_logs')->insert($chunk);
            }

            // Fetch inserted log IDs for this hive to build prediction rows
            $logs = DB::table('sensor_logs')
                ->where('hive_id', $hive->id)
                ->orderBy('record_timestamp')
                ->select('id', 'record_timestamp')
                ->get();

            $predRows = [];
            foreach ($logs as $log) {
                $date = substr($log->record_timestamp, 0, 10);
                [$level, $hri, $confidence] = $this->resolveReadiness($hiveIndex, $date);

                $predRows[] = [
                    'sensor_log_id'                => $log->id,
                    'readiness_level'              => $level,
                    'raw_readiness_level'          => $level,
                    'hri_value'                    => $hri,
                    'raw_hri_value'                => $hri,
                    'confidence_score'             => $confidence,
                    'model_version'                => 'v1.0-seeded',
                    'warning_state'                => 'none',
                    'guardrail_action'             => 'none',
                    'threshold_warning_level'      => 'none',
                    'out_of_distribution'          => false,
                    'out_of_distribution_features' => null,
                    'prediction_warning'           => null,
                    'prediction_timestamp'         => $log->record_timestamp,
                ];
            }

            foreach (array_chunk($predRows, 500) as $chunk) {
                DB::table('predictions')->insert($chunk);
            }

            $this->command->info("{$hive->name}: {$logs->count()} logs + predictions seeded.");
        }
    }

    private function buildReadingDays(): array
    {
        $days   = [];
        $cursor = Carbon::parse('2025-01-06'); // first Monday
        $end    = Carbon::parse('2026-04-25');

        while ($cursor->lte($end)) {
            if (in_array($cursor->dayOfWeek, [Carbon::MONDAY, Carbon::WEDNESDAY, Carbon::FRIDAY])) {
                $days[] = $cursor->toDateString();
            }
            $cursor->addDay();
        }

        return $days;
    }

    // ── Readiness level from harvest cycle ────────────────────────────────

    private function resolveReadiness(int $hiveIndex, string $readingDate): array
    {
        $harvestDates = $this->harvestDates[$hiveIndex];
        $daysSince    = null;

        foreach (array_reverse($harvestDates) as $hd) {
            if ($hd <= $readingDate) {
                $daysSince = Carbon::parse($hd)->diffInDays(Carbon::parse($readingDate));
                break;
            }
        }

        // Before first harvest: measure from monitoring start
        if ($daysSince === null) {
            $daysSince = Carbon::parse('2025-01-06')->diffInDays(Carbon::parse($readingDate));
        }

        if ($daysSince <= 30) {
            $level = 'not_ready';
            [$min, $max] = [0.10, 0.24];
        } elseif ($daysSince <= 60) {
            $level = 'approaching';
            [$min, $max] = [0.25, 0.49];
        } elseif ($daysSince <= 80) {
            $level = 'nearly_ready';
            [$min, $max] = [0.50, 0.74];
        } else {
            $level = 'ready';
            [$min, $max] = [0.75, 0.99];
        }

        $hri        = round($min + (rand(0, 100) / 100) * ($max - $min), 2);
        $confidence = round(0.62 + rand(0, 33) / 100, 2);

        return [$level, $hri, $confidence];
    }

    // ── Inspections ───────────────────────────────────────────────────────

    private function seedInspections(array $hives, array $users): void
    {
        $weatherIds = DB::table('master_weather_conditions')->pluck('id')->toArray();
        $floraIds   = DB::table('master_flora_types')->pluck('id')->toArray();
        $count      = 0;

        foreach ($hives as $hiveIndex => $hive) {
            if (DB::table('inspections')->where('hive_id', $hive->id)->exists()) {
                $this->command->warn("Inspections {$hive->name}: already seeded, skipping.");
                continue;
            }

            $beekeeper = $users[(int) floor($hiveIndex / 3)];

            foreach ($this->inspectionDates as $offset => $baseDate) {
                // Stagger each hive by a few days so inspections don't all land on the same date
                $date         = Carbon::parse($baseDate)->addDays($hiveIndex % 5);
                $isLaterCycle = $offset >= 5;

                $inspectionId = DB::table('inspections')->insertGetId([
                    'hive_id'                    => $hive->id,
                    'beekeeper_id'               => $beekeeper->id,
                    'notes'                      => $isLaterCycle
                        ? 'Colony thriving. Propolis layers thickening. Honey chamber filling.'
                        : 'Colony establishing. Early foraging observed. Structure intact.',
                    'blooming_status'            => $isLaterCycle ? 'peak_bloom' : 'early_bloom',
                    'vegetation_density'         => $isLaterCycle ? 'dense' : 'moderate',
                    'nectar_source_availability' => $isLaterCycle ? 'abundant' : 'moderate',
                    'structural_damage'          => null,
                    'food_source_observation'    => $isLaterCycle
                        ? 'Heavy foraging activity. Multiple nectar sources identified.'
                        : 'Light foraging. Bees adapting to local flora.',
                    'inspection_date'            => $date->toDateString(),
                    'created_at'                 => $date->toDateTimeString(),
                    'updated_at'                 => $date->toDateTimeString(),
                ]);

                DB::table('inspection_weather')->insert([
                    'inspection_id' => $inspectionId,
                    'weather_id'    => $weatherIds[array_rand($weatherIds)],
                ]);

                $shuffled = $floraIds;
                shuffle($shuffled);
                foreach (array_slice($shuffled, 0, rand(2, 3)) as $floraId) {
                    DB::table('inspection_flora')->insert([
                        'inspection_id' => $inspectionId,
                        'flora_id'      => $floraId,
                    ]);
                }

                $count++;
            }
        }

        $this->command->info('Inspections: ' . $count . ' inserted.');
    }
}
