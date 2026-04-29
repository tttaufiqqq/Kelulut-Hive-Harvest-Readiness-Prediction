<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('sensor_logs', function (Blueprint $table) {
            $table->renameColumn('iot_node_id', 'device_id');
            $table->renameColumn('recorded_at', 'record_timestamp');
        });
    }

    public function down(): void
    {
        Schema::table('sensor_logs', function (Blueprint $table) {
            $table->renameColumn('record_timestamp', 'recorded_at');
            $table->renameColumn('device_id', 'iot_node_id');
        });
    }
};
