<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

class SensorLog extends Model
{
    const UPDATED_AT = null;

    protected $casts = [
        'record_timestamp' => 'datetime',
    ];

    protected $fillable = [
        'hive_id', 'device_id',
        'temp', 'humidity',
        'mq2_value', 'mq3_value', 'mq5_value', 'mq135_value',
        'record_timestamp',
    ];

    public function hive(): BelongsTo
    {
        return $this->belongsTo(Hive::class);
    }

    public function iotNode(): BelongsTo
    {
        return $this->belongsTo(IotNode::class, 'device_id');
    }

    public function prediction(): HasOne
    {
        return $this->hasOne(Prediction::class);
    }

    public function matchedThresholds(): BelongsToMany
    {
        return $this->belongsToMany(
            MasterSensorThreshold::class,
            'sensor_log_thresholds',
            'sensor_log_id',
            'threshold_id',
        );
    }
}
