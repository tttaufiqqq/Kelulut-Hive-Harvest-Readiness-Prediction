<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class MasterSpecies extends Model
{
    protected $table = 'master_species';

    protected $fillable = ['name'];

    public function hives(): HasMany
    {
        return $this->hasMany(Hive::class, 'species_id');
    }
}
