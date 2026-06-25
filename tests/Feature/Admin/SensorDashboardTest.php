<?php

use App\Models\Hive;
use App\Models\IotNode;
use App\Models\SensorLog;
use App\Models\User;
use Inertia\Testing\AssertableInertia as Assert;
use Spatie\Permission\Models\Role;

beforeEach(function () {
    Role::firstOrCreate(['name' => 'admin', 'guard_name' => 'web']);
    Role::firstOrCreate(['name' => 'beekeeper', 'guard_name' => 'web']);
});

test('admin sensors shows zero sensor readings as zero — not null', function () {
    $admin = User::factory()->create();
    $admin->assignRole('admin');

    $beekeeper = User::factory()->create();
    $beekeeper->assignRole('beekeeper');

    $hive = Hive::create(['beekeeper_id' => $beekeeper->id, 'name' => 'Test Hive']);
    $node = IotNode::create([
        'hive_id' => $hive->id,
        'node_identifier' => 'NODE-001',
        'device_status' => 'active',
    ]);

    SensorLog::create([
        'hive_id' => $hive->id,
        'device_id' => $node->id,
        'temp' => 0,
        'humidity' => 88,
        'mq2_value' => 39,
        'mq3_value' => 0,
        'mq5_value' => 127,
        'mq135_value' => 0,
        'record_timestamp' => now(),
    ]);

    $this->actingAs($admin)
        ->get(route('admin.sensors.index', ['hive_id' => $hive->id]))
        ->assertInertia(fn (Assert $page) => $page
            ->component('admin/sensors')
            ->where('latest.temperature', 0)
            ->where('latest.humidity', 88)
            ->where('latest.mq2', 39)
            ->where('latest.mq3', 0)
            ->where('latest.mq5', 127)
            ->where('latest.mq135', 0)
            ->where('history.0.temperature', 0)
            ->where('history.0.mq3', 0)
            ->where('history.0.mq135', 0)
        );
});
