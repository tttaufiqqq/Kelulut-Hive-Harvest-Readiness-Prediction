<?php

use App\Models\User;
use Illuminate\Support\Facades\URL;
use Spatie\Permission\Models\Role;

beforeEach(function () {
    Role::firstOrCreate(['name' => 'beekeeper', 'guard_name' => 'web']);
});

test('invite page is shown to pending user', function () {
    $user = User::factory()->create(['status' => 'pending']);
    $user->assignRole('beekeeper');

    $url = URL::temporarySignedRoute('invite.accept', now()->addDays(7), ['user' => $user->id]);

    $this->get($url)->assertOk();
});

test('invite page redirects when user is already active', function () {
    $user = User::factory()->create(['status' => 'active']);
    $user->assignRole('beekeeper');

    $url = URL::temporarySignedRoute('invite.accept', now()->addDays(7), ['user' => $user->id]);

    $this->get($url)->assertRedirect(route('login'));
});

test('beekeeper can accept invite and set password', function () {
    $user = User::factory()->create(['status' => 'pending']);
    $user->assignRole('beekeeper');

    $url = URL::temporarySignedRoute('invite.accept.store', now()->addDays(7), ['user' => $user->id]);

    $response = $this->post($url, [
        'password'              => 'new-secure-password',
        'password_confirmation' => 'new-secure-password',
    ]);

    $response->assertRedirect(route('dashboard'));
    $this->assertAuthenticated();

    $user->refresh();
    expect($user->status)->toBe('active');
    expect($user->email_verified_at)->not->toBeNull();
});

test('beekeeper cannot accept invite twice', function () {
    $user = User::factory()->create(['status' => 'active']);
    $user->assignRole('beekeeper');

    $url = URL::temporarySignedRoute('invite.accept.store', now()->addDays(7), ['user' => $user->id]);

    $response = $this->post($url, [
        'password'              => 'new-secure-password',
        'password_confirmation' => 'new-secure-password',
    ]);

    $response->assertRedirect(route('login'));
    $this->assertGuest();
});

test('unsigned invite url is rejected', function () {
    $user = User::factory()->create(['status' => 'pending']);
    $user->assignRole('beekeeper');

    $this->get(route('invite.accept', $user))->assertForbidden();
});
