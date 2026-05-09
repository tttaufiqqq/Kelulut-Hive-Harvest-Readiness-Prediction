<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreIotNodeRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->hasRole('admin');
    }

    public function rules(): array
    {
        return [
            'node_identifier' => ['required', 'string', 'max:50', 'unique:iot_nodes,node_identifier'],
            'hive_id' => ['required', 'integer', 'exists:hives,id', Rule::unique('iot_nodes', 'hive_id')],
            'device_status' => ['required', Rule::in(['active', 'inactive'])],
            'installation_date' => ['required', 'date'],
            'last_maintenance_date' => ['nullable', 'date'],
        ];
    }

    public function messages(): array
    {
        return [
            'hive_id.unique' => 'This hive already has a device assigned.',
        ];
    }
}
