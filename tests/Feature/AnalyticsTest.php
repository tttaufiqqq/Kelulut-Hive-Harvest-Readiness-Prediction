<?php

use App\Models\Hive;
use App\Models\User;
use Spatie\Permission\Models\Role;

uses(\Illuminate\Foundation\Testing\RefreshDatabase::class);

beforeEach(function () {
    Role::firstOrCreate(['name' => 'beekeeper', 'guard_name' => 'web']);
    Role::firstOrCreate(['name' => 'admin',     'guard_name' => 'web']);
});

// ── Test 1: beekeeper can view analytics for own hive ─────────────────────

test('beekeeper can view analytics for own hive', function () {
    $beekeeper = User::factory()->create();
    $beekeeper->assignRole('beekeeper');
    $hive = Hive::create(['beekeeper_id' => $beekeeper->id, 'name' => 'My Hive']);

    $this->actingAs($beekeeper)
        ->get(route('analytics.show', $hive))
        ->assertOk();
});

// ── Test 2: beekeeper cannot view analytics for another beekeeper's hive ──

test('beekeeper cannot view analytics for another beekeepers hive', function () {
    $beekeeper = User::factory()->create();
    $beekeeper->assignRole('beekeeper');

    $other = User::factory()->create();
    $other->assignRole('beekeeper');
    $hive = Hive::create(['beekeeper_id' => $other->id, 'name' => 'Other Hive']);

    $this->actingAs($beekeeper)
        ->get(route('analytics.show', $hive))
        ->assertStatus(403);
});

// ── Test 3: admin cannot access beekeeper analytics route ─────────────────

test('admin cannot access beekeeper analytics route', function () {
    $admin = User::factory()->create();
    $admin->assignRole('admin');

    $beekeeper = User::factory()->create();
    $beekeeper->assignRole('beekeeper');
    $hive = Hive::create(['beekeeper_id' => $beekeeper->id, 'name' => 'My Hive']);

    $this->actingAs($admin)
        ->get(route('analytics.show', $hive))
        ->assertRedirect();
});

// ── Test 4: analytics response contains correct Inertia props ─────────────

test('analytics response contains correct Inertia props', function () {
    $beekeeper = User::factory()->create();
    $beekeeper->assignRole('beekeeper');
    $hive = Hive::create(['beekeeper_id' => $beekeeper->id, 'name' => 'My Hive']);

    $this->actingAs($beekeeper)
        ->get(route('analytics.show', $hive))
        ->assertInertia(fn ($page) => $page
            ->component('analytics')
            ->has('hive')
            ->has('hriTrend')
            ->has('sensorReadings')
            ->has('latestPrediction')
            ->has('harvestHistory')
        );
});
