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

        DB::unprepared('DROP TRIGGER IF EXISTS trg_predictions_after_insert');

        // After a prediction is inserted, upsert hri_summary for that hive + day.
        // Replaces the PHP updateHriSummary() method in MlPredictionService.
        // Uses NEW.readiness_level directly for latest_readiness_level since this
        // trigger fires after the insert, making NEW the most recent prediction.
        DB::unprepared('
            CREATE TRIGGER trg_predictions_after_insert
            AFTER INSERT ON predictions
            FOR EACH ROW
            BEGIN
                DECLARE v_hive_id      BIGINT UNSIGNED;
                DECLARE v_reading_date DATE;

                SELECT hive_id, DATE(record_timestamp)
                INTO   v_hive_id, v_reading_date
                FROM   sensor_logs
                WHERE  id = NEW.sensor_log_id;

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
                    v_hive_id,
                    v_reading_date,
                    ROUND(AVG(sl.temp), 2),
                    ROUND(AVG(sl.humidity), 2),
                    ROUND(AVG(sl.mq2_value), 2),
                    ROUND(AVG(sl.mq3_value), 2),
                    ROUND(AVG(sl.mq5_value), 2),
                    ROUND(AVG(sl.mq135_value), 2),
                    ROUND(AVG(p.hri_value), 4),
                    NEW.readiness_level,
                    (
                        SELECT COUNT(*)
                        FROM harvests h
                        WHERE h.hive_id     = v_hive_id
                          AND h.harvest_date = v_reading_date
                    ),
                    NOW(),
                    NOW()
                FROM sensor_logs sl
                LEFT JOIN predictions p ON p.sensor_log_id = sl.id
                WHERE sl.hive_id                    = v_hive_id
                  AND DATE(sl.record_timestamp)     = v_reading_date
                GROUP BY sl.hive_id, DATE(sl.record_timestamp)
                ON DUPLICATE KEY UPDATE
                    avg_temperature        = VALUES(avg_temperature),
                    avg_humidity           = VALUES(avg_humidity),
                    avg_mq2                = VALUES(avg_mq2),
                    avg_mq3                = VALUES(avg_mq3),
                    avg_mq5                = VALUES(avg_mq5),
                    avg_mq135              = VALUES(avg_mq135),
                    avg_hri_value          = VALUES(avg_hri_value),
                    latest_readiness_level = NEW.readiness_level,
                    updated_at             = NOW();
            END
        ');
    }

    public function down(): void
    {
        if (DB::connection()->getDriverName() !== 'mysql') {
            return;
        }

        DB::unprepared('DROP TRIGGER IF EXISTS trg_predictions_after_insert');
    }
};
