<?php
namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Models\HeroSlide;
use App\Models\SiteSetting;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
class SettingsController extends Controller
{
    public function show(): JsonResponse
    {
        $settings = SiteSetting::with('logoMedia')->first();

        if (! $settings) {
            return response()->json([
                'message' => 'Website settings have not been configured.',
            ], 404);
        }

        return response()->json([
            'data' => $settings,
        ]);
    }

    public function update(Request $request): JsonResponse
    {
        $settings = SiteSetting::first();

        if (! $settings) {
            return response()->json([
                'message' => 'Website settings have not been configured.',
            ], 404);
        }

        $validated = $request->validate([
            'company_name' => [
                'sometimes',
                'required',
                'string',
                'max:200',
            ],
            'header_subtitle' => [
                'sometimes',
                'required',
                'string',
                'max:200',
            ],
            'logo_media_id' => [
                'sometimes',
                'nullable',
                'integer',
                Rule::exists('media', 'id'),
            ],
            'hero_mode' => [
                'sometimes',
                'required',
                'string',
                Rule::in(['image', 'video', 'slider']),
            ],
            'address' => [
                'sometimes',
                'nullable',
                'string',
                'max:500',
            ],
            'phones' => ['sometimes', 'nullable', 'array'],
            'phones.*.label' => [
                'required_with:phones',
                'string',
                'max:100',
            ],
            'phones.*.value' => [
                'required_with:phones',
                'string',
                'max:50',
            ],
            'phones.*.is_visible' => [
                'required_with:phones',
                'boolean',
            ],
            'emails' => ['sometimes', 'nullable', 'array'],
            'emails.*.label' => [
                'required_with:emails',
                'string',
                'max:100',
            ],
            'emails.*.value' => [
                'required_with:emails',
                'email',
                'max:255',
            ],
            'emails.*.is_visible' => [
                'required_with:emails',
                'boolean',
            ],
            'map_url' => [
                'sometimes',
                'nullable',
                'url',
                'max:2048',
            ],
        ]);

        $heroMode = $validated['hero_mode'] ?? $settings->hero_mode;

        if (
            isset($validated['hero_mode'])
            && $heroMode === 'image'
            && ! HeroSlide::query()
                ->where('is_active', true)
                ->whereHas('media')
                ->exists()
        ) {
            return response()->json([
                'message' => 'Image mode requires at least one active hero slide with an image.',
            ], 409);
        }

        $settings->fill($validated);
        $settings->save();

        return response()->json([
            'message' => 'Website settings updated successfully.',
            'data' => $settings->fresh()->load('logoMedia'),
        ]);
    }
}
