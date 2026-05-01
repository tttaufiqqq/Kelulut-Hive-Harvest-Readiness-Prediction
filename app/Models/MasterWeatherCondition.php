<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class MasterWeatherCondition extends Model
{
    protected $table = 'master_weather_conditions';

    protected $fillable = ['name'];

    public function inspections(): BelongsToMany
    {
        return $this->belongsToMany(Inspection::class, 'inspection_weather', 'weather_id', 'inspection_id');
    }
}
