<?php

namespace App\Http\Requests\Hive;

use Illuminate\Foundation\Http\FormRequest;

class StoreHiveRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->hasRole('admin');
    }

    public function rules(): array
    {
        return [
            'name'         => ['required', 'string', 'max:100'],
            'beekeeper_id' => ['required', 'exists:users,id'],
            'species_id'   => ['nullable', 'exists:master_species,id'],
            'site_id'      => ['nullable', 'exists:master_sites,id'],
            'status'       => ['nullable', 'in:active,inactive'],
            'image'        => ['nullable', 'image', 'max:2048'],
        ];
    }
}
