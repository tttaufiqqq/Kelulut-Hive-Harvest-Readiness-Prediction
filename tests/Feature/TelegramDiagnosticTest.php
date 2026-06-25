<?php

use App\Jobs\SendTelegramAlert;
use App\Models\Hive;
use App\Models\IotNode;
use App\Models\Prediction;
use App\Models\SensorLog;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Queue;
use Spatie\Permission\Models\Role;

uses(RefreshDatabase::class);

beforeEach(function () {
    Role::firstOrCreate(['name' => 'beekeeper', 'guard_name' => 'web']);
    config(['services.telegram.test_secret' => 'test-telegram-secret']);
    // TelegramService::execute() throws before making any HTTP call when the token
    // is missing — set a dummy token so the token check passes in tests that run the
    // job synchronously via dispatchSync() (e.g. synthetic_ready without Queue::fake()).
    config(['services.telegram.token' => 'test-bot-token']);
});

function telegramDiagnosticStack(string $deviceStatus = 'active'): array
{
    $user = User::factory()->create([
        'telegram_id' => '123456789',
    ]);
    $user->assignRole('beekeeper');

    $hive = Hive::create([
        'beekeeper_id' => $user->id,
        'name' => 'Diagnostic Hive',
    ]);

    IotNode::create([
        'hive_id' => $hive->id,
        'node_identifier' => 'NODE-001',
        'device_status' => $deviceStatus,
    ]);

    return compact('user', 'hive');
}

function telegramDiagnosticPayload(int $hiveId, string $mode = 'full_pipeline'): array
{
    return [
        'mode' => $mode,
        'device_id' => 'NODE-001',
        'hive_id' => $hiveId,
        'temp' => 31.2,
        'humidity' => 76.0,
        'mq2_value' => 145,
        'mq3_value' => 160,
        'mq5_value' => 235,
        'mq135_value' => 280,
    ];
}

function telegramDiagnosticHeaders(?string $secret = 'test-telegram-secret'): array
{
    if ($secret === null) {
        return [];
    }

    return ['X-Test-Secret' => $secret];
}

function fakeReadyMl(): void
{
    Http::fake(['*/predict' => Http::response([
        'readiness_level' => 'ready',
        'raw_readiness_level' => 'ready',
        'hri_value' => 1.0,
        'raw_hri_value' => 1.0,
        'confidence_score' => 0.92,
        'model_version' => 'test-model-v2',
        'warning_state' => 'normal',
        'guardrail_action' => 'none',
        'threshold_warning_level' => null,
        'prediction_warning' => null,
        'out_of_distribution' => false,
        'out_of_distribution_features' => [],
    ], 200)]);
}

test('diagnostic endpoint rejects missing or incorrect test secret', function (?string $secret) {
    ['hive' => $hive] = telegramDiagnosticStack();

    $response = $this->postJson(
        '/api/internal/test-telegram-ready',
        telegramDiagnosticPayload($hive->id),
        telegramDiagnosticHeaders($secret),
    );

    $response->assertStatus(401);
    expect(SensorLog::count())->toBe(0);
})->with([
    'missing secret' => [null],
    'wrong secret' => ['wrong-secret'],
]);

test('diagnostic endpoint rejects invalid payloads and inactive device pairings', function () {
    ['hive' => $hive] = telegramDiagnosticStack(deviceStatus: 'inactive');

    $invalidPayload = telegramDiagnosticPayload($hive->id);
    $invalidPayload['temp'] = 999;

    $this->postJson(
        '/api/internal/test-telegram-ready',
        $invalidPayload,
        telegramDiagnosticHeaders(),
    )->assertStatus(422);

    $inactiveResponse = $this->postJson(
        '/api/internal/test-telegram-ready',
        telegramDiagnosticPayload($hive->id),
        telegramDiagnosticHeaders(),
    );

    $inactiveResponse->assertStatus(404);
    expect(SensorLog::count())->toBe(0);
});

test('full pipeline returns 409 when final prediction is not ready', function () {
    Queue::fake();
    Http::fake(['*/predict' => Http::response([
        'readiness_level' => 'approaching',
        'raw_readiness_level' => 'ready',
        'hri_value' => 0.50,
        'raw_hri_value' => 1.00,
        'confidence_score' => 0.87,
        'model_version' => 'test-model-v2',
        'warning_state' => 'warning',
        'guardrail_action' => 'downgrade',
        'threshold_warning_level' => 'warning',
        'prediction_warning' => 'Guardrail downgraded the prediction.',
        'out_of_distribution' => false,
        'out_of_distribution_features' => [],
    ], 200)]);

    ['hive' => $hive] = telegramDiagnosticStack();

    $response = $this->postJson(
        '/api/internal/test-telegram-ready',
        telegramDiagnosticPayload($hive->id, 'full_pipeline'),
        telegramDiagnosticHeaders(),
    );

    $response->assertStatus(409)
        ->assertJson([
            'readiness_level' => 'approaching',
            'raw_readiness_level' => 'ready',
            'guardrail_action' => 'downgrade',
            'telegram_dispatch' => 'not_ready',
            'prediction_source' => 'ml_pipeline',
        ])
        ->assertJsonPath('error.code', 'prediction_not_ready');
    expect($response->json('meta.request_id'))->toBeString();

    expect(Prediction::count())->toBe(1);
    Queue::assertNotPushed(SendTelegramAlert::class);
});

test('full pipeline returns 503 when ml is unavailable', function () {
    Queue::fake();
    Http::fake(['*/predict' => Http::response(null, 500)]);

    ['hive' => $hive] = telegramDiagnosticStack();

    $response = $this->postJson(
        '/api/internal/test-telegram-ready',
        telegramDiagnosticPayload($hive->id, 'full_pipeline'),
        telegramDiagnosticHeaders(),
    );

    $response->assertStatus(503)
        ->assertJson([
            'prediction_id' => null,
            'telegram_dispatch' => 'not_attempted',
            'prediction_source' => null,
        ])
        ->assertJsonPath('error.code', 'ml_unavailable');
    expect($response->json('meta.request_id'))->toBeString();

    expect(SensorLog::count())->toBe(1);
    expect(Prediction::count())->toBe(0);
    Queue::assertNotPushed(SendTelegramAlert::class);
});

test('successful full pipeline stores a sensor log, stores a prediction, and queues telegram alert', function () {
    Queue::fake();
    fakeReadyMl();
    ['hive' => $hive] = telegramDiagnosticStack();

    $response = $this->postJson(
        '/api/internal/test-telegram-ready',
        telegramDiagnosticPayload($hive->id, 'full_pipeline'),
        telegramDiagnosticHeaders(),
    );

    $response->assertStatus(201)
        ->assertJson([
            'readiness_level' => 'ready',
            'prediction_source' => 'ml_pipeline',
            'telegram_dispatch' => 'queued',
        ]);

    $prediction = Prediction::first();

    expect(SensorLog::count())->toBe(1);
    expect($prediction)->not->toBeNull();
    Queue::assertPushed(SendTelegramAlert::class, fn (SendTelegramAlert $job) => $job->predictionId === $prediction->id);
});

test('successful synthetic ready mode stores a marked synthetic prediction and sends telegram immediately', function () {
    // Queue::fake() is intentionally absent — synthetic_ready sends Telegram synchronously
    // via dispatchSync(), bypassing the queue worker entirely.
    Http::fake(['*/api.telegram.org/*' => Http::response(['ok' => true], 200)]);
    ['hive' => $hive] = telegramDiagnosticStack();

    $response = $this->postJson(
        '/api/internal/test-telegram-ready',
        telegramDiagnosticPayload($hive->id, 'synthetic_ready'),
        telegramDiagnosticHeaders(),
    );

    $response->assertStatus(201)
        ->assertJson([
            'readiness_level'   => 'ready',
            'prediction_source' => 'synthetic_diagnostic',
            'telegram_dispatch' => 'sent',
        ]);

    $prediction = Prediction::first();

    expect(SensorLog::count())->toBe(1);
    expect($prediction->model_version)->toBe('synthetic_diagnostic_ready_v1');
    expect($prediction->prediction_warning)->toContain('Synthetic diagnostic prediction');
    // Telegram API was called synchronously — confirm the HTTP call reached the bot endpoint
    Http::assertSent(fn ($req) => str_contains($req->url(), 'api.telegram.org'));
});

test('synthetic diagnostic predictions are clearly distinguishable from real ml predictions', function () {
    Queue::fake();
    // Fake both the ML endpoint and the Telegram API — synthetic_ready now calls
    // Telegram synchronously via dispatchSync(), so the Telegram URL must be faked too.
    Http::fake([
        '*/predict'          => Http::response([
            'readiness_level' => 'ready', 'raw_readiness_level' => 'ready',
            'hri_value' => 1.0, 'raw_hri_value' => 1.0,
            'confidence_score' => 0.92, 'model_version' => 'test-model-v2',
            'warning_state' => 'normal', 'guardrail_action' => 'none',
            'threshold_warning_level' => null, 'prediction_warning' => null,
            'out_of_distribution' => false, 'out_of_distribution_features' => [],
        ], 200),
        '*/api.telegram.org/*' => Http::response(['ok' => true], 200),
    ]);
    ['hive' => $hive] = telegramDiagnosticStack();

    $this->postJson(
        '/api/internal/test-telegram-ready',
        telegramDiagnosticPayload($hive->id, 'full_pipeline'),
        telegramDiagnosticHeaders(),
    )->assertStatus(201);

    $this->postJson(
        '/api/internal/test-telegram-ready',
        telegramDiagnosticPayload($hive->id, 'synthetic_ready'),
        telegramDiagnosticHeaders(),
    )->assertStatus(201);

    $realPrediction = Prediction::where('model_version', 'test-model-v2')->first();
    $syntheticPrediction = Prediction::where('model_version', 'synthetic_diagnostic_ready_v1')->first();

    expect($realPrediction)->not->toBeNull();
    expect($syntheticPrediction)->not->toBeNull();
    expect($syntheticPrediction->prediction_warning)->toContain('Synthetic diagnostic prediction');
    expect($syntheticPrediction->model_version)->not->toBe($realPrediction->model_version);

    // Queue::fake() intercepts dispatchSync() on ShouldQueue jobs by routing them through
    // dispatchToQueue('sync') — so the Telegram HTTP call is never executed here.
    // full_pipeline: 1 ML HTTP call + 1 queued job via dispatch()
    // synthetic_ready: 0 ML calls + 1 captured job via dispatchSync() (no Telegram HTTP call)
    Http::assertSentCount(1);
    Queue::assertPushed(SendTelegramAlert::class, 2);
});
