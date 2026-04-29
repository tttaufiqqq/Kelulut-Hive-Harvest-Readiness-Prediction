<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class MasterHoneyColor extends Model
{
    protected $table = 'master_honey_colors';

    protected $fillable = ['name'];

    public function harvests(): HasMany
    {
        return $this->hasMany(Harvest::class, 'color_id');
    }
}
