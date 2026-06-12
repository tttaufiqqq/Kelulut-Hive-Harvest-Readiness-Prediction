<?php

use App\Enums\AppErrorCode;
use App\Exceptions\AppException;
use App\Jobs\SendTelegramAlert;
use App\Models\Hive;
use App\Models\IotNode;
use App\Models\Prediction;
use App\Models\SensorLog;
use App\Models\User;
use App\Services\TelegramService;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Mockery\MockInterface;
use Spatie\Permission\Models\Role;

beforeEach(function () {
    Role::firstOrCreate(['name' => 'beekeeper', 'guard_name' => 'web']);
});

function telegramAlertPrediction(?string $telegramId = '123456789'): Prediction
{
    $user = User::factory()->create(['telegram_id' => $telegramId]);
    $user->assignRole('beekeeper');

    $hive = Hive::create([
        'beekeeper_id' => $user->id,
        'name' => 'Alert Hive',
    ]);

    $node = IotNode::create([
        'hive_id' => $hive->id,
        'node_identifier' => 'NODE-ALERT-001',
        'device_status' => 'active',
    ]);

    $sensorLog = SensorLog::create([
        'hive_id' => $hive->id,
        'device_id' => $node->id,
        'temp' => 32.1,
        'humidity' => 75.0,
        'mq2_value' => 120,
        'mq3_value' => 130,
        'mq5_value' => 140,
        'mq135_value' => 150,
        'record_timestamp' => now(),
    ]);

    return Prediction::create([
        'sensor_log_id' => $sensorLog->id,
        'readiness_level' => 'ready',
        'raw_readiness_level' => 'ready',
        'hri_value' => 0.9,
        'raw_hri_value' => 0.9,
        'confidence_score' => 0.95,
        'model_version' => 'test-model',
        'warning_state' => 'normal',
        'prediction_warning' => null,
        'guardrail_action' => 'none',
        'threshold_warning_level' => null,
        'out_of_distribution' => false,
        'out_of_distribution_features' => [],
        'prediction_timestamp' => now(),
    ]);
}

test('telegram alert job defines retry behavior for external delivery', function () {
    $job = new SendTelegramAlert(1);

    expect($job->tries)->toBe(3);
    expect($job->backoff)->toBe([60, 300]);
    expect($job->timeout)->toBe(15);
});

test('telegram alert job is a no-op when the prediction no longer exists', function () {
    $this->mock(TelegramService::class, function (MockInterface $mock) {
        $mock->shouldNotReceive('execute');
    });

    $job = new SendTelegramAlert(999999);
    $job->handle(app(TelegramService::class));

    expect(true)->toBeTrue();
});

test('telegram alert job is a no-op when the beekeeper has no telegram id', function () {
    $prediction = telegramAlertPrediction(telegramId: null);

    $this->mock(TelegramService::class, function (MockInterface $mock) {
        $mock->shouldNotReceive('execute');
    });

    $job = new SendTelegramAlert($prediction->id);
    $job->handle(app(TelegramService::class));

    expect(true)->toBeTrue();
});

test('telegram service throws a typed exception when delivery fails', function () {
    config(['services.telegram.token' => 'test-token']);
    Http::fake(['*' => Http::response(['ok' => false], 500)]);

    expect(fn () => app(TelegramService::class)->execute('123456789', 'hello'))
        ->toThrow(AppException::class);
});

test('telegram alert job logs stable failure context when retries are exhausted', function () {
    $prediction = telegramAlertPrediction();
    Log::spy();

    $job = new SendTelegramAlert($prediction->id);
    $job->failed(new AppException(
        AppErrorCode::TelegramDeliveryFailed,
        503,
        'Unable to deliver the Telegram alert right now.',
        'warning',
        ['status' => 503],
    ));

    Log::shouldHaveReceived('log')->once()->with(
        'warning',
        'Application error recorded.',
        \Mockery::on(function (array $context) use ($prediction) {
            return $context['error_code'] === 'telegram_delivery_failed'
                && $context['prediction_id'] === $prediction->id
                && $context['hive_id'] === $prediction->sensorLog->hive->id
                && $context['user_id'] === $prediction->sensorLog->hive->user->id
                && $context['chat_id'] === $prediction->sensorLog->hive->user->telegram_id
                && $context['status'] === 503;
        }),
    );
});
