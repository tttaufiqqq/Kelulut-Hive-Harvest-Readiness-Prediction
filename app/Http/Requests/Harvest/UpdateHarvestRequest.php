<?php

namespace App\Http\Requests\Harvest;

use Illuminate\Foundation\Http\FormRequest;

class UpdateHarvestRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->hasRole('beekeeper');
    }

    public function rules(): array
    {
        return [
            'harvest_date'       => ['required', 'date', 'before_or_equal:today'],
            'weight'             => ['required', 'numeric', 'min:0.01', 'max:9999.99'],
            'productivity_level' => ['nullable', 'in:Low,Medium,High'],
            'color_id'           => ['nullable', 'exists:master_honey_colors,id'],
            'flavor_id'          => ['nullable', 'exists:master_honey_flavors,id'],
            'notes'              => ['nullable', 'string', 'max:1000'],
        ];
    }
}
