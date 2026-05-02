<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('hri_summary', function (Blueprint $table) {
            $table->float('avg_mq3')->nullable()->after('avg_mq2');
            $table->float('avg_mq5')->nullable()->after('avg_mq3');
            $table->float('avg_mq135')->nullable()->after('avg_mq5');
        });
    }

    public function down(): void
    {
        Schema::table('hri_summary', function (Blueprint $table) {
            $table->dropColumn(['avg_mq3', 'avg_mq5', 'avg_mq135']);
        });
    }
};
