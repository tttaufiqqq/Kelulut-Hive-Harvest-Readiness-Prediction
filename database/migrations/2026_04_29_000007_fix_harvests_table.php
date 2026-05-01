<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Guard: create_harvests_table already includes updated_at on a fresh schema.
        if (Schema::hasColumn('harvests', 'updated_at')) {
            return;
        }

        Schema::table('harvests', function (Blueprint $table) {
            $table->timestamp('updated_at')->nullable()->after('created_at');
        });
    }

    public function down(): void
    {
        Schema::table('harvests', function (Blueprint $table) {
            $table->dropColumn('updated_at');
        });
    }
};
