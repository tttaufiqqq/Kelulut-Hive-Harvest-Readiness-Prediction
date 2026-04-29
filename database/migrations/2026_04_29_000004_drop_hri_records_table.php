<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::dropIfExists('hri_records');
    }

    public function down(): void
    {
        Schema::create('hri_records', function (Blueprint $table) {
            $table->id();
            $table->foreignId('hive_id')->constrained()->cascadeOnDelete();
            $table->foreignId('sensor_log_id')->constrained()->cascadeOnDelete();
            $table->float('hri_score');
            $table->string('hri_category', 50);
            $table->float('s_hum');
            $table->float('s_temp');
            $table->float('s_etoh');
            $table->float('s_co2');
            $table->float('s_ch4');
            $table->float('s_mq2');
            $table->timestamp('computed_at');
        });
    }
};
