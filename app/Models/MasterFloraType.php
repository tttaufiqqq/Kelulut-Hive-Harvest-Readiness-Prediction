<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class MasterFloraType extends Model
{
    protected $table = 'master_flora_types';

    protected $fillable = ['name'];

    public function inspections(): BelongsToMany
    {
        return $this->belongsToMany(Inspection::class, 'inspection_flora');
    }
}
