<?php

namespace App\Http\Requests\Inspection;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreInspectionRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->hasRole('beekeeper');
    }

    public function rules(): array
    {
        return [
            'hive_id'                    => ['required', 'integer', Rule::exists('hives', 'id')->where('beekeeper_id', $this->user()->id)],
            'inspection_date'            => ['required', 'date', 'before_or_equal:today'],
            'blooming_status'            => ['nullable', 'string', 'max:2000'],
            'vegetation_density'         => ['nullable', 'string', 'max:2000'],
            'nectar_source_availability' => ['nullable', 'string', 'max:2000'],
            'structural_damage'          => ['nullable', 'string', 'max:2000'],
            'food_source_observation'    => ['nullable', 'string', 'max:2000'],
            'notes'                      => ['nullable', 'string', 'max:2000'],
            'weather_ids'                => ['nullable', 'array'],
            'weather_ids.*'              => ['integer', 'exists:master_weather_conditions,id'],
            'flora_ids'                  => ['nullable', 'array'],
            'flora_ids.*'               => ['integer', 'exists:master_flora_types,id'],
        ];
    }
}
