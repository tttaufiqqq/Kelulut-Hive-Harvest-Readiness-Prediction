<?php

use App\Enums\AppErrorCode;
use App\Exceptions\AppException;
use App\Http\Middleware\HandleInertiaRequests;
use Illuminate\Foundation\Http\Middleware\VerifyCsrfToken;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use Symfony\Component\HttpKernel\Exception\HttpException;

beforeEach(function () {
    if (Route::has('testing.errors.route-source')) {
        return;
    }

    Route::middleware('web')->group(function () {
        Route::get('/testing/errors/source', fn () => Inertia::render('dashboard'))
            ->name('testing.errors.route-source');
        Route::get('/testing/errors/403', fn () => abort(403))
            ->name('testing.errors.route-403');
        Route::get('/testing/errors/404', fn () => throw new HttpException(404, 'Missing'))
            ->name('testing.errors.route-404');
        Route::get('/testing/errors/419', fn () => throw new HttpException(419, 'Expired'))
            ->name('testing.errors.route-419');
        Route::get('/testing/errors/429', fn () => throw new HttpException(429, 'Busy'))
            ->name('testing.errors.route-429');
        Route::get('/testing/errors/500', fn () => throw new RuntimeException('boom'))
            ->name('testing.errors.route-500');
        Route::get('/testing/errors/503', fn () => throw new HttpException(503, 'Down'))
            ->name('testing.errors.route-503');
        Route::post('/testing/errors/mutate-warning', fn () => throw new AppException(
            AppErrorCode::BusinessRuleViolation,
            409,
            'The requested action cannot be completed right now.',
            'warning',
        ))->name('testing.errors.route-mutate-warning');
        Route::post('/testing/errors/mutate-runtime', fn () => throw new RuntimeException('mutate failed'))
            ->name('testing.errors.route-mutate-runtime');
    });

    Route::middleware('api')->group(function () {
        Route::get('/api/testing/errors/runtime', fn () => throw new RuntimeException('api failed'))
            ->name('testing.errors.route-api-runtime');
    });
});

function inertiaHeaders(): array
{
    $version = app(HandleInertiaRequests::class)->version(
        Request::create('/testing/errors/source', 'GET'),
    );

    return [
        'X-Inertia' => 'true',
        'X-Requested-With' => 'XMLHttpRequest',
        'X-Inertia-Version' => $version ?? '',
    ];
}

test('inertia get errors render the shared error page with request ids', function (string $path, int $status) {
    $response = $this->get($path, inertiaHeaders());

    $response
        ->assertStatus($status)
        ->assertHeader('X-Request-Id')
        ->assertJsonPath('component', 'error/index')
        ->assertJsonPath('props.status', $status)
        ->assertJsonPath('props.requestId', $response->json('props.meta.request_id'));

    expect($response->json('props.requestId'))->toBeString();
    expect($response->json('props.meta.request_id'))->toBeString();
    expect($response->json('props.message'))->toBeString();
    expect($response->json('props.reason'))->toBeString();
})->with([
    ['/testing/errors/403', 403],
    ['/testing/errors/404', 404],
    ['/testing/errors/419', 419],
    ['/testing/errors/429', 429],
    ['/testing/errors/500', 500],
    ['/testing/errors/503', 503],
]);

test('inertia mutating app exceptions redirect back with warning flash', function () {
    $this->withoutMiddleware(VerifyCsrfToken::class);

    $response = $this->from('/testing/errors/source')
        ->post('/testing/errors/mutate-warning', [], inertiaHeaders());

    $response->assertRedirect('/testing/errors/source');
    $response->assertSessionHas('warning', [
        'message' => 'The requested action cannot be completed right now.',
        'reason' => null,
    ]);
});

test('inertia mutating runtime exceptions redirect back with friendly error flash', function () {
    $this->withoutMiddleware(VerifyCsrfToken::class);

    $response = $this->from('/testing/errors/source')
        ->post('/testing/errors/mutate-runtime', [], inertiaHeaders());

    $response->assertRedirect('/testing/errors/source');
    $response->assertSessionHas('error.message', 'We could not complete your request.');
    $response->assertSessionHas(
        'error.reason',
        'The server hit an unexpected problem while processing the request.',
    );
});

test('unexpected api failures use the standardized json envelope', function () {
    $response = $this->getJson('/api/testing/errors/runtime');

    $response
        ->assertStatus(500)
        ->assertJsonPath('error.code', 'unexpected_error')
        ->assertJsonPath('error.message', 'We could not complete your request.')
        ->assertJsonPath(
            'error.reason',
            'The server hit an unexpected problem while processing the request.',
        )
        ->assertHeader('X-Request-Id');

    expect($response->json('meta.request_id'))->toBeString();
});
