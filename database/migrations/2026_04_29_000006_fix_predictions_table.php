<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('predictions', function (Blueprint $table) {
            $table->dropForeign(['hive_id']);
            $table->dropIndex(['hive_id', 'prediction_timestamp']);
            $table->dropColumn('hive_id');
        });
    }

    public function down(): void
    {
        Schema::table('predictions', function (Blueprint $table) {
            $table->foreignId('hive_id')->after('sensor_log_id')->constrained()->cascadeOnDelete();
            $table->index(['hive_id', 'prediction_timestamp']);
        });
    }
};
