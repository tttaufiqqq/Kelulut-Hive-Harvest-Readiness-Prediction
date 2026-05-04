<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Prediction extends Model
{
    public $timestamps = false;

    protected $casts = [
        'prediction_timestamp' => 'datetime',
        'raw_hri_value' => 'float',
        'out_of_distribution' => 'boolean',
        'out_of_distribution_features' => 'array',
    ];

    protected $fillable = [
        'sensor_log_id',
        'readiness_level',
        'raw_readiness_level',
        'hri_value',
        'raw_hri_value',
        'confidence_score',
        'model_version',
        'warning_state',
        'prediction_warning',
        'guardrail_action',
        'threshold_warning_level',
        'out_of_distribution',
        'out_of_distribution_features',
        'prediction_timestamp',
    ];

    public function sensorLog(): BelongsTo
    {
        return $this->belongsTo(SensorLog::class);
    }
}
