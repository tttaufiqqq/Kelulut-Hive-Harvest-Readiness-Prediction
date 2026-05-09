<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('sensor_logs', function (Blueprint $table) {
            $table->float('temp')->nullable()->change();
            $table->float('humidity')->nullable()->change();
            $table->unsignedInteger('mq2_value')->nullable()->change();
        });
    }

    public function down(): void
    {
        Schema::table('sensor_logs', function (Blueprint $table) {
            if (Schema::hasColumn('sensor_logs', 'temp')) {
                $table->float('temp')->nullable(false)->change();
            }
            if (Schema::hasColumn('sensor_logs', 'humidity')) {
                $table->float('humidity')->nullable(false)->change();
            }
            if (Schema::hasColumn('sensor_logs', 'mq2_value')) {
                $table->unsignedInteger('mq2_value')->nullable(false)->change();
            }
        });
    }
};
