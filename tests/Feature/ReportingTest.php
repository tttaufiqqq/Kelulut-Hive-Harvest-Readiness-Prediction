<?php

use App\Models\Hive;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Spatie\Permission\Models\Role;

uses(RefreshDatabase::class);

beforeEach(function () {
    Role::firstOrCreate(['name' => 'beekeeper', 'guard_name' => 'web']);
    Role::firstOrCreate(['name' => 'admin',     'guard_name' => 'web']);
});

// ── Guest is redirected ────────────────────────────────────────────────
test('guest cannot access reporting page', function () {
    $this->get(route('reporting.index'))->assertRedirect();
});

// ── Beekeeper can view their reporting page ────────────────────────────
test('beekeeper can view reporting page', function () {
    $beekeeper = User::factory()->create();
    $beekeeper->assignRole('beekeeper');

    $this->actingAs($beekeeper)
        ->get(route('reporting.index'))
        ->assertOk();
});

// ── Admin is redirected (beekeeper-only route) ─────────────────────────
test('admin cannot access beekeeper reporting page', function () {
    $admin = User::factory()->create();
    $admin->assignRole('admin');

    $this->actingAs($admin)
        ->get(route('reporting.index'))
        ->assertRedirect();
});

// ── Correct Inertia props returned ────────────────────────────────────
test('reporting page returns correct Inertia props', function () {
    $beekeeper = User::factory()->create();
    $beekeeper->assignRole('beekeeper');

    $this->actingAs($beekeeper)
        ->get(route('reporting.index'))
        ->assertInertia(fn ($page) => $page
            ->component('reporting')
            ->has('hriGauges')
            ->has('readinessTrends')
        );
});

// ── Only own hives appear in hriGauges ────────────────────────────────
test('reporting gauges are scoped to the authenticated beekeeper', function () {
    $beekeeper = User::factory()->create();
    $beekeeper->assignRole('beekeeper');
    Hive::create(['beekeeper_id' => $beekeeper->id, 'name' => 'My Hive']);

    $other = User::factory()->create();
    $other->assignRole('beekeeper');
    Hive::create(['beekeeper_id' => $other->id, 'name' => 'Other Hive']);

    $this->actingAs($beekeeper)
        ->get(route('reporting.index'))
        ->assertInertia(fn ($page) => $page
            ->component('reporting')
            ->has('hriGauges', 1)   // only own hive
        );
});
