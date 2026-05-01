<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        DB::table('master_sites')->where('id', '>', 3)->delete();
        DB::table('master_species')->where('id', '>', 5)->delete();
        DB::table('master_honey_colors')->where('id', '>', 7)->delete();
        DB::table('master_honey_flavors')->where('id', '>', 7)->delete();
        DB::table('master_weather_conditions')->where('id', '>', 7)->delete();
        DB::table('master_flora_types')->where('id', '>', 10)->delete();
    }

    public function down(): void
    {
        // no rollback — duplicate rows should not be restored
    }
};
