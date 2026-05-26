<?php

namespace App\Models;

use App\Traits\Auditable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class IotNode extends Model
{
    use Auditable;
    protected $fillable = ['hive_id', 'node_identifier', 'device_status', 'installation_date', 'last_maintenance_date'];

    public function hive(): BelongsTo
    {
        return $this->belongsTo(Hive::class);
    }

    public function sensorLogs(): HasMany
    {
        return $this->hasMany(SensorLog::class, 'device_id');
    }
}
