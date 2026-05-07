<?php

use App\Http\Middleware\HandleInertiaRequests;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Inertia\Testing\AssertableInertia as Assert;
use Spatie\Permission\Models\Role;

beforeEach(function () {
    Role::firstOrCreate(['name' => 'admin', 'guard_name' => 'web']);
    Role::firstOrCreate(['name' => 'beekeeper', 'guard_name' => 'web']);
});

function thesisInertiaHeaders(): array
{
    $version = app(HandleInertiaRequests::class)->version(
        Request::create('/admin/thesis', 'GET'),
    );

    return [
        'X-Inertia' => 'true',
        'X-Requested-With' => 'XMLHttpRequest',
        'X-Inertia-Version' => $version ?? '',
    ];
}

test('admin can view thesis management page', function () {
    Storage::fake('public');

    $admin = User::factory()->create();
    $admin->assignRole('admin');

    $this->actingAs($admin)
        ->get(route('admin.thesis'))
        ->assertInertia(fn (Assert $page) => $page
            ->component('admin/thesis')
            ->where('thesisUrl', null)
            ->where('uploadedAt', null),
        );
});

test('admin can upload thesis pdf successfully', function () {
    Storage::fake('public');

    $admin = User::factory()->create();
    $admin->assignRole('admin');

    $file = UploadedFile::fake()->create('thesis.pdf', 1024, 'application/pdf');

    $response = $this->actingAs($admin)
        ->post(route('admin.thesis.upload'), [
            'thesis' => $file,
        ], thesisInertiaHeaders());

    $response->assertRedirect(route('admin.thesis'));
    $response->assertSessionHas('success', 'Thesis uploaded successfully.');
    Storage::disk('public')->assertExists('thesis/thesis.pdf');
});

test('uploading a new thesis replaces the existing thesis pdf', function () {
    Storage::fake('public');

    $admin = User::factory()->create();
    $admin->assignRole('admin');

    Storage::disk('public')->put('thesis/thesis.pdf', str_repeat('a', 1024));

    $replacementContents = str_repeat('replacement thesis pdf ', 200);
    $replacement = UploadedFile::fake()->createWithContent(
        'replacement-thesis.pdf',
        $replacementContents,
    );

    $response = $this->actingAs($admin)
        ->post(route('admin.thesis.upload'), [
            'thesis' => $replacement,
        ], thesisInertiaHeaders());

    $response->assertRedirect(route('admin.thesis'));
    $response->assertSessionHas('success', 'Thesis uploaded successfully.');
    Storage::disk('public')->assertExists('thesis/thesis.pdf');
    expect(Storage::disk('public')->get('thesis/thesis.pdf'))
        ->toBe($replacementContents);
});

test('thesis upload shows validation errors for non-pdf files', function () {
    Storage::fake('public');

    $admin = User::factory()->create();
    $admin->assignRole('admin');

    $file = UploadedFile::fake()->create('thesis.txt', 20, 'text/plain');

    $response = $this->actingAs($admin)
        ->from(route('admin.thesis'))
        ->post(route('admin.thesis.upload'), [
            'thesis' => $file,
        ], thesisInertiaHeaders());

    $response->assertRedirect(route('admin.thesis'));
    $response->assertSessionHasErrors('thesis');
    Storage::disk('public')->assertMissing('thesis/thesis.pdf');
});

test('thesis upload surfaces storage failures instead of failing silently', function () {
    $admin = User::factory()->create();
    $admin->assignRole('admin');

    $disk = \Mockery::mock();
    $disk->shouldReceive('exists')->once()->with('thesis')->andReturn(false);
    $disk->shouldReceive('makeDirectory')->once()->with('thesis')->andReturn(true);
    $disk->shouldReceive('putFileAs')->once()->with('thesis', \Mockery::type(UploadedFile::class), 'thesis.pdf')->andReturn(false);

    Storage::shouldReceive('disk')->once()->with('public')->andReturn($disk);

    $file = UploadedFile::fake()->create('thesis.pdf', 1024, 'application/pdf');

    $response = $this->actingAs($admin)
        ->from(route('admin.thesis'))
        ->post(route('admin.thesis.upload'), [
            'thesis' => $file,
        ], thesisInertiaHeaders());

    $response->assertRedirect(route('admin.thesis'));
    $response->assertSessionHas('error', [
        'message' => 'We could not save the thesis PDF right now. Please try again.',
        'reason' => null,
    ]);
});

test('thesis replacement overwrites the live pdf without a delete-first step', function () {
    $admin = User::factory()->create();
    $admin->assignRole('admin');

    $disk = \Mockery::mock();
    $disk->shouldReceive('exists')->once()->with('thesis')->andReturn(true);
    $disk->shouldNotReceive('delete');
    $disk->shouldReceive('putFileAs')->once()->with('thesis', \Mockery::type(UploadedFile::class), 'thesis.pdf')->andReturn('thesis/thesis.pdf');

    Storage::shouldReceive('disk')->once()->with('public')->andReturn($disk);

    $file = UploadedFile::fake()->create('thesis.pdf', 1024, 'application/pdf');

    $response = $this->actingAs($admin)
        ->from(route('admin.thesis'))
        ->post(route('admin.thesis.upload'), [
            'thesis' => $file,
        ], thesisInertiaHeaders());

    $response->assertRedirect(route('admin.thesis'));
    $response->assertSessionHas('success', 'Thesis uploaded successfully.');
});
