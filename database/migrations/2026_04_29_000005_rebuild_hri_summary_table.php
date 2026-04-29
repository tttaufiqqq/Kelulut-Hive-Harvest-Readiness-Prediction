<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::dropIfExists('hive_summary');

        Schema::create('hri_summary', function (Blueprint $table) {
            $table->id();
            $table->foreignId('hive_id')->constrained('hives')->cascadeOnDelete();
            $table->date('summary_date');
            $table->float('avg_temperature')->nullable();
            $table->float('avg_humidity')->nullable();
            $table->float('avg_mq2')->nullable();
            $table->unsignedInteger('harvest_count')->default(0);
            $table->string('latest_readiness_level', 50)->nullable();
            $table->float('avg_hri_value')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('hri_summary');

        Schema::create('hive_summary', function (Blueprint $table) {
            $table->id();
            $table->foreignId('hive_id')->constrained()->cascadeOnDelete()->unique();
            $table->float('latest_hri_score')->nullable();
            $table->string('latest_category', 50)->nullable();
            $table->float('avg_hri_7d')->nullable();
            $table->float('avg_hri_30d')->nullable();
            $table->date('last_harvest_date')->nullable();
            $table->unsignedInteger('total_harvests')->default(0);
            $table->timestamp('updated_at')->nullable();
        });
    }
};
