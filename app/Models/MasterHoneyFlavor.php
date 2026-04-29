<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class MasterHoneyFlavor extends Model
{
    protected $table = 'master_honey_flavors';

    protected $fillable = ['name'];

    public function harvests(): HasMany
    {
        return $this->hasMany(Harvest::class, 'flavor_id');
    }
}
