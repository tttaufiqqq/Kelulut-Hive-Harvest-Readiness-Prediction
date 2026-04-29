<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('hives', function (Blueprint $table) {
            if (!Schema::hasColumn('hives', 'beekeeper_id')) {
                $table->unsignedBigInteger('beekeeper_id')->nullable()->after('id');
            }
            if (!Schema::hasColumn('hives', 'site_id')) {
                $table->foreignId('site_id')->nullable()->after('beekeeper_id')
                      ->constrained('master_sites')->nullOnDelete();
            }
            if (!Schema::hasColumn('hives', 'species_id')) {
                $table->foreignId('species_id')->nullable()->after('site_id')
                      ->constrained('master_species')->nullOnDelete();
            }
            if (!Schema::hasColumn('hives', 'image_path')) {
                $table->string('image_path')->nullable()->after('name');
            }
            if (!Schema::hasColumn('hives', 'status')) {
                $table->enum('status', ['active', 'inactive'])->default('active')->after('image_path');
            }
        });

        if (Schema::hasColumn('hives', 'user_id')) {
            DB::statement('UPDATE hives SET beekeeper_id = user_id WHERE beekeeper_id IS NULL');
        }

        Schema::table('hives', function (Blueprint $table) {
            $table->unsignedBigInteger('beekeeper_id')->nullable(false)->change();

            $fks = collect(Schema::getForeignKeys('hives'))->pluck('name');
            if (!$fks->contains('hives_beekeeper_id_foreign')) {
                $table->foreign('beekeeper_id')->references('id')->on('users')->cascadeOnDelete();
            }
            if ($fks->contains('hives_user_id_foreign')) {
                $table->dropForeign('hives_user_id_foreign');
            }

            $cols = Schema::getColumnListing('hives');
            $toDrop = array_intersect($cols, ['user_id', 'location', 'gps_lat', 'gps_lng',
                                              'colony_strength', 'queen_status', 'brood_status']);
            if (!empty($toDrop)) {
                $table->dropColumn($toDrop);
            }
        });
    }

    public function down(): void
    {
        Schema::table('hives', function (Blueprint $table) {
            $table->dropForeign(['beekeeper_id']);
            $table->dropForeign(['site_id']);
            $table->dropForeign(['species_id']);
            $table->dropColumn(['beekeeper_id', 'site_id', 'species_id', 'image_path', 'status']);
            $table->unsignedBigInteger('user_id')->nullable()->after('id');
            $table->string('location')->nullable();
            $table->decimal('gps_lat', 10, 7)->nullable();
            $table->decimal('gps_lng', 10, 7)->nullable();
            $table->string('colony_strength')->nullable();
            $table->string('queen_status')->nullable();
            $table->string('brood_status')->nullable();
        });
    }
};
