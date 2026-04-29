<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('predictions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('sensor_log_id')->constrained()->cascadeOnDelete();
            $table->string('readiness_level', 50);
            $table->float('hri_value');
            $table->timestamp('prediction_timestamp');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('predictions');
    }
};
