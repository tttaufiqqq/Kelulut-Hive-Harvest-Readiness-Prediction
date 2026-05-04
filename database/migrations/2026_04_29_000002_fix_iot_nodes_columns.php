<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('iot_nodes', function (Blueprint $table) {
            // Guards: original migration was updated to use final column names,
            // so these old columns may not exist on a fresh schema.
            if (Schema::hasColumn('iot_nodes', 'registered_at')) {
                $table->renameColumn('registered_at', 'installation_date');
            }
            if (Schema::hasColumn('iot_nodes', 'status')) {
                $table->renameColumn('status', 'device_status');
            }
            if (! Schema::hasColumn('iot_nodes', 'last_maintenance_date')) {
                $table->date('last_maintenance_date')->nullable()->after('installation_date');
            }
        });
    }

    public function down(): void
    {
        Schema::table('iot_nodes', function (Blueprint $table) {
            if (Schema::hasColumn('iot_nodes', 'last_maintenance_date')) {
                $table->dropColumn('last_maintenance_date');
            }
            if (Schema::hasColumn('iot_nodes', 'device_status')) {
                $table->renameColumn('device_status', 'status');
            }
            if (Schema::hasColumn('iot_nodes', 'installation_date')) {
                $table->renameColumn('installation_date', 'registered_at');
            }
        });
    }
};
