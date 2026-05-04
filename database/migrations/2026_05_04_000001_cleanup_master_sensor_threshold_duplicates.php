<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        DB::transaction(function () {
            $duplicateGroups = DB::table('master_sensor_thresholds')
                ->select(
                    'sensor_type',
                    'level',
                    DB::raw('MIN(id) as canonical_id'),
                    DB::raw('GROUP_CONCAT(id ORDER BY id) as ids'),
                    DB::raw('COUNT(*) as total'),
                )
                ->groupBy('sensor_type', 'level')
                ->having('total', '>', 1)
                ->lockForUpdate()
                ->get();

            foreach ($duplicateGroups as $group) {
                $ids = collect(explode(',', (string) $group->ids))
                    ->map(fn (string $id) => (int) $id)
                    ->filter();

                $canonicalId = (int) $group->canonical_id;
                $duplicateIds = $ids
                    ->reject(fn (int $id) => $id === $canonicalId)
                    ->values();

                foreach ($duplicateIds as $duplicateId) {
                    DB::table('sensor_log_thresholds as duplicate_links')
                        ->join('sensor_log_thresholds as canonical_links', function ($join) use ($canonicalId) {
                            $join->on('duplicate_links.sensor_log_id', '=', 'canonical_links.sensor_log_id')
                                ->where('canonical_links.threshold_id', '=', $canonicalId);
                        })
                        ->where('duplicate_links.threshold_id', $duplicateId)
                        ->delete();

                    DB::table('sensor_log_thresholds')
                        ->where('threshold_id', $duplicateId)
                        ->update(['threshold_id' => $canonicalId]);
                }

                DB::table('master_sensor_thresholds')
                    ->whereIn('id', $duplicateIds->all())
                    ->delete();
            }
        });

        Schema::table('master_sensor_thresholds', function (Blueprint $table) {
            $table->unique(
                ['sensor_type', 'level'],
                'master_sensor_thresholds_sensor_type_level_unique',
            );
        });
    }

    public function down(): void
    {
        Schema::table('master_sensor_thresholds', function (Blueprint $table) {
            $table->dropUnique('master_sensor_thresholds_sensor_type_level_unique');
        });
    }
};
