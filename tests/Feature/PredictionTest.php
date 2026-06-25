<?php

use App\Models\Hive;
use App\Models\IotNode;
use App\Models\Prediction;
use App\Models\SensorLog;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Inertia\Testing\AssertableInertia as Assert;
use Spatie\Permission\Models\Role;

uses(RefreshDatabase::class);

beforeEach(function () {
    Role::firstOrCreate(['name' => 'beekeeper', 'guard_name' => 'web']);
    Role::firstOrCreate(['name' => 'admin', 'guard_name' => 'web']);
});

test('beekeeper can view live predictions for own hive', function () {
    $beekeeper = User::factory()->create();
    $beekeeper->assignRole('beekeeper');
    $hive = Hive::create(['beekeeper_id' => $beekeeper->id, 'name' => 'My Hive']);

    $this->actingAs($beekeeper)
        ->get(route('predictions.live', $hive))
        ->assertOk();
});

test('live predictions response supports empty prediction state', function () {
    $beekeeper = User::factory()->create();
    $beekeeper->assignRole('beekeeper');
    $hive = Hive::create(['beekeeper_id' => $beekeeper->id, 'name' => 'My Hive']);

    $this->actingAs($beekeeper)
        ->get(route('predictions.live', $hive))
        ->assertInertia(fn (Assert $page) => $page
            ->component('predictions/index')
            ->where('hive.id', $hive->id)
            ->where('latestPrediction', null)
            ->has('historyPredictions.data', 0)
            ->has('predictionTrends', 0)
        );
});

test('live predictions does not flag zero sensor readings as missing — zero is a valid ADC reading', function () {
    $beekeeper = User::factory()->create();
    $beekeeper->assignRole('beekeeper');
    $hive = Hive::create(['beekeeper_id' => $beekeeper->id, 'name' => 'My Hive']);
    $node = IotNode::create([
        'hive_id' => $hive->id,
        'node_identifier' => 'NODE-001',
        'device_status' => 'active',
    ]);

    SensorLog::create([
        'hive_id' => $hive->id,
        'device_id' => $node->id,
        'temp' => 31.8,
        'humidity' => 88.0,
        'mq2_value' => 40,
        'mq3_value' => 0,
        'mq5_value' => 121,
        'mq135_value' => 0,
        'record_timestamp' => now()->subMinute(),
    ]);

    $this->actingAs($beekeeper)
        ->get(route('predictions.live', $hive))
        ->assertInertia(fn (Assert $page) => $page
            ->component('predictions/index')
            ->where('latestPrediction', null)
            ->where('sensorWarnings', [])
            ->has('historyPredictions.data', 0)
            ->has('predictionTrends', 0)
        );
});

test('live predictions response includes enriched process payload', function () {
    $beekeeper = User::factory()->create();
    $beekeeper->assignRole('beekeeper');
    $hive = Hive::create(['beekeeper_id' => $beekeeper->id, 'name' => 'My Hive']);
    $node = IotNode::create([
        'hive_id' => $hive->id,
        'node_identifier' => 'NODE-001',
        'device_status' => 'active',
    ]);

    $sensorLog = SensorLog::create([
        'hive_id' => $hive->id,
        'device_id' => $node->id,
        'temp' => 33.5,
        'humidity' => 70.0,
        'mq2_value' => 250,
        'mq3_value' => 200,
        'mq5_value' => 180,
        'mq135_value' => 220,
        'record_timestamp' => now()->subMinute(),
    ]);

    $thresholdId = DB::table('master_sensor_thresholds')->insertGetId([
        'sensor_type' => 'temp',
        'min_value' => 32.0,
        'max_value' => 37.0,
        'level' => 'normal',
        'meaning' => 'Optimal hive temperature',
        'recommended_action' => 'No action needed',
        'created_at' => now(),
        'updated_at' => now(),
    ]);

    DB::table('sensor_log_thresholds')->insert([
        'sensor_log_id' => $sensorLog->id,
        'threshold_id' => $thresholdId,
    ]);

    Prediction::create([
        'sensor_log_id' => $sensorLog->id,
        'readiness_level' => 'nearly_ready',
        'raw_readiness_level' => 'ready',
        'hri_value' => 0.78,
        'raw_hri_value' => 1.0,
        'confidence_score' => 0.91,
        'model_version' => 'synthetic-flat-knn-k7-distance',
        'warning_state' => 'warning',
        'prediction_warning' => 'Input is outside the training feature bounds for: temp.',
        'guardrail_action' => 'downgrade',
        'threshold_warning_level' => null,
        'out_of_distribution' => true,
        'out_of_distribution_features' => [
            ['feature' => 'temp', 'value' => 34.2, 'min' => 25.3, 'max' => 33.6],
        ],
        'prediction_timestamp' => now(),
    ]);

    $this->actingAs($beekeeper)
        ->get(route('predictions.live', $hive))
        ->assertInertia(fn (Assert $page) => $page
            ->component('predictions/index')
            ->where('hive.id', $hive->id)
            ->where('latestPrediction.sensor_log_id', $sensorLog->id)
            ->where('latestPrediction.device_identifier', 'NODE-001')
            ->where('latestPrediction.sensor_values.temp', 33.5)
            ->where('latestPrediction.sensor_values.mq2_value', 250)
            ->where('latestPrediction.model_version', 'synthetic-flat-knn-k7-distance')
            ->where('latestPrediction.warning_state', 'warning')
            ->where('latestPrediction.out_of_distribution', true)
            ->where('latestPrediction.raw_readiness_level', 'ready')
            ->where('latestPrediction.out_of_distribution_features.0.feature', 'temp')
            ->has('latestPrediction.threshold_match_summaries', 1)
            ->where('latestPrediction.threshold_match_summaries.0.sensor_type', 'temp')
            ->where('latestPrediction.threshold_match_summaries.0.level', 'normal')
            ->where('latestPrediction.threshold_match_summaries.0.reading', 33.5)
            ->has('historyPredictions.data', 0)
            ->has('predictionTrends', 1)
        );
});

test('live predictions returns zero sensor values as zero — not null', function () {
    $beekeeper = User::factory()->create();
    $beekeeper->assignRole('beekeeper');
    $hive = Hive::create(['beekeeper_id' => $beekeeper->id, 'name' => 'My Hive']);
    $node = IotNode::create([
        'hive_id' => $hive->id,
        'node_identifier' => 'NODE-001',
        'device_status' => 'active',
    ]);

    $sensorLog = SensorLog::create([
        'hive_id' => $hive->id,
        'device_id' => $node->id,
        'temp' => 31.8,
        'humidity' => 88.0,
        'mq2_value' => 39,
        'mq3_value' => 0,
        'mq5_value' => 127,
        'mq135_value' => 0,
        'record_timestamp' => now()->subMinute(),
    ]);

    Prediction::create([
        'sensor_log_id' => $sensorLog->id,
        'readiness_level' => 'approaching',
        'hri_value' => 0.5,
        'confidence_score' => 0.8,
        'prediction_timestamp' => now(),
    ]);

    $this->actingAs($beekeeper)
        ->get(route('predictions.live', $hive))
        ->assertInertia(fn (Assert $page) => $page
            ->component('predictions/index')
            ->where('latestPrediction.sensor_values.temp', 31.8)
            ->where('latestPrediction.sensor_values.humidity', 88)
            ->where('latestPrediction.sensor_values.mq2_value', 39)
            ->where('latestPrediction.sensor_values.mq3_value', 0)
            ->where('latestPrediction.sensor_values.mq5_value', 127)
            ->where('latestPrediction.sensor_values.mq135_value', 0)
        );
});

test('live predictions response returns the newest results first', function () {
    $beekeeper = User::factory()->create();
    $beekeeper->assignRole('beekeeper');
    $hive = Hive::create(['beekeeper_id' => $beekeeper->id, 'name' => 'My Hive']);
    $node = IotNode::create([
        'hive_id' => $hive->id,
        'node_identifier' => 'NODE-001',
        'device_status' => 'active',
    ]);

    $olderLog = SensorLog::create([
        'hive_id' => $hive->id,
        'device_id' => $node->id,
        'temp' => 32.8,
        'humidity' => 68.0,
        'mq2_value' => 240,
        'mq3_value' => 190,
        'mq5_value' => 170,
        'mq135_value' => 210,
        'record_timestamp' => now()->subMinutes(5),
    ]);

    $newerLog = SensorLog::create([
        'hive_id' => $hive->id,
        'device_id' => $node->id,
        'temp' => 34.1,
        'humidity' => 71.0,
        'mq2_value' => 255,
        'mq3_value' => 205,
        'mq5_value' => 185,
        'mq135_value' => 225,
        'record_timestamp' => now()->subMinute(),
    ]);

    $olderPrediction = Prediction::create([
        'sensor_log_id' => $olderLog->id,
        'readiness_level' => 'approaching',
        'hri_value' => 0.61,
        'confidence_score' => 0.74,
        'prediction_timestamp' => now()->subMinutes(4),
    ]);

    $newerPrediction = Prediction::create([
        'sensor_log_id' => $newerLog->id,
        'readiness_level' => 'nearly_ready',
        'hri_value' => 0.82,
        'confidence_score' => 0.9,
        'prediction_timestamp' => now(),
    ]);

    $this->actingAs($beekeeper)
        ->get(route('predictions.live', $hive))
        ->assertInertia(fn (Assert $page) => $page
            ->component('predictions/index')
            ->where('latestPrediction.id', $newerPrediction->id)
            ->has('historyPredictions.data', 1)
            ->where('historyPredictions.data.0.id', $olderPrediction->id)
            ->has('predictionTrends', 2)
            ->where('predictionTrends.0.id', $olderPrediction->id)
            ->where('predictionTrends.1.id', $newerPrediction->id)
        );
});

test('live predictions defaults the chart filter to today even when latest data is from yesterday', function () {
    Carbon::setTestNow('2026-05-05 14:00:00');

    try {
        $beekeeper = User::factory()->create();
        $beekeeper->assignRole('beekeeper');
        $hive = Hive::create(['beekeeper_id' => $beekeeper->id, 'name' => 'My Hive']);
        $node = IotNode::create([
            'hive_id' => $hive->id,
            'node_identifier' => 'NODE-001',
            'device_status' => 'active',
        ]);

        $sensorLog = SensorLog::create([
            'hive_id' => $hive->id,
            'device_id' => $node->id,
            'temp' => 18.5,
            'humidity' => 91.0,
            'mq2_value' => 150,
            'mq3_value' => 95,
            'mq5_value' => 110,
            'mq135_value' => 175,
            'record_timestamp' => Carbon::now()->subDay()->setTime(22, 2),
        ]);

        Prediction::create([
            'sensor_log_id' => $sensorLog->id,
            'readiness_level' => 'not_ready',
            'hri_value' => 0.25,
            'confidence_score' => 0.565,
            'prediction_timestamp' => Carbon::now()->subDay()->setTime(22, 2),
        ]);

        $this->actingAs($beekeeper)
            ->get(route('predictions.live', $hive))
            ->assertInertia(fn (Assert $page) => $page
                ->component('predictions/index')
                ->where('filters.chart_date', '2026-05-05')
                ->where('filters.default_chart_date', '2026-05-05')
                ->has('predictionTrends', 0)
            );
    } finally {
        Carbon::setTestNow();
    }
});

test('beekeeper cannot view another beekeepers live predictions', function () {
    $beekeeper = User::factory()->create();
    $beekeeper->assignRole('beekeeper');

    $other = User::factory()->create();
    $other->assignRole('beekeeper');
    $hive = Hive::create(['beekeeper_id' => $other->id, 'name' => 'Other Hive']);

    $this->actingAs($beekeeper)
        ->get(route('predictions.live', $hive))
        ->assertStatus(403);
});
