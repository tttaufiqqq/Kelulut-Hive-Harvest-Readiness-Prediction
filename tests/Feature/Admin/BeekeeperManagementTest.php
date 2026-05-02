<?php

use App\Models\User;
use Illuminate\Support\Facades\Notification;
use Spatie\Permission\Models\Role;

beforeEach(function () {
    Role::firstOrCreate(['name' => 'admin', 'guard_name' => 'web']);
    Role::firstOrCreate(['name' => 'beekeeper', 'guard_name' => 'web']);
});

test('admin can view beekeepers list', function () {
    $admin = User::factory()->create();
    $admin->assignRole('admin');

    $response = $this->actingAs($admin)->get(route('admin.beekeepers.index'));
    $response->assertOk();
});

test('beekeeper cannot access beekeepers list', function () {
    $beekeeper = User::factory()->create();
    $beekeeper->assignRole('beekeeper');

    $response = $this->actingAs($beekeeper)->get(route('admin.beekeepers.index'));
    $response->assertRedirect(route('dashboard'));
});

test('admin can invite a new beekeeper', function () {
    Notification::fake();

    $admin = User::factory()->create();
    $admin->assignRole('admin');

    $response = $this->actingAs($admin)->post(route('admin.beekeepers.store'), [
        'name'  => 'Ali Hassan',
        'email' => 'ali@buzzyhive.com',
        'phone' => '0123456789',
    ]);

    $response->assertRedirect(route('admin.beekeepers.index'));
    $newBeekeeper = User::where('email', 'ali@buzzyhive.com')->first();
    expect($newBeekeeper)->not->toBeNull();
    expect($newBeekeeper->status)->toBe('pending');
    expect($newBeekeeper->hasRole('beekeeper'))->toBeTrue();
});

test('admin cannot invite beekeeper with duplicate email', function () {
    $admin = User::factory()->create();
    $admin->assignRole('admin');
    User::factory()->create(['email' => 'duplicate@buzzyhive.com']);

    $response = $this->actingAs($admin)->post(route('admin.beekeepers.store'), [
        'name'  => 'Another User',
        'email' => 'duplicate@buzzyhive.com',
        'phone' => null,
    ]);

    $response->assertSessionHasErrors('email');
});

test('admin can deactivate an active beekeeper', function () {
    $admin = User::factory()->create();
    $admin->assignRole('admin');
    $beekeeper = User::factory()->create(['status' => 'active']);
    $beekeeper->assignRole('beekeeper');

    $response = $this->actingAs($admin)
        ->patch(route('admin.beekeepers.toggle-status', $beekeeper));

    $response->assertRedirect(route('admin.beekeepers.index'));
    expect($beekeeper->fresh()->status)->toBe('deactivated');
});

test('admin can reactivate a deactivated beekeeper', function () {
    $admin = User::factory()->create();
    $admin->assignRole('admin');
    $beekeeper = User::factory()->create(['status' => 'deactivated']);
    $beekeeper->assignRole('beekeeper');

    $response = $this->actingAs($admin)
        ->patch(route('admin.beekeepers.toggle-status', $beekeeper));

    $response->assertRedirect(route('admin.beekeepers.index'));
    expect($beekeeper->fresh()->status)->toBe('active');
});

test('admin can delete a beekeeper', function () {
    $admin = User::factory()->create();
    $admin->assignRole('admin');
    $beekeeper = User::factory()->create();
    $beekeeper->assignRole('beekeeper');

    $response = $this->actingAs($admin)
        ->delete(route('admin.beekeepers.destroy', $beekeeper));

    $response->assertRedirect(route('admin.beekeepers.index'));
    expect(User::find($beekeeper->id))->toBeNull();
});

test('beekeeper cannot delete another user', function () {
    $beekeeper = User::factory()->create();
    $beekeeper->assignRole('beekeeper');
    $target = User::factory()->create();
    $target->assignRole('beekeeper');

    $response = $this->actingAs($beekeeper)
        ->delete(route('admin.beekeepers.destroy', $target));

    $response->assertRedirect(route('dashboard'));
    expect(User::find($target->id))->not->toBeNull();
});

test('invite notification is sent when beekeeper is registered', function () {
    Notification::fake();

    $admin = User::factory()->create();
    $admin->assignRole('admin');

    $this->actingAs($admin)->post(route('admin.beekeepers.store'), [
        'name'  => 'Siti Aminah',
        'email' => 'siti@buzzyhive.com',
        'phone' => null,
    ]);

    $beekeeper = User::where('email', 'siti@buzzyhive.com')->first();
    Notification::assertSentTo($beekeeper, \App\Notifications\BeekeeperInviteNotification::class);
});

test('admin can resend invite to pending beekeeper', function () {
    Notification::fake();

    $admin = User::factory()->create();
    $admin->assignRole('admin');
    $beekeeper = User::factory()->create(['status' => 'pending']);
    $beekeeper->assignRole('beekeeper');

    $response = $this->actingAs($admin)
        ->post(route('admin.beekeepers.resend-invite', $beekeeper));

    $response->assertRedirect(route('admin.beekeepers.index'));
    Notification::assertSentTo($beekeeper, \App\Notifications\BeekeeperInviteNotification::class);
});

test('admin cannot resend invite to active beekeeper', function () {
    Notification::fake();

    $admin = User::factory()->create();
    $admin->assignRole('admin');
    $beekeeper = User::factory()->create(['status' => 'active']);
    $beekeeper->assignRole('beekeeper');

    $response = $this->actingAs($admin)
        ->post(route('admin.beekeepers.resend-invite', $beekeeper));

    $response->assertRedirect(route('admin.beekeepers.index'));
    $response->assertSessionHas('error');
    Notification::assertNothingSent();
});

test('admin can update beekeeper details', function () {
    $admin = User::factory()->create();
    $admin->assignRole('admin');
    $beekeeper = User::factory()->create();
    $beekeeper->assignRole('beekeeper');

    $response = $this->actingAs($admin)
        ->patch(route('admin.beekeepers.update', $beekeeper), [
            'name'  => 'Updated Name',
            'email' => 'updated@buzzyhive.com',
            'phone' => null,
        ]);

    $response->assertRedirect(route('admin.beekeepers.index'));
    expect($beekeeper->fresh()->name)->toBe('Updated Name');
    expect($beekeeper->fresh()->email)->toBe('updated@buzzyhive.com');
});

test('non-admin cannot update beekeeper details', function () {
    $beekeeper = User::factory()->create();
    $beekeeper->assignRole('beekeeper');
    $target = User::factory()->create();
    $target->assignRole('beekeeper');

    $response = $this->actingAs($beekeeper)
        ->patch(route('admin.beekeepers.update', $target), [
            'name'  => 'Hacked Name',
            'email' => 'hacked@buzzyhive.com',
            'phone' => null,
        ]);

    $response->assertRedirect(route('dashboard'));
    expect($target->fresh()->name)->not->toBe('Hacked Name');
});
