<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('iot_nodes', function (Blueprint $table) {
            $table->renameColumn('registered_at', 'installation_date');
            $table->renameColumn('status', 'device_status');
            $table->date('last_maintenance_date')->nullable()->after('installation_date');
        });
    }

    public function down(): void
    {
        Schema::table('iot_nodes', function (Blueprint $table) {
            $table->dropColumn('last_maintenance_date');
            $table->renameColumn('device_status', 'status');
            $table->renameColumn('installation_date', 'registered_at');
        });
    }
};
