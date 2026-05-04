<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class MasterSensorThreshold extends Model
{
    protected $fillable = [
        'sensor_type',
        'min_value',
        'max_value',
        'level',
        'meaning',
        'recommended_action',
    ];

    public function sensorLogs(): BelongsToMany
    {
        return $this->belongsToMany(
            SensorLog::class,
            'sensor_log_thresholds',
            'threshold_id',
            'sensor_log_id',
        );
    }
}
