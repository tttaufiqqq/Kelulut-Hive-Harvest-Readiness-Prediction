<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Harvest extends Model
{
    protected $fillable = [
        'hive_id', 'beekeeper_id', 'harvest_date', 'weight',
        'productivity_level', 'color_id', 'flavor_id', 'notes',
    ];

    protected $casts = [
        'beekeeper_id' => 'integer',
        'harvest_date' => 'date',
        'weight'       => 'float',
    ];

    public function hive(): BelongsTo
    {
        return $this->belongsTo(Hive::class);
    }

    public function beekeeper(): BelongsTo
    {
        return $this->belongsTo(User::class, 'beekeeper_id');
    }

    public function color(): BelongsTo
    {
        return $this->belongsTo(MasterHoneyColor::class, 'color_id');
    }

    public function flavor(): BelongsTo
    {
        return $this->belongsTo(MasterHoneyFlavor::class, 'flavor_id');
    }
}
