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

        // Daily averages of sensor readings and HRI per hive per day.
        DB::unprepared('
            CREATE OR REPLACE VIEW vw_hive_sensor_daily_avg AS
            SELECT
                sl.hive_id,
                DATE(sl.record_timestamp)       AS reading_date,
                ROUND(AVG(sl.temp), 2)          AS avg_temp,
                ROUND(AVG(sl.humidity), 2)      AS avg_humidity,
                ROUND(AVG(sl.mq2_value), 2)     AS avg_mq2,
                ROUND(AVG(sl.mq3_value), 2)     AS avg_mq3,
                ROUND(AVG(sl.mq5_value), 2)     AS avg_mq5,
                ROUND(AVG(sl.mq135_value), 2)   AS avg_mq135,
                ROUND(AVG(p.hri_value), 4)      AS avg_hri_value,
                COUNT(DISTINCT sl.id)           AS reading_count
            FROM sensor_logs sl
            LEFT JOIN predictions p ON p.sensor_log_id = sl.id
            GROUP BY sl.hive_id, DATE(sl.record_timestamp)
        ');

        // Harvest totals and weight aggregates per hive.
        DB::unprepared('
            CREATE OR REPLACE VIEW vw_harvest_summary_per_hive AS
            SELECT
                hive_id,
                COUNT(*)            AS total_harvests,
                SUM(weight)         AS total_weight,
                ROUND(AVG(weight), 2) AS avg_weight,
                MAX(harvest_date)   AS last_harvest_date
            FROM harvests
            GROUP BY hive_id
        ');

        // Latest prediction per hive using ROW_NUMBER window function.
        DB::unprepared('
            CREATE OR REPLACE VIEW vw_hive_latest_prediction AS
            SELECT
                ranked.id,
                ranked.sensor_log_id,
                ranked.readiness_level,
                ranked.raw_readiness_level,
                ranked.hri_value,
                ranked.raw_hri_value,
                ranked.confidence_score,
                ranked.model_version,
                ranked.warning_state,
                ranked.prediction_warning,
                ranked.guardrail_action,
                ranked.threshold_warning_level,
                ranked.out_of_distribution,
                ranked.out_of_distribution_features,
                ranked.prediction_timestamp,
                ranked.hive_id
            FROM (
                SELECT
                    p.*,
                    sl.hive_id,
                    ROW_NUMBER() OVER (
                        PARTITION BY sl.hive_id
                        ORDER BY p.prediction_timestamp DESC
                    ) AS rn
                FROM predictions p
                JOIN sensor_logs sl ON p.sensor_log_id = sl.id
            ) AS ranked
            WHERE ranked.rn = 1
        ');
    }

    public function down(): void
    {
        if (DB::connection()->getDriverName() !== 'mysql') {
            return;
        }

        DB::unprepared('DROP VIEW IF EXISTS vw_hive_latest_prediction');
        DB::unprepared('DROP VIEW IF EXISTS vw_harvest_summary_per_hive');
        DB::unprepared('DROP VIEW IF EXISTS vw_hive_sensor_daily_avg');
    }
};
