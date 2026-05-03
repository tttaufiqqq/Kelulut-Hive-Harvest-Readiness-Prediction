<?php

namespace Database\Seeders;

use App\Models\Hive;
use App\Models\IotNode;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class DemoHiveSeeder extends Seeder
{
    public function run(): void
    {
        $admin = User::where('email', 'admin@buzzyhive.urban-alert.com')->first();

        if (!$admin) {
            $this->command->error('Admin user not found. Run DatabaseSeeder first.');
            return;
        }

        $site1 = DB::table('master_sites')->where('name', 'Lab')->value('id');
        $site2 = DB::table('master_sites')->where('name', 'Field A')->value('id');
        $site3 = DB::table('master_sites')->where('name', 'Field B')->value('id');

        $sp1 = DB::table('master_species')->where('name', 'Heterotrigona itama')->value('id');
        $sp2 = DB::table('master_species')->where('name', 'Geniotrigona thoracica')->value('id');
        $sp3 = DB::table('master_species')->where('name', 'Tetragonula laeviceps')->value('id');

        $hivesData = [
            ['name' => 'Demo Hive 1', 'site_id' => $site1, 'species_id' => $sp1, 'node' => 'NODE-001'],
            ['name' => 'Demo Hive 2', 'site_id' => $site2, 'species_id' => $sp2, 'node' => 'NODE-002'],
            ['name' => 'Demo Hive 3', 'site_id' => $site3, 'species_id' => $sp3, 'node' => 'NODE-003'],
        ];

        foreach ($hivesData as $data) {
            $hive = Hive::firstOrCreate(
                ['name' => $data['name']],
                [
                    'beekeeper_id' => $admin->id,
                    'site_id'      => $data['site_id'],
                    'species_id'   => $data['species_id'],
                    'status'       => 'active',
                ]
            );

            IotNode::firstOrCreate(
                ['device_id' => $data['node']],
                [
                    'hive_id'           => $hive->id,
                    'device_status'     => 'active',
                    'installation_date' => now()->subDays(60),
                ]
            );

            $this->command->info("Hive: {$hive->name} | Node: {$data['node']}");
        }
    }
}
