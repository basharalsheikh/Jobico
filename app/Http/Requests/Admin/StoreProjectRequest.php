<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreProjectRequest extends FormRequest
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
            'title' => ['required', 'string', 'max:200'],
            'location' => ['nullable', 'string', 'max:200'],
            'category_id' => [
                'nullable',
                'integer',
                Rule::exists('project_categories', 'id'),
            ],
            'summary' => ['nullable', 'string', 'max:500'],
            'description' => ['nullable', 'string'],
            'quantity_text' => ['nullable', 'string', 'max:150'],
            'cover_media_id' => [
                'nullable',
                'integer',
                Rule::exists('media', 'id'),
            ],
            'gallery' => ['sometimes', 'array', 'max:30'],
            'gallery.*' => [
                'required',
                'integer',
                'distinct',
                Rule::exists('media', 'id'),
            ],
            'status' => [
                'sometimes',
                'required',
                Rule::in(['draft', 'published']),
            ],
            'sort_order' => [
                'sometimes',
                'required',
                'integer',
                'min:0',
            ],
            'source_ref' => [
                'nullable',
                'string',
                'max:50',
                Rule::unique('projects', 'source_ref'),
            ],
        ];
    }
}
