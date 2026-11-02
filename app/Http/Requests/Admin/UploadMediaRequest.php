<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;

class UploadMediaRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null
            && $this->user()->is_admin
            && $this->user()->is_active;
    }

    public function rules(): array
    {
        return [
            'file' => [
                'required',
                'file',
                'mimes:jpg,jpeg,png,webp,mp4',
                'max:51200',
            ],
            'alt' => [
                'nullable',
                'string',
                'max:300',
            ],
        ];
    }
}
