<?php

namespace Database\Seeders;

use Carbon\Carbon;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class AuditLogSeeder extends Seeder
{
    public function run(): void
    {
        $alreadySeeded = DB::table('audit_logs')
            ->where('auditable_type', 'Hive')
            ->where('event', 'deleted')
            ->whereRaw("JSON_UNQUOTE(JSON_EXTRACT(old_values, '$.name')) = 'Test Hive Alpha'")
            ->exists();

        if ($alreadySeeded) {
            $this->command->warn('AuditLogSeeder: already seeded, skipping.');
            return;
        }

        $admin      = DB::table('users')->where('email', 'admin@buzzyhive.urban-alert.com')->first();
        $beekeepers = DB::table('users')
            ->where('email', '!=', 'admin@buzzyhive.urban-alert.com')
            ->orderBy('id')
            ->get()
            ->values();

        if (! $admin) {
            $this->command->error('Admin user not found. Run DatabaseSeeder first.');
            return;
        }

        $hives       = DB::table('hives')->orderBy('id')->get();
        $nodes       = DB::table('iot_nodes')->orderBy('id')->get();
        $harvests    = DB::table('harvests')->orderBy('id')->get();
        $inspections = DB::table('inspections')->orderBy('id')->get();

        $rows = array_merge(
            $this->hiveAudits($hives, $admin, $beekeepers),
            $this->nodeAudits($nodes, $admin),
            $this->harvestAudits($harvests, $beekeepers),
            $this->inspectionAudits($inspections, $beekeepers),
        );

        foreach (array_chunk($rows, 200) as $chunk) {
            DB::table('audit_logs')->insert($chunk);
        }

        $this->command->info('AuditLogSeeder: ' . count($rows) . ' audit entries inserted.');
    }

    // ── Hives ─────────────────────────────────────────────────────────────

    private function hiveAudits($hives, $admin, $beekeepers): array
    {
        $rows = [];

        // created: all hives
        foreach ($hives as $hive) {
            $ts     = Carbon::parse($hive->created_at)->addSeconds(rand(2, 10));
            $rows[] = $this->entry(
                $admin->id, 'created', 'Hive', $hive->id,
                null,
                ['id' => $hive->id, 'beekeeper_id' => $hive->beekeeper_id, 'site_id' => $hive->site_id, 'species_id' => $hive->species_id, 'name' => $hive->name, 'status' => $hive->status],
                $ts
            );
        }

        // updated: status toggled to maintenance then restored on 4 hives
        foreach ($hives->random(4) as $hive) {
            $ts = Carbon::parse($hive->created_at)->addDays(rand(14, 60));
            $rows[] = $this->entry(
                $admin->id, 'updated', 'Hive', $hive->id,
                ['status' => 'active'],
                ['status' => 'maintenance'],
                $ts
            );
            $rows[] = $this->entry(
                $admin->id, 'updated', 'Hive', $hive->id,
                ['status' => 'maintenance'],
                ['status' => 'active'],
                $ts->copy()->addDays(rand(3, 10))
            );
        }

        // updated: name corrected on 3 hives
        foreach ($hives->random(3) as $hive) {
            $ts = Carbon::parse($hive->created_at)->addDays(rand(1, 7));
            $rows[] = $this->entry(
                $admin->id, 'updated', 'Hive', $hive->id,
                ['name' => $hive->name . ' (Old)'],
                ['name' => $hive->name],
                $ts
            );
        }

        // deleted: 2 synthetic hives (demo of the event type)
        $maxId = $hives->max('id');
        $bk0   = $beekeepers->get(0);
        $bk1   = $beekeepers->get(1);

        $rows[] = $this->entry(
            $admin->id, 'deleted', 'Hive', $maxId + 1,
            ['id' => $maxId + 1, 'beekeeper_id' => $bk0?->id, 'site_id' => 1, 'species_id' => 1, 'name' => 'Test Hive Alpha', 'status' => 'inactive'],
            null,
            Carbon::parse('2025-03-15 11:30:00')
        );
        $rows[] = $this->entry(
            $admin->id, 'deleted', 'Hive', $maxId + 2,
            ['id' => $maxId + 2, 'beekeeper_id' => $bk1?->id, 'site_id' => 2, 'species_id' => 2, 'name' => 'Pilot Hive Beta', 'status' => 'inactive'],
            null,
            Carbon::parse('2025-03-15 13:45:00')
        );

        return $rows;
    }

    // ── IoT Nodes ─────────────────────────────────────────────────────────

    private function nodeAudits($nodes, $admin): array
    {
        $rows = [];

        // created: all nodes
        foreach ($nodes as $node) {
            $ts     = Carbon::parse($node->created_at ?? '2025-01-01 08:00:00')->addSeconds(rand(2, 10));
            $rows[] = $this->entry(
                $admin->id, 'created', 'IotNode', $node->id,
                null,
                ['id' => $node->id, 'hive_id' => $node->hive_id, 'node_identifier' => $node->node_identifier, 'device_status' => $node->device_status, 'installation_date' => $node->installation_date, 'last_maintenance_date' => null],
                $ts
            );
        }

        // updated: maintenance date recorded on 5 nodes
        foreach ($nodes->random(5) as $node) {
            $maintDate = Carbon::parse('2025-06-01')->addDays(rand(0, 30));
            $rows[] = $this->entry(
                $admin->id, 'updated', 'IotNode', $node->id,
                ['last_maintenance_date' => null],
                ['last_maintenance_date' => $maintDate->toDateString()],
                $maintDate->copy()->addMinutes(rand(5, 60))
            );
        }

        // updated: device_status toggled offline then restored on 2 nodes
        foreach ($nodes->random(2) as $node) {
            $ts = Carbon::parse('2025-04-10')->addDays(rand(0, 20));
            $rows[] = $this->entry(
                $admin->id, 'updated', 'IotNode', $node->id,
                ['device_status' => 'active'],
                ['device_status' => 'inactive'],
                $ts
            );
            $rows[] = $this->entry(
                $admin->id, 'updated', 'IotNode', $node->id,
                ['device_status' => 'inactive'],
                ['device_status' => 'active'],
                $ts->copy()->addDays(rand(1, 5))
            );
        }

        return $rows;
    }

    // ── Harvests ──────────────────────────────────────────────────────────

    private function harvestAudits($harvests, $beekeepers): array
    {
        $bkById = $beekeepers->keyBy('id');
        $rows   = [];

        // created: all harvests
        foreach ($harvests as $harvest) {
            $userId = $bkById->has($harvest->beekeeper_id)
                ? $harvest->beekeeper_id
                : $beekeepers->first()->id;
            $ts     = Carbon::parse($harvest->created_at)->addSeconds(rand(2, 15));
            $rows[] = $this->entry(
                $userId, 'created', 'Harvest', $harvest->id,
                null,
                ['id' => $harvest->id, 'hive_id' => $harvest->hive_id, 'beekeeper_id' => $harvest->beekeeper_id, 'harvest_date' => $harvest->harvest_date, 'weight' => $harvest->weight, 'productivity_level' => $harvest->productivity_level, 'color_id' => $harvest->color_id, 'flavor_id' => $harvest->flavor_id, 'notes' => $harvest->notes],
                $ts
            );
        }

        // updated: weight corrected on 10 harvests
        foreach ($harvests->random(10) as $harvest) {
            $userId    = $bkById->has($harvest->beekeeper_id)
                ? $harvest->beekeeper_id
                : $beekeepers->first()->id;
            $ts        = Carbon::parse($harvest->created_at)->addHours(rand(1, 4));
            $oldWeight = $harvest->weight;
            $newWeight = max(100, $oldWeight + rand(-30, 30));
            $rows[]    = $this->entry(
                $userId, 'updated', 'Harvest', $harvest->id,
                ['weight' => $oldWeight],
                ['weight' => $newWeight],
                $ts
            );
        }

        return $rows;
    }

    // ── Inspections ───────────────────────────────────────────────────────

    private function inspectionAudits($inspections, $beekeepers): array
    {
        $bkById = $beekeepers->keyBy('id');
        $rows   = [];

        // created: all inspections
        foreach ($inspections as $inspection) {
            $userId = $bkById->has($inspection->beekeeper_id)
                ? $inspection->beekeeper_id
                : $beekeepers->first()->id;
            $ts     = Carbon::parse($inspection->created_at)->addSeconds(rand(2, 20));
            $rows[] = $this->entry(
                $userId, 'created', 'Inspection', $inspection->id,
                null,
                ['id' => $inspection->id, 'hive_id' => $inspection->hive_id, 'beekeeper_id' => $inspection->beekeeper_id, 'notes' => $inspection->notes, 'blooming_status' => $inspection->blooming_status, 'vegetation_density' => $inspection->vegetation_density, 'nectar_source_availability' => $inspection->nectar_source_availability, 'structural_damage' => $inspection->structural_damage, 'food_source_observation' => $inspection->food_source_observation, 'inspection_date' => $inspection->inspection_date],
                $ts
            );
        }

        // updated: notes amended on 15 inspections
        foreach ($inspections->random(15) as $inspection) {
            $userId = $bkById->has($inspection->beekeeper_id)
                ? $inspection->beekeeper_id
                : $beekeepers->first()->id;
            $ts     = Carbon::parse($inspection->created_at)->addMinutes(rand(10, 90));
            $rows[] = $this->entry(
                $userId, 'updated', 'Inspection', $inspection->id,
                ['notes' => $inspection->notes],
                ['notes' => $inspection->notes . ' Updated after review.'],
                $ts
            );
        }

        return $rows;
    }

    // ── Helper ────────────────────────────────────────────────────────────

    private function entry(
        ?int $userId,
        string $event,
        string $model,
        int $auditableId,
        ?array $old,
        ?array $new,
        Carbon $ts
    ): array {
        $safeTs = $ts->gt(Carbon::now()) ? Carbon::now() : $ts;

        return [
            'user_id'        => $userId,
            'event'          => $event,
            'auditable_type' => $model,
            'auditable_id'   => $auditableId,
            'old_values'     => $old !== null ? json_encode($old) : null,
            'new_values'     => $new !== null ? json_encode($new) : null,
            'created_at'     => $safeTs->toDateTimeString(),
        ];
    }
}
