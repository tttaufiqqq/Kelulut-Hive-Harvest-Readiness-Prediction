<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Prediction extends Model
{
    public $timestamps = false;

    protected $casts = [
        'prediction_timestamp' => 'datetime',
    ];

    protected $fillable = [
        'sensor_log_id',
        'readiness_level',
        'hri_value',
        'confidence_score',
        'prediction_timestamp',
    ];

    public function sensorLog(): BelongsTo
    {
        return $this->belongsTo(SensorLog::class);
    }
}
