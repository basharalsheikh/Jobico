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

protected function prepareForValidation(): void
{
    $content = $this->input('content');

    if (is_string($content)) {
        $decoded = json_decode($content, true);

        if (json_last_error() === JSON_ERROR_NONE && is_array($decoded)) {
            $this->merge([
                'content' => $decoded,
            ]);
        }
    }
}


    public function rules(): array
    {
        $page = $this->route('page');

        $slug = $page instanceof Page
            ? $page->slug
            : (is_string($page) ? $page : $this->route('slug'));

        $contentRules = match ($slug) {

'home' => [
            'content' => [
                'required',
                'array:vision,mission,expertise_section,projects_section',
            ],

            'content.vision' => ['sometimes', 'nullable', 'string', 'max:5000'],
            'content.mission' => ['sometimes', 'nullable', 'string', 'max:5000'],

            // Our Expertise section
            'content.expertise_section' => [
                'sometimes',
                'array:eyebrow,title_line_1,title_line_2,description,image_media_id,image_caption_eyebrow,image_caption_title,items',
            ],
            'content.expertise_section.eyebrow' => ['sometimes', 'nullable', 'string', 'max:200'],
            'content.expertise_section.title_line_1' => ['sometimes', 'nullable', 'string', 'max:200'],
            'content.expertise_section.title_line_2' => ['sometimes', 'nullable', 'string', 'max:200'],
            'content.expertise_section.description' => ['sometimes', 'nullable', 'string', 'max:2000'],
            'content.expertise_section.image_media_id' => ['sometimes', 'nullable', 'integer', 'exists:media,id'],
            'content.expertise_section.image_caption_eyebrow' => ['sometimes', 'nullable', 'string', 'max:200'],
            'content.expertise_section.image_caption_title' => ['sometimes', 'nullable', 'string', 'max:200'],

            'content.expertise_section.items' => ['sometimes', 'array', 'max:10'],
            'content.expertise_section.items.*' => ['required', 'array:number,title,description'],
            'content.expertise_section.items.*.number' => ['required', 'string', 'max:10'],
            'content.expertise_section.items.*.title' => ['required', 'string', 'max:200'],
            'content.expertise_section.items.*.description' => ['required', 'string', 'max:1000'],

            // Our Projects section
            'content.projects_section' => [
                'sometimes',
                'array:meta_label,portfolio_label,eyebrow,title_line_1,title_line_2,description,items',
            ],
            'content.projects_section.meta_label' => ['sometimes', 'nullable', 'string', 'max:200'],
            'content.projects_section.portfolio_label' => ['sometimes', 'nullable', 'string', 'max:200'],
            'content.projects_section.eyebrow' => ['sometimes', 'nullable', 'string', 'max:200'],
            'content.projects_section.title_line_1' => ['sometimes', 'nullable', 'string', 'max:200'],
            'content.projects_section.title_line_2' => ['sometimes', 'nullable', 'string', 'max:200'],
            'content.projects_section.description' => ['sometimes', 'nullable', 'string', 'max:2000'],

            'content.projects_section.items' => ['sometimes', 'array', 'max:10'],
'content.projects_section.items.*' => [
    'required',
    'array:number,project_id,title,description,category',
],

'content.projects_section.items.*.project_id' => [
    'sometimes',
    'nullable',
    'integer',
    'exists:projects,id',
],            'content.projects_section.items.*.number' => ['required', 'string', 'max:10'],
            'content.projects_section.items.*.title' => ['required', 'string', 'max:200'],
            'content.projects_section.items.*.description' => ['required', 'string', 'max:1000'],
            'content.projects_section.items.*.category' => ['required', 'string', 'max:100'],
        ],


            'about' => [
                'content' => ['required', 'array:intro,timeline,expertise'],
                'content.intro' => ['sometimes', 'nullable', 'string', 'max:10000'],

                'content.timeline' => ['sometimes', 'array', 'max:30'],
                'content.timeline.*' => ['required', 'array:year,title,body'],
                'content.timeline.*.year' => ['sometimes', 'nullable', 'string', 'max:20'],
                'content.timeline.*.title' => ['sometimes', 'nullable', 'string', 'max:200'],
                'content.timeline.*.body' => ['sometimes', 'nullable', 'string', 'max:5000'],

                'content.expertise' => ['sometimes', 'array', 'max:30'],
                'content.expertise.*' => ['required', 'array:title,body'],
                'content.expertise.*.title' => ['sometimes', 'nullable', 'string', 'max:200'],
                'content.expertise.*.body' => ['sometimes', 'nullable', 'string', 'max:5000'],
            ],

            'projects', 'contact' => [
                'content' => ['required', 'array:intro'],
                'content.intro' => ['sometimes', 'nullable', 'string', 'max:10000'],
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
