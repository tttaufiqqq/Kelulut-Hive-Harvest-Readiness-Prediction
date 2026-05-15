<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        if (DB::getDriverName() !== 'mysql') {
            return;
        }

        DB::unprepared('DROP PROCEDURE IF EXISTS sp_beekeeper_harvest_summary');

        DB::unprepared('
            CREATE PROCEDURE sp_beekeeper_harvest_summary(IN p_beekeeper_id BIGINT UNSIGNED)
            BEGIN
                SELECT
                    hives.id AS hive_id,
                    hives.name AS hive_name,
                    SUM(harvests.weight) AS total_weight,
                    COUNT(*) AS harvest_count
                FROM harvests
                JOIN hives ON hives.id = harvests.hive_id
                WHERE harvests.beekeeper_id = p_beekeeper_id
                GROUP BY hives.id, hives.name
                ORDER BY total_weight DESC;
            END
        ');

        DB::unprepared('DROP PROCEDURE IF EXISTS sp_fleet_hri_trend');

        DB::unprepared('
            CREATE PROCEDURE sp_fleet_hri_trend(IN p_days INT)
            BEGIN
                SELECT
                    summary_date,
                    ROUND(AVG(avg_hri_value) * 100, 1) AS avg_hri_pct,
                    SUM(harvest_count) AS total_harvests
                FROM hri_summary
                WHERE summary_date >= DATE_SUB(CURDATE(), INTERVAL p_days DAY)
                GROUP BY summary_date
                ORDER BY summary_date;
            END
        ');
    }

    public function down(): void
    {
        if (DB::getDriverName() !== 'mysql') {
            return;
        }

        DB::unprepared('DROP PROCEDURE IF EXISTS sp_beekeeper_harvest_summary');
        DB::unprepared('DROP PROCEDURE IF EXISTS sp_fleet_hri_trend');
    }
};
