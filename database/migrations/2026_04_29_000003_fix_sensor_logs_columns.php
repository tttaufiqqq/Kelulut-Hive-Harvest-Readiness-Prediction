<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('sensor_logs', function (Blueprint $table) {
            // Guards: original migration was updated to use final column names,
            // so these old columns may not exist on a fresh schema.
            if (Schema::hasColumn('sensor_logs', 'iot_node_id')) {
                $table->renameColumn('iot_node_id', 'device_id');
            }
            if (Schema::hasColumn('sensor_logs', 'recorded_at')) {
                $table->renameColumn('recorded_at', 'record_timestamp');
            }
        });
    }

    public function down(): void
    {
        Schema::table('sensor_logs', function (Blueprint $table) {
            if (Schema::hasColumn('sensor_logs', 'record_timestamp')) {
                $table->renameColumn('record_timestamp', 'recorded_at');
            }
            if (Schema::hasColumn('sensor_logs', 'device_id')) {
                $table->renameColumn('device_id', 'iot_node_id');
            }
        });
    }
};
