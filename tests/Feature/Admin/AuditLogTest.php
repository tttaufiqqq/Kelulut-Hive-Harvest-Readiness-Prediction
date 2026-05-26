<?php

use App\Models\AuditLog;
use App\Models\Hive;
use App\Models\Harvest;
use App\Models\User;
use Spatie\Permission\Models\Role;

beforeEach(function () {
    $this->withoutVite();
    Role::firstOrCreate(['name' => 'admin',     'guard_name' => 'web']);
    Role::firstOrCreate(['name' => 'beekeeper', 'guard_name' => 'web']);
});

// ── Auditable trait ────────────────────────────────────────────────────────

test('creating a hive writes a created audit log row', function () {
    $admin = User::factory()->create();
    $admin->assignRole('admin');

    $beekeeper = User::factory()->create();
    $beekeeper->assignRole('beekeeper');

    $this->actingAs($admin)->post(route('admin.hives.store'), [
        'name'         => 'Audit Hive',
        'beekeeper_id' => $beekeeper->id,
    ]);

    $log = AuditLog::where('auditable_type', 'Hive')
        ->where('event', 'created')
        ->latest()
        ->first();

    expect($log)->not->toBeNull()
        ->and($log->old_values)->toBeNull()
        ->and($log->new_values)->toMatchArray(['name' => 'Audit Hive'])
        ->and($log->user_id)->toBe($admin->id);
});

test('updating a hive writes an updated row with only dirty fields', function () {
    $admin = User::factory()->create();
    $admin->assignRole('admin');

    $beekeeper = User::factory()->create();
    $beekeeper->assignRole('beekeeper');

    $hive = Hive::factory()->create(['name' => 'Old Name', 'beekeeper_id' => $beekeeper->id]);

    $this->actingAs($admin)->patch(route('admin.hives.update', $hive), [
        'name'         => 'New Name',
        'beekeeper_id' => $beekeeper->id,
        'status'       => 'active',
    ]);

    $log = AuditLog::where('auditable_type', 'Hive')
        ->where('event', 'updated')
        ->where('auditable_id', $hive->id)
        ->latest()
        ->first();

    expect($log)->not->toBeNull()
        ->and($log->old_values)->toMatchArray(['name' => 'Old Name'])
        ->and($log->new_values)->toMatchArray(['name' => 'New Name'])
        ->and($log->new_values)->not->toHaveKey('updated_at');
});

test('deleting a hive writes a deleted row with old snapshot', function () {
    $admin = User::factory()->create();
    $admin->assignRole('admin');

    $beekeeper = User::factory()->create();
    $beekeeper->assignRole('beekeeper');

    $hive = Hive::factory()->create(['name' => 'Doomed Hive', 'beekeeper_id' => $beekeeper->id]);

    $this->actingAs($admin)->delete(route('admin.hives.destroy', $hive));

    $log = AuditLog::where('auditable_type', 'Hive')
        ->where('event', 'deleted')
        ->where('auditable_id', $hive->id)
        ->first();

    expect($log)->not->toBeNull()
        ->and($log->new_values)->toBeNull()
        ->and($log->old_values)->toMatchArray(['name' => 'Doomed Hive']);
});

test('update with only excluded fields does not write an audit row', function () {
    $beekeeper = User::factory()->create();
    $beekeeper->assignRole('beekeeper');

    $hive = Hive::factory()->create(['beekeeper_id' => $beekeeper->id]);
    $before = AuditLog::where('auditable_type', 'Hive')->where('event', 'updated')->count();

    $hive->touch(); // only updates updated_at

    $after = AuditLog::where('auditable_type', 'Hive')->where('event', 'updated')->count();

    expect($after)->toBe($before);
});

test('harvest create audit log stores beekeeper user_id', function () {
    $admin = User::factory()->create();
    $admin->assignRole('admin');

    $beekeeper = User::factory()->create();
    $beekeeper->assignRole('beekeeper');

    $hive = Hive::factory()->create(['beekeeper_id' => $beekeeper->id]);

    $this->actingAs($beekeeper)->post(route('harvests.store'), [
        'hive_id'      => $hive->id,
        'harvest_date' => '2026-05-26',
        'weight'       => 1.5,
    ]);

    $log = AuditLog::where('auditable_type', 'Harvest')
        ->where('event', 'created')
        ->latest()
        ->first();

    expect($log)->not->toBeNull()
        ->and($log->user_id)->toBe($beekeeper->id);
});

// ── AuditLogController ─────────────────────────────────────────────────────

test('admin can view audit log page', function () {
    $admin = User::factory()->create();
    $admin->assignRole('admin');

    $response = $this->actingAs($admin)->get(route('admin.audit-logs.index'));

    $response->assertOk()
        ->assertInertia(fn ($page) => $page->component('admin/audit-logs/index'));
});

test('beekeeper cannot access audit log page', function () {
    $beekeeper = User::factory()->create();
    $beekeeper->assignRole('beekeeper');

    $response = $this->actingAs($beekeeper)->get(route('admin.audit-logs.index'));

    $response->assertRedirect(route('dashboard'));
});

test('audit log page filters by event', function () {
    $admin = User::factory()->create();
    $admin->assignRole('admin');

    AuditLog::create([
        'user_id' => $admin->id, 'event' => 'created',
        'auditable_type' => 'Hive', 'auditable_id' => 1,
        'old_values' => null, 'new_values' => ['name' => 'X'],
    ]);
    AuditLog::create([
        'user_id' => $admin->id, 'event' => 'deleted',
        'auditable_type' => 'Hive', 'auditable_id' => 2,
        'old_values' => ['name' => 'Y'], 'new_values' => null,
    ]);

    $response = $this->actingAs($admin)
        ->get(route('admin.audit-logs.index', ['event' => 'created']));

    $response->assertOk()
        ->assertInertia(fn ($page) => $page
            ->where('logs.total', 1)
            ->where('logs.data.0.event', 'created')
        );
});

test('audit log page filters by model', function () {
    $admin = User::factory()->create();
    $admin->assignRole('admin');

    AuditLog::create([
        'user_id' => $admin->id, 'event' => 'created',
        'auditable_type' => 'Hive', 'auditable_id' => 1,
        'old_values' => null, 'new_values' => ['name' => 'H'],
    ]);
    AuditLog::create([
        'user_id' => $admin->id, 'event' => 'created',
        'auditable_type' => 'Harvest', 'auditable_id' => 1,
        'old_values' => null, 'new_values' => ['weight' => 1.0],
    ]);

    $response = $this->actingAs($admin)
        ->get(route('admin.audit-logs.index', ['model' => 'Hive']));

    $response->assertOk()
        ->assertInertia(fn ($page) => $page
            ->where('logs.total', 1)
            ->where('logs.data.0.auditable_type', 'Hive')
        );
});
