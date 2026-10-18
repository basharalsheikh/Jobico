<?php

namespace App\Http\Requests\Admin;

use App\Models\Page;
use Illuminate\Foundation\Http\FormRequest;

class UpdatePageRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null
            && $this->user()->is_admin
            && $this->user()->is_active;
    }

    public function rules(): array
    {
        $page = $this->route('page');

        $slug = $page instanceof Page
            ? $page->slug
            : (is_string($page) ? $page : $this->route('slug'));

        $contentRules = match ($slug) {
            'home' => [
                'content' => ['required', 'array:vision,mission,values'],
                'content.vision' => ['required', 'string', 'max:5000'],
                'content.mission' => ['required', 'string', 'max:5000'],
                'content.values' => ['present', 'array', 'max:12'],
                'content.values.*' => ['required', 'array:title,body'],
                'content.values.*.title' => ['required', 'string', 'max:200'],
                'content.values.*.body' => ['required', 'string', 'max:5000'],
            ],

            'about' => [
                'content' => ['required', 'array:intro,timeline,expertise'],
                'content.intro' => ['required', 'string', 'max:10000'],
                'content.timeline' => ['required', 'array', 'max:30'],
                'content.timeline.*' => ['required', 'array:year,title,body'],
                'content.timeline.*.year' => ['required', 'string', 'max:20'],
                'content.timeline.*.title' => ['required', 'string', 'max:200'],
                'content.timeline.*.body' => ['required', 'string', 'max:5000'],
                'content.expertise' => ['required', 'array', 'max:30'],
                'content.expertise.*' => ['required', 'array:title,body'],
                'content.expertise.*.title' => ['required', 'string', 'max:200'],
                'content.expertise.*.body' => ['required', 'string', 'max:5000'],
            ],

            'projects', 'contact' => [
                'content' => ['required', 'array:intro'],
                'content.intro' => ['required', 'string', 'max:10000'],
            ],

            default => [
                'content' => ['prohibited'],
            ],
        };

        return array_merge([
            'title' => ['required', 'string', 'max:200'],
            'seo_title' => ['nullable', 'string', 'max:200'],
            'seo_description' => ['nullable', 'string', 'max:500'],
        ], $contentRules);
    }
}
