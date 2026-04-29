<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class HriSummary extends Model
{
    protected $table = 'hri_summary';

    protected $fillable = [
        'hive_id', 'summary_date',
        'avg_temperature', 'avg_humidity', 'avg_mq2',
        'harvest_count', 'latest_readiness_level', 'avg_hri_value',
    ];

    public function hive(): BelongsTo
    {
        return $this->belongsTo(Hive::class);
    }
}
