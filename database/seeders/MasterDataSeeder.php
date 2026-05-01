<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class MasterDataSeeder extends Seeder
{
    public function run(): void
    {
        foreach ([
            ['name' => 'Heterotrigona itama'],
            ['name' => 'Geniotrigona thoracica'],
            ['name' => 'Tetragonula laeviceps'],
            ['name' => 'Tetrigona binghami'],
            ['name' => 'Lepidotrigona terminate'],
        ] as $row) {
            DB::table('master_species')->updateOrInsert(
                ['name' => $row['name']],
                array_merge($row, ['created_at' => now(), 'updated_at' => now()]),
            );
        }

        foreach ([
            ['name' => 'Lab',     'description' => 'Indoor laboratory environment'],
            ['name' => 'Field A', 'description' => 'Outdoor field near rubber trees'],
            ['name' => 'Field B', 'description' => 'Outdoor field near coconut farm'],
        ] as $row) {
            DB::table('master_sites')->updateOrInsert(
                ['name' => $row['name']],
                array_merge($row, ['created_at' => now(), 'updated_at' => now()]),
            );
        }

        foreach ([
            ['sensor_type' => 'temp',     'min_value' => 32.0, 'max_value' => 37.0,  'level' => 'normal',   'meaning' => 'Optimal hive temperature',          'recommended_action' => 'No action needed'],
            ['sensor_type' => 'temp',     'min_value' => 37.1, 'max_value' => 40.0,  'level' => 'warning',  'meaning' => 'Temperature slightly elevated',     'recommended_action' => 'Monitor closely'],
            ['sensor_type' => 'temp',     'min_value' => 40.1, 'max_value' => 99.0,  'level' => 'critical', 'meaning' => 'Dangerously high temperature',      'recommended_action' => 'Inspect hive immediately'],
            ['sensor_type' => 'humidity', 'min_value' => 60.0, 'max_value' => 80.0,  'level' => 'normal',   'meaning' => 'Optimal humidity for honey curing',  'recommended_action' => 'No action needed'],
            ['sensor_type' => 'humidity', 'min_value' => 80.1, 'max_value' => 90.0,  'level' => 'warning',  'meaning' => 'High humidity, risk of fermentation','recommended_action' => 'Improve ventilation'],
            ['sensor_type' => 'humidity', 'min_value' => 90.1, 'max_value' => 100.0, 'level' => 'critical', 'meaning' => 'Excessive humidity',                'recommended_action' => 'Urgent ventilation fix'],
            ['sensor_type' => 'mq2',      'min_value' => 0,    'max_value' => 300,   'level' => 'normal',   'meaning' => 'Normal smoke/gas levels',            'recommended_action' => 'No action needed'],
            ['sensor_type' => 'mq2',      'min_value' => 301,  'max_value' => 500,   'level' => 'warning',  'meaning' => 'Elevated smoke/gas detected',        'recommended_action' => 'Check surrounding area'],
            ['sensor_type' => 'mq2',      'min_value' => 501,  'max_value' => 9999,  'level' => 'critical', 'meaning' => 'High smoke/gas, possible threat',    'recommended_action' => 'Inspect hive urgently'],
        ] as $row) {
            DB::table('master_sensor_thresholds')->updateOrInsert(
                ['sensor_type' => $row['sensor_type'], 'level' => $row['level']],
                array_merge($row, ['created_at' => now(), 'updated_at' => now()]),
            );
        }

        foreach ([
            ['sensor_type' => 'mq3',   'min_value' => 0,   'max_value' => 300,  'level' => 'normal',   'meaning' => 'Normal alcohol/gas levels',        'recommended_action' => 'No action needed'],
            ['sensor_type' => 'mq3',   'min_value' => 301, 'max_value' => 500,  'level' => 'warning',  'meaning' => 'Elevated alcohol/gas detected',     'recommended_action' => 'Check surrounding area'],
            ['sensor_type' => 'mq3',   'min_value' => 501, 'max_value' => 9999, 'level' => 'critical', 'meaning' => 'High alcohol/gas, possible threat', 'recommended_action' => 'Inspect hive urgently'],
            ['sensor_type' => 'mq5',   'min_value' => 0,   'max_value' => 300,  'level' => 'normal',   'meaning' => 'Normal LPG/gas levels',             'recommended_action' => 'No action needed'],
            ['sensor_type' => 'mq5',   'min_value' => 301, 'max_value' => 500,  'level' => 'warning',  'meaning' => 'Elevated LPG/gas detected',         'recommended_action' => 'Check surrounding area'],
            ['sensor_type' => 'mq5',   'min_value' => 501, 'max_value' => 9999, 'level' => 'critical', 'meaning' => 'High LPG/gas, possible threat',     'recommended_action' => 'Inspect hive urgently'],
            ['sensor_type' => 'mq135', 'min_value' => 0,   'max_value' => 300,  'level' => 'normal',   'meaning' => 'Normal air quality',                'recommended_action' => 'No action needed'],
            ['sensor_type' => 'mq135', 'min_value' => 301, 'max_value' => 500,  'level' => 'warning',  'meaning' => 'Degraded air quality detected',     'recommended_action' => 'Check surrounding area'],
            ['sensor_type' => 'mq135', 'min_value' => 501, 'max_value' => 9999, 'level' => 'critical', 'meaning' => 'Poor air quality, possible threat', 'recommended_action' => 'Inspect hive urgently'],
        ] as $row) {
            DB::table('master_sensor_thresholds')->updateOrInsert(
                ['sensor_type' => $row['sensor_type'], 'level' => $row['level']],
                array_merge($row, ['created_at' => now(), 'updated_at' => now()]),
            );
        }

        foreach (['Cream White', 'Light Yellow', 'Golden Yellow', 'Light Amber', 'Amber', 'Dark Amber', 'Dark Brown'] as $name) {
            DB::table('master_honey_colors')->updateOrInsert(
                ['name' => $name],
                ['name' => $name, 'created_at' => now(), 'updated_at' => now()],
            );
        }

        foreach (['Sweet', 'Mildly Sour', 'Sour', 'Floral', 'Earthy', 'Mild', 'Strong'] as $name) {
            DB::table('master_honey_flavors')->updateOrInsert(
                ['name' => $name],
                ['name' => $name, 'created_at' => now(), 'updated_at' => now()],
            );
        }

        foreach (['Sunny', 'Cloudy', 'Rainy', 'Windy', 'Humid', 'Stormy', 'Foggy'] as $name) {
            DB::table('master_weather_conditions')->updateOrInsert(
                ['name' => $name],
                ['name' => $name, 'created_at' => now(), 'updated_at' => now()],
            );
        }

        foreach (['Gelam', 'Tualang', 'Durian', 'Rambutan', 'Longan', 'Kelapa', 'Getah (Rubber)', 'Belimbing', 'Acacia', 'Akasia Mangium'] as $name) {
            DB::table('master_flora_types')->updateOrInsert(
                ['name' => $name],
                ['name' => $name, 'created_at' => now(), 'updated_at' => now()],
            );
        }
    }
}
