<?php

use App\Models\Hive;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Spatie\Permission\Models\Role;

uses(RefreshDatabase::class);

beforeEach(function () {
    Role::firstOrCreate(['name' => 'admin',     'guard_name' => 'web']);
    Role::firstOrCreate(['name' => 'beekeeper', 'guard_name' => 'web']);
});

// ── Admin can access dashboard ─────────────────────────────────────────
test('admin can view admin dashboard', function () {
    $admin = User::factory()->create();
    $admin->assignRole('admin');

    $this->actingAs($admin)
        ->get(route('admin.dashboard'))
        ->assertOk();
});

// ── Beekeeper is redirected ────────────────────────────────────────────
test('beekeeper cannot access admin dashboard', function () {
    $beekeeper = User::factory()->create();
    $beekeeper->assignRole('beekeeper');

    $this->actingAs($beekeeper)
        ->get(route('admin.dashboard'))
        ->assertRedirect();
});

// ── Guest is redirected ────────────────────────────────────────────────
test('guest cannot access admin dashboard', function () {
    $this->get(route('admin.dashboard'))->assertRedirect();
});

// ── Correct Inertia props returned ────────────────────────────────────
test('admin dashboard returns stats, hives, productivityRanking, crossSiteComparison props', function () {
    $admin = User::factory()->create();
    $admin->assignRole('admin');

    $this->actingAs($admin)
        ->get(route('admin.dashboard'))
        ->assertInertia(fn ($page) => $page
            ->component('admin/dashboard')
            ->has('stats')
            ->has('hives')
            ->has('productivityRanking')
            ->has('crossSiteComparison')
        );
});

// ── Real hives appear in the hives prop ───────────────────────────────
test('admin dashboard hives prop reflects registered hives', function () {
    $admin = User::factory()->create();
    $admin->assignRole('admin');

    $beekeeper = User::factory()->create();
    $beekeeper->assignRole('beekeeper');
    Hive::create(['beekeeper_id' => $beekeeper->id, 'name' => 'Test Hive A']);
    Hive::create(['beekeeper_id' => $beekeeper->id, 'name' => 'Test Hive B']);

    $this->actingAs($admin)
        ->get(route('admin.dashboard'))
        ->assertInertia(fn ($page) => $page
            ->component('admin/dashboard')
            ->has('hives', 2)
        );
});
