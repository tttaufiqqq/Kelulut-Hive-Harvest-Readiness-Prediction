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

        DB::unprepared('DROP PROCEDURE IF EXISTS sp_refresh_hri_summary');

        // Full HRI summary recalculation for a given hive + date.
        // Useful for backfills, admin resets, or one-off corrections.
        // The live trigger (trg_predictions_after_insert) calls equivalent inline logic
        // on every sensor ingest — this procedure exists for standalone use.
        DB::unprepared('
            CREATE PROCEDURE sp_refresh_hri_summary(
                IN p_hive_id BIGINT UNSIGNED,
                IN p_date    DATE
            )
            BEGIN
                INSERT INTO hri_summary (
                    hive_id,
                    summary_date,
                    avg_temperature,
                    avg_humidity,
                    avg_mq2,
                    avg_mq3,
                    avg_mq5,
                    avg_mq135,
                    avg_hri_value,
                    latest_readiness_level,
                    harvest_count,
                    created_at,
                    updated_at
                )
                SELECT
                    p_hive_id,
                    p_date,
                    ROUND(AVG(sl.temp), 2),
                    ROUND(AVG(sl.humidity), 2),
                    ROUND(AVG(sl.mq2_value), 2),
                    ROUND(AVG(sl.mq3_value), 2),
                    ROUND(AVG(sl.mq5_value), 2),
                    ROUND(AVG(sl.mq135_value), 2),
                    ROUND(AVG(p.hri_value), 4),
                    (
                        SELECT p2.readiness_level
                        FROM predictions p2
                        JOIN sensor_logs sl2 ON p2.sensor_log_id = sl2.id
                        WHERE sl2.hive_id = p_hive_id
                          AND DATE(sl2.record_timestamp) = p_date
                        ORDER BY p2.prediction_timestamp DESC
                        LIMIT 1
                    ),
                    (
                        SELECT COUNT(*)
                        FROM harvests h
                        WHERE h.hive_id = p_hive_id
                          AND h.harvest_date = p_date
                    ),
                    NOW(),
                    NOW()
                FROM sensor_logs sl
                LEFT JOIN predictions p ON p.sensor_log_id = sl.id
                WHERE sl.hive_id = p_hive_id
                  AND DATE(sl.record_timestamp) = p_date
                ON DUPLICATE KEY UPDATE
                    avg_temperature        = VALUES(avg_temperature),
                    avg_humidity           = VALUES(avg_humidity),
                    avg_mq2                = VALUES(avg_mq2),
                    avg_mq3                = VALUES(avg_mq3),
                    avg_mq5                = VALUES(avg_mq5),
                    avg_mq135              = VALUES(avg_mq135),
                    avg_hri_value          = VALUES(avg_hri_value),
                    latest_readiness_level = VALUES(latest_readiness_level),
                    harvest_count          = VALUES(harvest_count),
                    updated_at             = NOW();
            END
        ');
    }

    public function down(): void
    {
        if (DB::connection()->getDriverName() !== 'mysql') {
            return;
        }

        DB::unprepared('DROP PROCEDURE IF EXISTS sp_refresh_hri_summary');
    }
};
