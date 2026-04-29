<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('sensor_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('hive_id')->constrained()->cascadeOnDelete();
            $table->foreignId('device_id')->constrained('iot_nodes')->cascadeOnDelete();
            $table->float('temp');
            $table->float('humidity');
            $table->unsignedInteger('mq2_value');
            $table->unsignedInteger('mq3_value')->nullable();
            $table->unsignedInteger('mq5_value')->nullable();
            $table->unsignedInteger('mq135_value')->nullable();
            $table->timestamp('record_timestamp');
            $table->timestamp('created_at')->nullable();

            $table->index(['hive_id', 'record_timestamp']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('sensor_logs');
    }
};
