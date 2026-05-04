<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

class Hive extends Model
{
    use HasFactory;

    protected $fillable = [
        'beekeeper_id', 'name', 'site_id', 'species_id',
        'image_path', 'status',
    ];

    protected $casts = [
        'beekeeper_id' => 'integer',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class, 'beekeeper_id');
    }

    public function species(): BelongsTo
    {
        return $this->belongsTo(MasterSpecies::class, 'species_id');
    }

    public function site(): BelongsTo
    {
        return $this->belongsTo(MasterSite::class, 'site_id');
    }

    public function iotNodes(): HasMany
    {
        return $this->hasMany(IotNode::class);
    }

    public function sensorLogs(): HasMany
    {
        return $this->hasMany(SensorLog::class);
    }

    public function summary(): HasOne
    {
        return $this->hasOne(HriSummary::class);
    }

    public function harvests(): HasMany
    {
        return $this->hasMany(Harvest::class);
    }
}
