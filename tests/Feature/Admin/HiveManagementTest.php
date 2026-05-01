<?php

use App\Models\Hive;
use App\Models\User;
use Spatie\Permission\Models\Role;

beforeEach(function () {
    Role::firstOrCreate(['name' => 'admin',     'guard_name' => 'web']);
    Role::firstOrCreate(['name' => 'beekeeper', 'guard_name' => 'web']);
});

test('admin can view hive management page', function () {
    $admin = User::factory()->create();
    $admin->assignRole('admin');

    $response = $this->actingAs($admin)->get(route('admin.hives.index'));
    $response->assertOk();
});

test('admin can create a hive with valid beekeeper and name', function () {
    $admin = User::factory()->create();
    $admin->assignRole('admin');

    $beekeeper = User::factory()->create();
    $beekeeper->assignRole('beekeeper');

    $response = $this->actingAs($admin)->post(route('admin.hives.store'), [
        'name'         => 'Test Hive Alpha',
        'beekeeper_id' => $beekeeper->id,
    ]);

    $response->assertRedirect(route('admin.hives.index'));
    $this->assertDatabaseHas('hives', ['name' => 'Test Hive Alpha', 'beekeeper_id' => $beekeeper->id]);
});

test('admin create fails without beekeeper_id', function () {
    $admin = User::factory()->create();
    $admin->assignRole('admin');

    $response = $this->actingAs($admin)->post(route('admin.hives.store'), ['name' => 'Test Hive']);
    $response->assertSessionHasErrors('beekeeper_id');
});

test('admin create fails without name', function () {
    $admin = User::factory()->create();
    $admin->assignRole('admin');

    $beekeeper = User::factory()->create();
    $beekeeper->assignRole('beekeeper');

    $response = $this->actingAs($admin)->post(route('admin.hives.store'), ['beekeeper_id' => $beekeeper->id]);
    $response->assertSessionHasErrors('name');
});

test('admin can update a hive', function () {
    $admin = User::factory()->create();
    $admin->assignRole('admin');

    $beekeeper = User::factory()->create();
    $beekeeper->assignRole('beekeeper');

    $hive = Hive::factory()->create(['beekeeper_id' => $beekeeper->id, 'name' => 'Old Name', 'status' => 'active']);

    $response = $this->actingAs($admin)->patch(route('admin.hives.update', $hive), [
        'name'         => 'Updated Hive',
        'beekeeper_id' => $beekeeper->id,
        'status'       => 'active',
    ]);

    $response->assertRedirect(route('admin.hives.index'));
    $this->assertDatabaseHas('hives', ['id' => $hive->id, 'name' => 'Updated Hive']);
});

test('admin can delete a hive', function () {
    $admin = User::factory()->create();
    $admin->assignRole('admin');

    $beekeeper = User::factory()->create();
    $beekeeper->assignRole('beekeeper');

    $hive = Hive::factory()->create(['beekeeper_id' => $beekeeper->id]);

    $response = $this->actingAs($admin)->delete(route('admin.hives.destroy', $hive));

    $response->assertRedirect(route('admin.hives.index'));
    $this->assertDatabaseMissing('hives', ['id' => $hive->id]);
});

test('admin can toggle hive status', function () {
    $admin = User::factory()->create();
    $admin->assignRole('admin');

    $beekeeper = User::factory()->create();
    $beekeeper->assignRole('beekeeper');

    $hive = Hive::factory()->create(['beekeeper_id' => $beekeeper->id, 'status' => 'active']);

    $response = $this->actingAs($admin)->patch(route('admin.hives.toggle-status', $hive));

    $response->assertRedirect(route('admin.hives.index'));
    expect($hive->fresh()->status)->toBe('inactive');
});

test('beekeeper cannot access admin hives page', function () {
    $beekeeper = User::factory()->create();
    $beekeeper->assignRole('beekeeper');

    $response = $this->actingAs($beekeeper)->get(route('admin.hives.index'));
    $response->assertRedirect(route('dashboard'));
});

test('beekeeper cannot post to admin hives store', function () {
    $beekeeper = User::factory()->create();
    $beekeeper->assignRole('beekeeper');

    $response = $this->actingAs($beekeeper)->post(route('admin.hives.store'), ['name' => 'Unauthorized']);
    $response->assertRedirect(route('dashboard'));
});

test('unauthenticated user is redirected to login on admin hives page', function () {
    $response = $this->get(route('admin.hives.index'));
    $response->assertRedirect(route('login'));
});
