<?php

namespace Database\Factories;

use App\Models\Hive;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

class HiveFactory extends Factory
{
    protected $model = Hive::class;

    public function definition(): array
    {
        return [
            'beekeeper_id' => User::factory(),
            'name'         => 'Hive ' . fake()->unique()->word(),
            'species_id'   => null,
            'site_id'      => null,
            'image_path'   => null,
            'status'       => 'active',
        ];
    }
}
