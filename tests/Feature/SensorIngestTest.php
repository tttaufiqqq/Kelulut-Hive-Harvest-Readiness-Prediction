<?php

use App\Models\Hive;
use App\Models\HriSummary;
use App\Models\IotNode;
use App\Models\Prediction;
use App\Models\SensorLog;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Spatie\Permission\Models\Role;

uses(RefreshDatabase::class);

beforeEach(function () {
    Role::firstOrCreate(['name' => 'beekeeper', 'guard_name' => 'web']);
    config(['app.iot_api_key' => 'test-api-key']);
});

// ── Helpers ───────────────────────────────────────────────────────────────

function sensorStack(): array
{
    $user = User::factory()->create();
    $user->assignRole('beekeeper');
    $hive = Hive::create(['beekeeper_id' => $user->id, 'name' => 'Test Hive']);
    IotNode::create([
        'hive_id' => $hive->id,
        'device_id' => 'NODE-001',
        'device_status' => 'active',
    ]);

    return compact('user', 'hive');
}

function sensorPayload(int $hiveId): array
{
    return [
        'device_id' => 'NODE-001',
        'hive_id' => $hiveId,
        'temp' => 33.5,
        'humidity' => 70.0,
        'mq2_value' => 250,
        'mq3_value' => 200,
        'mq5_value' => 180,
        'mq135_value' => 220,
    ];
}

function fakeMlOk(): void
{
    Http::fake(['*/predict' => Http::response([
        'readiness_level' => 'not_ready',
        'raw_readiness_level' => 'not_ready',
        'hri_value' => 0.25,
        'raw_hri_value' => 0.25,
        'confidence_score' => 0.80,
        'model_version' => 'test-model-v1',
        'warning_state' => 'normal',
        'guardrail_action' => 'none',
        'threshold_warning_level' => null,
        'prediction_warning' => null,
        'out_of_distribution' => false,
        'out_of_distribution_features' => [],
    ], 200)]);
}

// ── Test 1: happy path — 201 + sensor_log stored ──────────────────────────

test('valid payload returns 201 and stores sensor log', function () {
    fakeMlOk();
    ['hive' => $hive] = sensorStack();

    $response = $this->postJson('/api/sensor-data', sensorPayload($hive->id), ['X-API-Key' => 'test-api-key']);

    $response->assertStatus(201);
    expect(SensorLog::count())->toBe(1);
});

// ── Test 2: prediction stored and linked to sensor log ────────────────────

test('prediction is stored and linked to sensor log', function () {
    fakeMlOk();
    ['hive' => $hive] = sensorStack();

    $this->postJson('/api/sensor-data', sensorPayload($hive->id), ['X-API-Key' => 'test-api-key']);

    expect(Prediction::count())->toBe(1);
    expect(Prediction::first()->sensor_log_id)->toBe(SensorLog::first()->id);
});

test('prediction warning metadata is stored when ml flags low trust', function () {
    Http::fake(['*/predict' => Http::response([
        'readiness_level' => 'approaching',
        'raw_readiness_level' => 'ready',
        'hri_value' => 0.50,
        'raw_hri_value' => 1.00,
        'confidence_score' => 0.96,
        'model_version' => 'synthetic-flat-knn-k7-distance',
        'warning_state' => 'critical',
        'guardrail_action' => 'suppress',
        'threshold_warning_level' => 'critical',
        'prediction_warning' => 'Critical threshold signals override the optimistic raw ML prediction.',
        'out_of_distribution' => true,
        'out_of_distribution_features' => [
            ['feature' => 'temp', 'value' => 41.6, 'min' => 25.3, 'max' => 33.6],
        ],
    ], 200)]);

    ['hive' => $hive] = sensorStack();

    $this->postJson('/api/sensor-data', sensorPayload($hive->id), ['X-API-Key' => 'test-api-key']);

    $prediction = Prediction::first();

    expect($prediction->model_version)->toBe('synthetic-flat-knn-k7-distance');
    expect($prediction->warning_state)->toBe('critical');
    expect($prediction->guardrail_action)->toBe('suppress');
    expect($prediction->out_of_distribution)->toBeTrue();
    expect($prediction->out_of_distribution_features[0]['feature'])->toBe('temp');
    expect($prediction->raw_readiness_level)->toBe('ready');
    expect($prediction->readiness_level)->toBe('approaching');
});

// ── Test 3: hri_summary created for hive + today ─────────────────────────

test('hri_summary is created after prediction', function () {
    fakeMlOk();
    ['hive' => $hive] = sensorStack();

    $this->postJson('/api/sensor-data', sensorPayload($hive->id), ['X-API-Key' => 'test-api-key']);

    expect(HriSummary::where('hive_id', $hive->id)->exists())->toBeTrue();
});

// ── Test 4: missing X-API-Key returns 401, no log stored ─────────────────

test('missing api key returns 401 and stores no sensor log', function () {
    $response = $this->postJson('/api/sensor-data', [
        'device_id' => 'NODE-001', 'hive_id' => 1,
        'temp' => 33.5, 'humidity' => 70.0,
        'mq2_value' => 250, 'mq3_value' => 200, 'mq5_value' => 180, 'mq135_value' => 220,
    ]);

    $response->assertStatus(401)
        ->assertJsonPath('error.code', 'unauthorized')
        ->assertJsonPath('error.message', 'The API key is missing or invalid.');
    expect($response->json('meta.request_id'))->toBeString();
    expect(SensorLog::count())->toBe(0);
});

// ── Test 5: wrong X-API-Key returns 401 ──────────────────────────────────

test('wrong api key returns 401', function () {
    $response = $this->postJson('/api/sensor-data', [
        'device_id' => 'NODE-001', 'hive_id' => 1,
        'temp' => 33.5, 'humidity' => 70.0,
        'mq2_value' => 250, 'mq3_value' => 200, 'mq5_value' => 180, 'mq135_value' => 220,
    ], ['X-API-Key' => 'wrong-key']);

    $response->assertStatus(401)
        ->assertJsonPath('error.code', 'unauthorized');
});

// ── Test 6: invalid payload (temp=999) returns 422, no log stored ─────────

test('out of range temp returns 422 and stores no sensor log', function () {
    $user = User::factory()->create();
    $hive = Hive::create(['beekeeper_id' => $user->id, 'name' => 'Test Hive']);

    $payload = sensorPayload($hive->id);
    $payload['temp'] = 999;

    $response = $this->postJson('/api/sensor-data', $payload, ['X-API-Key' => 'test-api-key']);

    $response->assertStatus(422);
    expect(SensorLog::count())->toBe(0);
});

// ── Test 7: unknown device_id returns 404 ────────────────────────────────

test('unknown device returns 404', function () {
    $user = User::factory()->create();
    $hive = Hive::create(['beekeeper_id' => $user->id, 'name' => 'Test Hive']);

    $payload = sensorPayload($hive->id);
    $payload['device_id'] = 'FAKE-NODE';

    $response = $this->postJson('/api/sensor-data', $payload, ['X-API-Key' => 'test-api-key']);

    $response->assertStatus(404)
        ->assertJsonPath('error.code', 'not_found')
        ->assertJsonPath(
            'error.message',
            'Device not registered for the selected hive.',
        );
    expect($response->json('meta.request_id'))->toBeString();
});

// ── Test 8: Flask down — sensor_log saved, no prediction, still 201 ───────

test('ml script down still returns 201 and saves sensor log without prediction', function () {
    Http::fake(['*/predict' => Http::response(null, 500)]);

    ['hive' => $hive] = sensorStack();

    $response = $this->postJson('/api/sensor-data', sensorPayload($hive->id), ['X-API-Key' => 'test-api-key']);

    $response->assertStatus(201)
        ->assertJsonPath('warnings.0.code', 'ml_unavailable')
        ->assertJsonPath(
            'warnings.0.message',
            'Live readiness prediction is temporarily unavailable.',
        );
    expect($response->json('meta.request_id'))->toBeString();
    expect(SensorLog::count())->toBe(1);
    expect(Prediction::count())->toBe(0);
});

// ── Test 9: threshold records written to sensor_log_thresholds ───────────

test('threshold records are written for matching sensor readings', function () {
    fakeMlOk();
    ['hive' => $hive] = sensorStack();

    // Seed a threshold that matches temp=33.5
    DB::table('master_sensor_thresholds')->insert([
        'sensor_type' => 'temp',
        'min_value' => 32.0,
        'max_value' => 37.0,
        'level' => 'normal',
        'meaning' => 'Optimal hive temperature',
        'recommended_action' => 'No action needed',
        'created_at' => now(),
        'updated_at' => now(),
    ]);

    $this->postJson('/api/sensor-data', sensorPayload($hive->id), ['X-API-Key' => 'test-api-key']);

    $logId = SensorLog::first()->id;
    expect(DB::table('sensor_log_thresholds')->where('sensor_log_id', $logId)->count())->toBe(1);
});
