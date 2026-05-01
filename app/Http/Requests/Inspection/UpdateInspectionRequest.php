<?php

namespace App\Http\Requests\Inspection;

use Illuminate\Foundation\Http\FormRequest;

class UpdateInspectionRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->hasRole('beekeeper');
    }

    public function rules(): array
    {
        return [
            'inspection_date'            => ['required', 'date', 'before_or_equal:today'],
            'blooming_status'            => ['required', 'string', 'in:pre_bloom,early_bloom,peak_bloom,post_bloom,dormant'],
            'vegetation_density'         => ['required', 'string', 'in:sparse,moderate,dense'],
            'nectar_source_availability' => ['required', 'string', 'in:scarce,moderate,abundant'],
            'structural_damage'          => ['required', 'string', 'in:none,minor,moderate,severe'],
            'food_source_observation'    => ['required', 'string', 'max:2000'],
            'notes'                      => ['required', 'string', 'max:2000'],
            'weather_ids'                => ['required', 'array', 'min:1'],
            'weather_ids.*'              => ['integer', 'exists:master_weather_conditions,id'],
            'flora_ids'                  => ['required', 'array', 'min:1'],
            'flora_ids.*'                => ['integer', 'exists:master_flora_types,id'],
        ];
    }
}
