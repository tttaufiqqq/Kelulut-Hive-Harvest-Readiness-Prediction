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
        'hri_value' => 0.78,
        'confidence_score' => 0.91,
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
            ->has('predictions.0.threshold_match_summaries', 1)
            ->where('predictions.0.threshold_match_summaries.0.sensor_type', 'temp')
            ->where('predictions.0.threshold_match_summaries.0.level', 'normal')
            ->where('predictions.0.threshold_match_summaries.0.reading', 33.5)
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
