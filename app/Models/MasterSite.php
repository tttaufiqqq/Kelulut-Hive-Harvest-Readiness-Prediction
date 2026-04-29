<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class MasterSite extends Model
{
    protected $table = 'master_sites';

    protected $fillable = ['name', 'description'];

    public function hives(): HasMany
    {
        return $this->hasMany(Hive::class, 'site_id');
    }
}
