<?php

namespace App\Models;

use App\Traits\Auditable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class Inspection extends Model
{
    use Auditable;
    protected $fillable = [
        'hive_id', 'beekeeper_id', 'inspection_date',
        'blooming_status', 'vegetation_density', 'nectar_source_availability',
        'structural_damage', 'food_source_observation', 'notes',
    ];

    protected $casts = [
        'beekeeper_id' => 'integer',
        'inspection_date' => 'date',
    ];

    public function hive(): BelongsTo
    {
        return $this->belongsTo(Hive::class);
    }

    public function beekeeper(): BelongsTo
    {
        return $this->belongsTo(User::class, 'beekeeper_id');
    }

    public function weatherConditions(): BelongsToMany
    {
        return $this->belongsToMany(MasterWeatherCondition::class, 'inspection_weather', 'inspection_id', 'weather_id');
    }

    public function floraTypes(): BelongsToMany
    {
        return $this->belongsToMany(MasterFloraType::class, 'inspection_flora', 'inspection_id', 'flora_id');
    }
}
