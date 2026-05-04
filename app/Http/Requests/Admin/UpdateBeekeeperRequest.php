<?php

namespace App\Http\Requests\Admin;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class UpdateBeekeeperRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return $this->user()->hasRole('admin');
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        $userId = $this->route('user')?->id;

        return [
            'name' => ['required', 'string', 'min:2', 'max:255', 'regex:/^[\pL\s\'\-\.]+$/u'],
            'email' => ['required', 'email:rfc', 'max:255', "unique:users,email,{$userId}"],
            'phone' => ['nullable', 'string', 'regex:/^(\+?60|0)[0-9\-\s]{8,14}$/'],
        ];
    }
}
