<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // sensor_logs already has mq2/3/5/135_value column names in DB
        Schema::table('predictions', function (Blueprint $table) {
            $table->float('confidence_score')->after('hri_value');
        });
    }

    public function down(): void
    {
        Schema::table('predictions', function (Blueprint $table) {
            $table->dropColumn('confidence_score');
        });
    }
};
