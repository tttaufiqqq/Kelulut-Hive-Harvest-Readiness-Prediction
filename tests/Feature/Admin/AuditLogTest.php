<?php

use App\Models\AuditLog;
use App\Models\Harvest;
use App\Models\Hive;
use App\Models\Inspection;
use App\Models\IotNode;
use App\Models\MasterFloraType;
use App\Models\MasterWeatherCondition;
use App\Models\User;
use Carbon\Carbon;
use Spatie\Permission\Models\Role;

beforeEach(function () {
    $this->withoutVite();
    Role::firstOrCreate(['name' => 'admin',     'guard_name' => 'web']);
    Role::firstOrCreate(['name' => 'beekeeper', 'guard_name' => 'web']);
});

// ── Helpers ────────────────────────────────────────────────────────────────

function auditAdmin(): User
{
    $admin = User::factory()->create();
    $admin->assignRole('admin');
    return $admin;
}

function auditBeekeeper(): User
{
    $bk = User::factory()->create();
    $bk->assignRole('beekeeper');
    return $bk;
}

function auditHive(User $beekeeper): Hive
{
    return Hive::factory()->create(['beekeeper_id' => $beekeeper->id]);
}

function inspectionPayload(int $hiveId, int $weatherId, int $floraId): array
{
    return [
        'hive_id'                    => $hiveId,
        'inspection_date'            => today()->toDateString(),
        'blooming_status'            => 'peak_bloom',
        'vegetation_density'         => 'moderate',
        'nectar_source_availability' => 'abundant',
        'structural_damage'          => 'none',
        'food_source_observation'    => 'Good foraging activity observed.',
        'notes'                      => 'Hive looks healthy.',
        'weather_ids'                => [$weatherId],
        'flora_ids'                  => [$floraId],
    ];
}

// ── Hive ───────────────────────────────────────────────────────────────────

test('hive created — writes created row with snapshot, no excluded fields, correct user', function () {
    $admin = auditAdmin();
    $beekeeper = auditBeekeeper();

    $this->actingAs($admin)->post(route('admin.hives.store'), [
        'name'         => 'Audit Hive',
        'beekeeper_id' => $beekeeper->id,
    ]);

    $log = AuditLog::where('auditable_type', 'Hive')->where('event', 'created')->latest()->first();

    expect($log)->not->toBeNull()
        ->and($log->old_values)->toBeNull()
        ->and($log->new_values)->toMatchArray(['name' => 'Audit Hive'])
        ->and($log->new_values)->not->toHaveKey('created_at')
        ->and($log->new_values)->not->toHaveKey('updated_at')
        ->and($log->new_values)->not->toHaveKey('image_path')
        ->and($log->user_id)->toBe($admin->id);
});

test('hive updated — writes updated row with only dirty fields, no timestamps', function () {
    $admin = auditAdmin();
    $beekeeper = auditBeekeeper();
    $hive = Hive::factory()->create(['name' => 'Old Name', 'beekeeper_id' => $beekeeper->id]);

    $this->actingAs($admin)->patch(route('admin.hives.update', $hive), [
        'name'         => 'New Name',
        'beekeeper_id' => $beekeeper->id,
        'status'       => 'active',
    ]);

    $log = AuditLog::where('auditable_type', 'Hive')
        ->where('event', 'updated')
        ->where('auditable_id', $hive->id)
        ->latest()->first();

    expect($log)->not->toBeNull()
        ->and($log->old_values)->toMatchArray(['name' => 'Old Name'])
        ->and($log->new_values)->toMatchArray(['name' => 'New Name'])
        ->and($log->new_values)->not->toHaveKey('updated_at')
        ->and($log->new_values)->not->toHaveKey('created_at');
});

test('hive deleted — writes deleted row with old snapshot, null new_values, no excluded fields', function () {
    $admin = auditAdmin();
    $beekeeper = auditBeekeeper();
    $hive = auditHive($beekeeper);
    $hiveId = $hive->id;
    $hiveName = $hive->name;

    $this->actingAs($admin)->delete(route('admin.hives.destroy', $hive));

    $log = AuditLog::where('auditable_type', 'Hive')
        ->where('event', 'deleted')
        ->where('auditable_id', $hiveId)
        ->first();

    expect($log)->not->toBeNull()
        ->and($log->new_values)->toBeNull()
        ->and($log->old_values)->toMatchArray(['name' => $hiveName])
        ->and($log->old_values)->not->toHaveKey('image_path')
        ->and($log->old_values)->not->toHaveKey('created_at')
        ->and($log->old_values)->not->toHaveKey('updated_at');
});

test('hive touch-only update — does not write an audit row', function () {
    $beekeeper = auditBeekeeper();
    $hive = auditHive($beekeeper);
    $before = AuditLog::where('auditable_type', 'Hive')->where('event', 'updated')->where('auditable_id', $hive->id)->count();

    $hive->touch();

    expect(AuditLog::where('auditable_type', 'Hive')->where('event', 'updated')->where('auditable_id', $hive->id)->count())
        ->toBe($before);
});

// ── IotNode ────────────────────────────────────────────────────────────────

test('iot node created — writes created row', function () {
    $admin = auditAdmin();
    $beekeeper = auditBeekeeper();
    $hive = auditHive($beekeeper);

    $this->actingAs($admin)->post(route('admin.devices.store'), [
        'hive_id'           => $hive->id,
        'device_status'     => 'active',
        'installation_date' => '2026-01-01',
    ]);

    $node = IotNode::where('hive_id', $hive->id)->first();
    $log = AuditLog::where('auditable_type', 'IotNode')->where('event', 'created')->where('auditable_id', $node->id)->first();

    expect($log)->not->toBeNull()
        ->and($log->old_values)->toBeNull()
        ->and($log->new_values)->toMatchArray(['device_status' => 'active'])
        ->and($log->user_id)->toBe($admin->id);
});

test('iot node updated — writes updated row with dirty fields only', function () {
    $admin = auditAdmin();
    $beekeeper = auditBeekeeper();
    $hive = auditHive($beekeeper);

    $node = IotNode::create([
        'hive_id'           => $hive->id,
        'node_identifier'   => 'NODE-TEST01',
        'device_status'     => 'active',
        'installation_date' => '2026-01-01',
    ]);

    $this->actingAs($admin)->patch(route('admin.devices.update', $node), [
        'hive_id'           => $hive->id,
        'device_status'     => 'inactive',
        'installation_date' => '2026-01-01',
    ]);

    $log = AuditLog::where('auditable_type', 'IotNode')
        ->where('event', 'updated')
        ->where('auditable_id', $node->id)
        ->first();

    expect($log)->not->toBeNull()
        ->and($log->old_values)->toMatchArray(['device_status' => 'active'])
        ->and($log->new_values)->toMatchArray(['device_status' => 'inactive']);
});

test('iot node deleted — writes deleted row with old snapshot', function () {
    $admin = auditAdmin();
    $beekeeper = auditBeekeeper();
    $hive = auditHive($beekeeper);

    $node = IotNode::create([
        'hive_id'           => $hive->id,
        'node_identifier'   => 'NODE-TEST02',
        'device_status'     => 'active',
        'installation_date' => '2026-01-01',
    ]);
    $nodeId = $node->id;

    $this->actingAs($admin)->delete(route('admin.devices.destroy', $node));

    $log = AuditLog::where('auditable_type', 'IotNode')->where('event', 'deleted')->where('auditable_id', $nodeId)->first();

    expect($log)->not->toBeNull()
        ->and($log->new_values)->toBeNull()
        ->and($log->old_values)->toMatchArray(['node_identifier' => 'NODE-TEST02']);
});

// ── Harvest ────────────────────────────────────────────────────────────────

test('harvest created — stores beekeeper user_id', function () {
    $beekeeper = auditBeekeeper();
    $hive = auditHive($beekeeper);

    $this->actingAs($beekeeper)->post(route('harvests.store'), [
        'hive_id'      => $hive->id,
        'harvest_date' => today()->toDateString(),
        'weight'       => 1.5,
    ]);

    $log = AuditLog::where('auditable_type', 'Harvest')->where('event', 'created')->latest()->first();

    expect($log)->not->toBeNull()
        ->and($log->user_id)->toBe($beekeeper->id);
});

test('harvest updated — writes updated row with changed fields only', function () {
    $beekeeper = auditBeekeeper();
    $hive = auditHive($beekeeper);

    $harvest = Harvest::create([
        'hive_id'      => $hive->id,
        'beekeeper_id' => $beekeeper->id,
        'harvest_date' => today()->toDateString(),
        'weight'       => 1.5,
    ]);

    $this->actingAs($beekeeper)->patch(route('harvests.update', $harvest), [
        'harvest_date' => today()->toDateString(),
        'weight'       => 3.0,
    ]);

    $log = AuditLog::where('auditable_type', 'Harvest')
        ->where('event', 'updated')
        ->where('auditable_id', $harvest->id)
        ->first();

    expect($log)->not->toBeNull()
        ->and($log->old_values)->toHaveKey('weight')
        ->and($log->new_values)->toMatchArray(['weight' => 3.0]);
});

test('harvest deleted — writes deleted row with null new_values', function () {
    $beekeeper = auditBeekeeper();
    $hive = auditHive($beekeeper);

    $harvest = Harvest::create([
        'hive_id'      => $hive->id,
        'beekeeper_id' => $beekeeper->id,
        'harvest_date' => today()->toDateString(),
        'weight'       => 1.5,
    ]);
    $harvestId = $harvest->id;

    $this->actingAs($beekeeper)->delete(route('harvests.destroy', $harvest));

    $log = AuditLog::where('auditable_type', 'Harvest')->where('event', 'deleted')->where('auditable_id', $harvestId)->first();

    expect($log)->not->toBeNull()
        ->and($log->new_values)->toBeNull()
        ->and($log->old_values)->toHaveKey('weight');
});

// ── Inspection ─────────────────────────────────────────────────────────────

test('inspection created — writes created row with beekeeper user_id', function () {
    $beekeeper = auditBeekeeper();
    $hive = auditHive($beekeeper);
    $weather = MasterWeatherCondition::create(['name' => 'Sunny']);
    $flora = MasterFloraType::create(['name' => 'Acacia']);

    $this->actingAs($beekeeper)->post(route('inspections.store'), inspectionPayload($hive->id, $weather->id, $flora->id));

    $inspection = Inspection::where('hive_id', $hive->id)->first();
    $log = AuditLog::where('auditable_type', 'Inspection')->where('event', 'created')->where('auditable_id', $inspection->id)->first();

    expect($log)->not->toBeNull()
        ->and($log->old_values)->toBeNull()
        ->and($log->new_values)->toMatchArray(['blooming_status' => 'peak_bloom'])
        ->and($log->user_id)->toBe($beekeeper->id);
});

test('inspection updated — writes updated row with dirty fields only', function () {
    $beekeeper = auditBeekeeper();
    $hive = auditHive($beekeeper);
    $weather = MasterWeatherCondition::create(['name' => 'Cloudy']);
    $flora = MasterFloraType::create(['name' => 'Rambutan']);

    $inspection = Inspection::create([
        'hive_id'                    => $hive->id,
        'beekeeper_id'               => $beekeeper->id,
        'inspection_date'            => today()->toDateString(),
        'blooming_status'            => 'early_bloom',
        'vegetation_density'         => 'sparse',
        'nectar_source_availability' => 'scarce',
        'structural_damage'          => 'none',
        'food_source_observation'    => 'Low activity.',
        'notes'                      => 'Needs monitoring.',
    ]);

    $this->actingAs($beekeeper)->patch(route('inspections.update', $inspection), array_merge(
        inspectionPayload($hive->id, $weather->id, $flora->id),
        ['blooming_status' => 'peak_bloom', 'vegetation_density' => 'dense'],
    ));

    $log = AuditLog::where('auditable_type', 'Inspection')
        ->where('event', 'updated')
        ->where('auditable_id', $inspection->id)
        ->latest()->first();

    expect($log)->not->toBeNull()
        ->and($log->old_values)->toMatchArray(['blooming_status' => 'early_bloom'])
        ->and($log->new_values)->toMatchArray(['blooming_status' => 'peak_bloom']);
});

test('inspection deleted — writes deleted row with null new_values', function () {
    $beekeeper = auditBeekeeper();
    $hive = auditHive($beekeeper);

    $inspection = Inspection::create([
        'hive_id'                    => $hive->id,
        'beekeeper_id'               => $beekeeper->id,
        'inspection_date'            => today()->toDateString(),
        'blooming_status'            => 'peak_bloom',
        'vegetation_density'         => 'moderate',
        'nectar_source_availability' => 'abundant',
        'structural_damage'          => 'none',
        'food_source_observation'    => 'Good.',
        'notes'                      => 'Healthy.',
    ]);
    $inspectionId = $inspection->id;

    $this->actingAs($beekeeper)->delete(route('inspections.destroy', $inspection));

    $log = AuditLog::where('auditable_type', 'Inspection')->where('event', 'deleted')->where('auditable_id', $inspectionId)->first();

    expect($log)->not->toBeNull()
        ->and($log->new_values)->toBeNull()
        ->and($log->old_values)->toHaveKey('blooming_status');
});

// ── Edge cases ─────────────────────────────────────────────────────────────

test('user_id is null when no authenticated user triggers model event', function () {
    $beekeeper = auditBeekeeper();
    // No actingAs — simulates a seeder, queue job, or console command
    $hive = Hive::factory()->create(['beekeeper_id' => $beekeeper->id]);

    $log = AuditLog::where('auditable_type', 'Hive')->where('event', 'created')->where('auditable_id', $hive->id)->first();

    expect($log)->not->toBeNull()
        ->and($log->user_id)->toBeNull();
});

// ── AuditLogController — access ────────────────────────────────────────────

test('admin can view audit log page', function () {
    $admin = auditAdmin();

    $this->actingAs($admin)
        ->get(route('admin.audit-logs.index'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page->component('admin/audit-logs/index'));
});

test('beekeeper cannot access audit log page', function () {
    $beekeeper = auditBeekeeper();

    $this->actingAs($beekeeper)
        ->get(route('admin.audit-logs.index'))
        ->assertRedirect(route('dashboard'));
});

// ── AuditLogController — filters ───────────────────────────────────────────

test('event filter returns only matching event rows', function () {
    $admin = auditAdmin();

    AuditLog::create(['user_id' => $admin->id, 'event' => 'created', 'auditable_type' => 'Hive', 'auditable_id' => 1, 'old_values' => null, 'new_values' => ['name' => 'A']]);
    AuditLog::create(['user_id' => $admin->id, 'event' => 'deleted', 'auditable_type' => 'Hive', 'auditable_id' => 1, 'old_values' => ['name' => 'A'], 'new_values' => null]);

    $this->actingAs($admin)
        ->get(route('admin.audit-logs.index', ['event' => 'created']))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->where('logs.total', 1)
            ->where('logs.data.0.event', 'created')
        );
});

test('model filter returns only matching model rows', function () {
    $admin = auditAdmin();

    AuditLog::create(['user_id' => $admin->id, 'event' => 'created', 'auditable_type' => 'Hive',    'auditable_id' => 1, 'old_values' => null, 'new_values' => ['name' => 'H']]);
    AuditLog::create(['user_id' => $admin->id, 'event' => 'created', 'auditable_type' => 'Harvest', 'auditable_id' => 1, 'old_values' => null, 'new_values' => ['weight' => 1.0]]);

    $this->actingAs($admin)
        ->get(route('admin.audit-logs.index', ['model' => 'Hive']))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->where('logs.total', 1)
            ->where('logs.data.0.auditable_type', 'Hive')
        );
});

test('date filter returns only rows from that specific day', function () {
    $admin = auditAdmin();

    $yesterday   = Carbon::yesterday();
    $twoDaysAgo  = Carbon::now()->subDays(2);
    $fiveDaysAgo = Carbon::now()->subDays(5);

    AuditLog::create(['user_id' => $admin->id, 'event' => 'created', 'auditable_type' => 'Hive', 'auditable_id' => 1, 'old_values' => null, 'new_values' => ['name' => 'A'], 'created_at' => $yesterday]);
    AuditLog::create(['user_id' => $admin->id, 'event' => 'created', 'auditable_type' => 'Hive', 'auditable_id' => 2, 'old_values' => null, 'new_values' => ['name' => 'B'], 'created_at' => $twoDaysAgo]);
    AuditLog::create(['user_id' => $admin->id, 'event' => 'created', 'auditable_type' => 'Hive', 'auditable_id' => 3, 'old_values' => null, 'new_values' => ['name' => 'C'], 'created_at' => $fiveDaysAgo]);

    $this->actingAs($admin)
        ->get(route('admin.audit-logs.index', ['date' => $yesterday->toDateString()]))
        ->assertOk()
        ->assertInertia(fn ($page) => $page->where('logs.total', 1));
});

test('date filter rejects future dates with a validation error', function () {
    $admin = auditAdmin();

    $this->actingAs($admin)
        ->get(route('admin.audit-logs.index', ['date' => Carbon::tomorrow()->toDateString()]))
        ->assertInvalid(['date']);
});
