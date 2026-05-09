<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        if (DB::connection()->getDriverName() !== 'mysql') {
            return;
        }

        DB::unprepared('DROP TRIGGER IF EXISTS trg_harvests_after_insert');

        // After a harvest is logged, increment hri_summary.harvest_count for that hive + day.
        // Creates the hri_summary row if it does not exist yet (harvest before any prediction).
        DB::unprepared('
            CREATE TRIGGER trg_harvests_after_insert
            AFTER INSERT ON harvests
            FOR EACH ROW
            BEGIN
                INSERT INTO hri_summary (
                    hive_id,
                    summary_date,
                    harvest_count,
                    created_at,
                    updated_at
                )
                VALUES (
                    NEW.hive_id,
                    NEW.harvest_date,
                    1,
                    NOW(),
                    NOW()
                )
                ON DUPLICATE KEY UPDATE
                    harvest_count = harvest_count + 1,
                    updated_at    = NOW();
            END
        ');
    }

    public function down(): void
    {
        if (DB::connection()->getDriverName() !== 'mysql') {
            return;
        }

        DB::unprepared('DROP TRIGGER IF EXISTS trg_harvests_after_insert');
    }
};
