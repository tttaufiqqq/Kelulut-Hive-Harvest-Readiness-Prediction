<?php

use App\Models\Hive;
use App\Models\IotNode;
use App\Models\Prediction;
use App\Models\SensorLog;
use App\Models\User;
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
            ->component('predictions')
            ->where('hive.id', $hive->id)
            ->has('predictions', 0)
        );
});

test('live predictions response includes enriched process payload', function () {
    $beekeeper = User::factory()->create();
    $beekeeper->assignRole('beekeeper');
    $hive = Hive::create(['beekeeper_id' => $beekeeper->id, 'name' => 'My Hive']);
    $node = IotNode::create([
        'hive_id' => $hive->id,
        'device_id' => 'NODE-001',
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
            ->component('predictions')
            ->where('hive.id', $hive->id)
            ->has('predictions', 1)
            ->where('predictions.0.sensor_log_id', $sensorLog->id)
            ->where('predictions.0.device_identifier', 'NODE-001')
            ->where('predictions.0.sensor_values.temp', 33.5)
            ->where('predictions.0.sensor_values.mq2_value', 250)
            ->where('predictions.0.model_version', 'synthetic-flat-knn-k7-distance')
            ->where('predictions.0.warning_state', 'warning')
            ->where('predictions.0.out_of_distribution', true)
            ->where('predictions.0.raw_readiness_level', 'ready')
            ->where('predictions.0.out_of_distribution_features.0.feature', 'temp')
            ->has('predictions.0.threshold_match_summaries', 1)
            ->where('predictions.0.threshold_match_summaries.0.sensor_type', 'temp')
            ->where('predictions.0.threshold_match_summaries.0.level', 'normal')
            ->where('predictions.0.threshold_match_summaries.0.reading', 33.5)
        );
});

test('live predictions response returns the newest results first', function () {
    $beekeeper = User::factory()->create();
    $beekeeper->assignRole('beekeeper');
    $hive = Hive::create(['beekeeper_id' => $beekeeper->id, 'name' => 'My Hive']);
    $node = IotNode::create([
        'hive_id' => $hive->id,
        'device_id' => 'NODE-001',
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
            ->component('predictions')
            ->has('predictions', 2)
            ->where('predictions.0.id', $newerPrediction->id)
            ->where('predictions.1.id', $olderPrediction->id)
        );
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
