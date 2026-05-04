<?php

use App\Models\Harvest;
use App\Models\Hive;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Spatie\Permission\Models\Role;

uses(RefreshDatabase::class);

beforeEach(function () {
    Role::firstOrCreate(['name' => 'beekeeper', 'guard_name' => 'web']);
    Role::firstOrCreate(['name' => 'admin',     'guard_name' => 'web']);
});

// ── Helpers ────────────────────────────────────────────────────────────────

function makeBeekeeper(): User
{
    $user = User::factory()->create();
    $user->assignRole('beekeeper');

    return $user;
}

function makeHiveFor(User $beekeeper): Hive
{
    return Hive::create(['beekeeper_id' => $beekeeper->id, 'name' => 'Test Hive']);
}

function harvestPayload(int $hiveId): array
{
    return [
        'hive_id' => $hiveId,
        'harvest_date' => today()->toDateString(),
        'weight' => 1.5,
    ];
}

// ── Test 1: beekeeper can store harvest for own hive ──────────────────────

test('beekeeper can store harvest for own hive', function () {
    $beekeeper = makeBeekeeper();
    $hive = makeHiveFor($beekeeper);

    $response = $this->actingAs($beekeeper)
        ->post(route('harvests.store'), harvestPayload($hive->id));

    $response->assertRedirect(route('harvests.index'));
    $this->assertDatabaseHas('harvests', [
        'hive_id' => $hive->id,
        'beekeeper_id' => $beekeeper->id,
        'weight' => 1.5,
    ]);
});

// ── Test 2: beekeeper cannot store harvest for another beekeeper's hive ───

test('beekeeper cannot store harvest for another beekeepers hive', function () {
    $beekeeper = makeBeekeeper();
    $other = makeBeekeeper();
    $hive = makeHiveFor($other);

    $this->actingAs($beekeeper)
        ->post(route('harvests.store'), harvestPayload($hive->id))
        ->assertSessionHasErrors('hive_id');

    $this->assertDatabaseMissing('harvests', ['hive_id' => $hive->id]);
});

// ── Test 3: beekeeper can update own harvest ──────────────────────────────

test('beekeeper can update own harvest', function () {
    $beekeeper = makeBeekeeper();
    $hive = makeHiveFor($beekeeper);
    $harvest = Harvest::create([
        'hive_id' => $hive->id,
        'beekeeper_id' => $beekeeper->id,
        'harvest_date' => today()->toDateString(),
        'weight' => 1.0,
    ]);

    $response = $this->actingAs($beekeeper)
        ->patch(route('harvests.update', $harvest), ['weight' => 2.5, 'harvest_date' => today()->toDateString()]);

    $response->assertRedirect(route('harvests.index'));
    $this->assertDatabaseHas('harvests', ['id' => $harvest->id, 'weight' => 2.5]);
});

// ── Test 4: beekeeper cannot update another beekeeper's harvest ───────────

test('beekeeper cannot update another beekeepers harvest', function () {
    $beekeeper = makeBeekeeper();
    $other = makeBeekeeper();
    $hive = makeHiveFor($other);
    $harvest = Harvest::create([
        'hive_id' => $hive->id,
        'beekeeper_id' => $other->id,
        'harvest_date' => today()->toDateString(),
        'weight' => 1.0,
    ]);

    $response = $this->actingAs($beekeeper)
        ->patch(route('harvests.update', $harvest), ['weight' => 9.9, 'harvest_date' => today()->toDateString()]);

    $response->assertStatus(403);
    $this->assertDatabaseHas('harvests', ['id' => $harvest->id, 'weight' => 1.0]);
});

// ── Test 5: beekeeper can delete own harvest ──────────────────────────────

test('beekeeper can delete own harvest', function () {
    $beekeeper = makeBeekeeper();
    $hive = makeHiveFor($beekeeper);
    $harvest = Harvest::create([
        'hive_id' => $hive->id,
        'beekeeper_id' => $beekeeper->id,
        'harvest_date' => today()->toDateString(),
        'weight' => 1.0,
    ]);

    $response = $this->actingAs($beekeeper)
        ->delete(route('harvests.destroy', $harvest));

    $response->assertRedirect(route('harvests.index'));
    $this->assertDatabaseMissing('harvests', ['id' => $harvest->id]);
});

// ── Test 6: guest is redirected to login from harvest routes ──────────────

test('guest is redirected to login from harvest routes', function () {
    $this->get(route('harvests.index'))->assertRedirect(route('login'));
    $this->post(route('harvests.store'), [])->assertRedirect(route('login'));
});
