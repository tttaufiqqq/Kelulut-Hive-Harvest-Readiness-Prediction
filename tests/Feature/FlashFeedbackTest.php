<?php

use App\Models\User;
use Inertia\Testing\AssertableInertia as Assert;
use Spatie\Permission\Models\Role;

beforeEach(function () {
    Role::firstOrCreate(['name' => 'admin', 'guard_name' => 'web']);
    Role::firstOrCreate(['name' => 'beekeeper', 'guard_name' => 'web']);
});

test('flash feedback is shared on beekeeper crud pages', function () {
    $beekeeper = User::factory()->create();
    $beekeeper->assignRole('beekeeper');

    $this->actingAs($beekeeper)
        ->withSession([
            'success' => 'Harvest record added.',
            'error' => 'Unable to save harvest.',
        ])
        ->get(route('harvests.index'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('harvests/index')
            ->where('flash.success', [
                'message' => 'Harvest record added.',
                'reason' => null,
            ])
            ->where('flash.error', [
                'message' => 'Unable to save harvest.',
                'reason' => null,
            ]),
        );
});

test('flash feedback is shared on admin crud pages', function () {
    $admin = User::factory()->create();
    $admin->assignRole('admin');

    $this->actingAs($admin)
        ->withSession([
            'success' => 'Beekeeper updated.',
            'error' => 'Invite can only be resent to pending users.',
            'warning' => 'Invite delivery is delayed.',
        ])
        ->get(route('admin.beekeepers.index'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('admin/beekeepers/index')
            ->where('flash.success', [
                'message' => 'Beekeeper updated.',
                'reason' => null,
            ])
            ->where('flash.error', [
                'message' => 'Invite can only be resent to pending users.',
                'reason' => null,
            ])
            ->where('flash.warning', [
                'message' => 'Invite delivery is delayed.',
                'reason' => null,
            ]),
        );
});
