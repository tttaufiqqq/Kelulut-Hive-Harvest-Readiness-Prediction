<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Remove duplicate rows on MySQL before adding the unique constraint.
        // Keeps the row with the highest id (most recent updateOrCreate win).
        if (DB::connection()->getDriverName() === 'mysql') {
            DB::unprepared('
                DELETE hs1
                FROM hri_summary hs1
                INNER JOIN hri_summary hs2
                    ON  hs1.hive_id      = hs2.hive_id
                    AND hs1.summary_date = hs2.summary_date
                    AND hs1.id < hs2.id
            ');
        }

        Schema::table('hri_summary', function (Blueprint $table) {
            $table->unique(['hive_id', 'summary_date'], 'hri_summary_hive_id_summary_date_unique');
        });
    }

    public function down(): void
    {
        Schema::table('hri_summary', function (Blueprint $table) {
            $table->dropUnique('hri_summary_hive_id_summary_date_unique');
        });
    }
};
