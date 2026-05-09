<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('predictions', function (Blueprint $table) {
            $table->index('prediction_timestamp', 'idx_predictions_prediction_timestamp');
        });

        Schema::table('harvests', function (Blueprint $table) {
            $table->index(['hive_id', 'harvest_date'], 'idx_harvests_hive_id_harvest_date');
        });

        Schema::table('sensor_logs', function (Blueprint $table) {
            $table->index('record_timestamp', 'idx_sensor_logs_record_timestamp');
        });
    }

    public function down(): void
    {
        Schema::table('predictions', function (Blueprint $table) {
            $table->dropIndex('idx_predictions_prediction_timestamp');
        });

        Schema::table('harvests', function (Blueprint $table) {
            $table->dropIndex('idx_harvests_hive_id_harvest_date');
        });

        Schema::table('sensor_logs', function (Blueprint $table) {
            $table->dropIndex('idx_sensor_logs_record_timestamp');
        });
    }
};
