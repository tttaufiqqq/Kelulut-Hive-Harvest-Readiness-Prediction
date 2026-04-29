<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class MasterDataSeeder extends Seeder
{
    public function run(): void
    {
        DB::table('master_species')->insert([
            ['name' => 'Heterotrigona itama',       'created_at' => now(), 'updated_at' => now()],
            ['name' => 'Geniotrigona thoracica',    'created_at' => now(), 'updated_at' => now()],
            ['name' => 'Tetragonula laeviceps',     'created_at' => now(), 'updated_at' => now()],
            ['name' => 'Tetrigona binghami',        'created_at' => now(), 'updated_at' => now()],
            ['name' => 'Lepidotrigona terminate',   'created_at' => now(), 'updated_at' => now()],
        ]);

        DB::table('master_sites')->insert([
            ['name' => 'Lab',     'description' => 'Indoor laboratory environment',  'created_at' => now(), 'updated_at' => now()],
            ['name' => 'Field A', 'description' => 'Outdoor field near rubber trees', 'created_at' => now(), 'updated_at' => now()],
            ['name' => 'Field B', 'description' => 'Outdoor field near coconut farm', 'created_at' => now(), 'updated_at' => now()],
        ]);

        DB::table('master_sensor_thresholds')->insert([
            // Temperature thresholds
            ['sensor_type' => 'temp', 'min_value' => 32.0, 'max_value' => 37.0, 'level' => 'normal',   'meaning' => 'Optimal hive temperature',        'recommended_action' => 'No action needed',          'created_at' => now(), 'updated_at' => now()],
            ['sensor_type' => 'temp', 'min_value' => 37.1, 'max_value' => 40.0, 'level' => 'warning',  'meaning' => 'Temperature slightly elevated',   'recommended_action' => 'Monitor closely',           'created_at' => now(), 'updated_at' => now()],
            ['sensor_type' => 'temp', 'min_value' => 40.1, 'max_value' => 99.0, 'level' => 'critical', 'meaning' => 'Dangerously high temperature',    'recommended_action' => 'Inspect hive immediately',  'created_at' => now(), 'updated_at' => now()],
            // Humidity thresholds
            ['sensor_type' => 'humidity', 'min_value' => 60.0, 'max_value' => 80.0, 'level' => 'normal',   'meaning' => 'Optimal humidity for honey curing', 'recommended_action' => 'No action needed',       'created_at' => now(), 'updated_at' => now()],
            ['sensor_type' => 'humidity', 'min_value' => 80.1, 'max_value' => 90.0, 'level' => 'warning',  'meaning' => 'High humidity, risk of fermentation','recommended_action' => 'Improve ventilation',   'created_at' => now(), 'updated_at' => now()],
            ['sensor_type' => 'humidity', 'min_value' => 90.1, 'max_value' => 100.0,'level' => 'critical', 'meaning' => 'Excessive humidity',               'recommended_action' => 'Urgent ventilation fix', 'created_at' => now(), 'updated_at' => now()],
            // MQ2 thresholds
            ['sensor_type' => 'mq2', 'min_value' => 0,   'max_value' => 300,  'level' => 'normal',   'meaning' => 'Normal smoke/gas levels',       'recommended_action' => 'No action needed',         'created_at' => now(), 'updated_at' => now()],
            ['sensor_type' => 'mq2', 'min_value' => 301, 'max_value' => 500,  'level' => 'warning',  'meaning' => 'Elevated smoke/gas detected',   'recommended_action' => 'Check surrounding area',  'created_at' => now(), 'updated_at' => now()],
            ['sensor_type' => 'mq2', 'min_value' => 501, 'max_value' => 9999, 'level' => 'critical', 'meaning' => 'High smoke/gas, possible threat','recommended_action' => 'Inspect hive urgently',   'created_at' => now(), 'updated_at' => now()],
        ]);

        DB::table('master_honey_colors')->insert([
            ['name' => 'Cream White',   'created_at' => now(), 'updated_at' => now()],
            ['name' => 'Light Yellow',  'created_at' => now(), 'updated_at' => now()],
            ['name' => 'Golden Yellow', 'created_at' => now(), 'updated_at' => now()],
            ['name' => 'Light Amber',   'created_at' => now(), 'updated_at' => now()],
            ['name' => 'Amber',         'created_at' => now(), 'updated_at' => now()],
            ['name' => 'Dark Amber',    'created_at' => now(), 'updated_at' => now()],
            ['name' => 'Dark Brown',    'created_at' => now(), 'updated_at' => now()],
        ]);

        DB::table('master_honey_flavors')->insert([
            ['name' => 'Sweet',       'created_at' => now(), 'updated_at' => now()],
            ['name' => 'Mildly Sour', 'created_at' => now(), 'updated_at' => now()],
            ['name' => 'Sour',        'created_at' => now(), 'updated_at' => now()],
            ['name' => 'Floral',      'created_at' => now(), 'updated_at' => now()],
            ['name' => 'Earthy',      'created_at' => now(), 'updated_at' => now()],
            ['name' => 'Mild',        'created_at' => now(), 'updated_at' => now()],
            ['name' => 'Strong',      'created_at' => now(), 'updated_at' => now()],
        ]);

        DB::table('master_weather_conditions')->insert([
            ['name' => 'Sunny',   'created_at' => now(), 'updated_at' => now()],
            ['name' => 'Cloudy',  'created_at' => now(), 'updated_at' => now()],
            ['name' => 'Rainy',   'created_at' => now(), 'updated_at' => now()],
            ['name' => 'Windy',   'created_at' => now(), 'updated_at' => now()],
            ['name' => 'Humid',   'created_at' => now(), 'updated_at' => now()],
            ['name' => 'Stormy',  'created_at' => now(), 'updated_at' => now()],
            ['name' => 'Foggy',   'created_at' => now(), 'updated_at' => now()],
        ]);

        DB::table('master_flora_types')->insert([
            ['name' => 'Gelam',           'created_at' => now(), 'updated_at' => now()],
            ['name' => 'Tualang',         'created_at' => now(), 'updated_at' => now()],
            ['name' => 'Durian',          'created_at' => now(), 'updated_at' => now()],
            ['name' => 'Rambutan',        'created_at' => now(), 'updated_at' => now()],
            ['name' => 'Longan',          'created_at' => now(), 'updated_at' => now()],
            ['name' => 'Kelapa',          'created_at' => now(), 'updated_at' => now()],
            ['name' => 'Getah (Rubber)',  'created_at' => now(), 'updated_at' => now()],
            ['name' => 'Belimbing',       'created_at' => now(), 'updated_at' => now()],
            ['name' => 'Acacia',          'created_at' => now(), 'updated_at' => now()],
            ['name' => 'Akasia Mangium',  'created_at' => now(), 'updated_at' => now()],
        ]);
    }
}
